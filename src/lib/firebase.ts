import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { Complaint, HotspotCluster, DashboardStats } from '../types';

// Initialize Firebase App instance singleton
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore with dedicated databaseId and ignoreUndefinedProperties
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true }, firebaseConfig.firestoreDatabaseId || '(default)');

// Provide Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();

export type OperationType = 'create' | 'read' | 'update' | 'delete' | 'list' | 'write';

export interface FirestoreErrorInfo {
  code: string;
  message: string;
  operationType: OperationType;
  path: string | null;
  userFacingMessage: string;
}

/**
 * Enhanced Firestore error handler per production standards
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const err = error as { code?: string; message?: string };
  const code = err.code || 'unknown';
  const rawMessage = err.message || String(error);

  let userFacingMessage = 'A database error occurred. Please try again.';

  if (code.includes('permission-denied') || rawMessage.includes('Missing or insufficient permissions')) {
    userFacingMessage = `Access denied (${operationType} at ${path || 'database'}). You do not have permission to perform this municipal operation.`;
  } else if (code.includes('not-found')) {
    userFacingMessage = `Requested record not found in municipal database.`;
  } else if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
    userFacingMessage = 'Municipal database service is temporarily unreachable. Please check your network connection.';
  } else if (code.includes('already-exists')) {
    userFacingMessage = 'A record with this identifier already exists.';
  }

  const errorInfo: FirestoreErrorInfo = {
    code,
    message: rawMessage,
    operationType,
    path,
    userFacingMessage,
  };

  console.warn(`[Firestore ${operationType} on ${path || 'unknown'}]:`, errorInfo);
  return errorInfo;
}

/**
 * Tests direct live connectivity to Cloud Firestore
 */
export async function testFirestoreConnection(): Promise<{
  connected: boolean;
  databaseId: string;
  projectId: string;
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    // Attempt reading test doc from server
    await getDocFromServer(doc(db, 'system', 'connection-health'));
    return {
      connected: true,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      projectId: firebaseConfig.projectId,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // permission-denied still proves live roundtrip connection to Cloud Firestore server
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      return {
        connected: true,
        databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
        projectId: firebaseConfig.projectId,
        latencyMs: Date.now() - startTime,
      };
    }
    return {
      connected: false,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      projectId: firebaseConfig.projectId,
      latencyMs: Date.now() - startTime,
      error: msg,
    };
  }
}

// -----------------------------------------------------------------------------
// Cloud Firestore Data Operations
// -----------------------------------------------------------------------------

export const COMPLAINTS_COLLECTION = 'complaints';
export const HOTSPOTS_COLLECTION = 'hotspots';
export const USERS_COLLECTION = 'users';
export const SYSTEM_COLLECTION = 'system';

/**
 * Fetch all complaints from Cloud Firestore
 */
export async function getComplaintsFromFirestore(): Promise<Complaint[]> {
  try {
    const q = query(collection(db, COMPLAINTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const complaints: Complaint[] = [];
    snapshot.forEach((docSnap) => {
      complaints.push(docSnap.data() as Complaint);
    });
    return complaints;
  } catch (error) {
    handleFirestoreError(error, 'list', COMPLAINTS_COLLECTION);
    throw error;
  }
}

/**
 * Subscribe to real-time complaint updates from Cloud Firestore
 */
export function subscribeToComplaintsFromFirestore(
  onUpdate: (complaints: Complaint[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COMPLAINTS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const complaints: Complaint[] = [];
      snapshot.forEach((docSnap) => {
        complaints.push(docSnap.data() as Complaint);
      });
      onUpdate(complaints);
    },
    (err) => {
      handleFirestoreError(err, 'read', COMPLAINTS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

/**
 * Retrieve a single complaint by unique ID
 */
export async function getComplaintFromFirestore(id: string): Promise<Complaint | null> {
  try {
    const docRef = doc(db, COMPLAINTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    return snap.data() as Complaint;
  } catch (error) {
    handleFirestoreError(error, 'read', `${COMPLAINTS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Save or overwrite a complaint in Cloud Firestore
 */
export async function saveComplaintToFirestore(complaint: Complaint): Promise<void> {
  try {
    const docRef = doc(db, COMPLAINTS_COLLECTION, complaint.id);
    await setDoc(docRef, complaint, { merge: true });
  } catch (error) {
    handleFirestoreError(error, 'write', `${COMPLAINTS_COLLECTION}/${complaint.id}`);
    throw error;
  }
}

/**
 * Update partial complaint fields (status, action logs, corroboration, notes)
 */
export async function updateComplaintInFirestore(
  id: string,
  updates: Partial<Complaint>
): Promise<void> {
  try {
    const docRef = doc(db, COMPLAINTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, 'update', `${COMPLAINTS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Save hotspots to Cloud Firestore
 */
export async function saveHotspotsToFirestore(hotspots: HotspotCluster[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const hotspot of hotspots) {
      const docRef = doc(db, HOTSPOTS_COLLECTION, hotspot.id);
      batch.set(docRef, hotspot, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, 'write', HOTSPOTS_COLLECTION);
    throw error;
  }
}

/**
 * Fetch hotspots from Cloud Firestore
 */
export async function getHotspotsFromFirestore(): Promise<HotspotCluster[]> {
  try {
    const snap = await getDocs(collection(db, HOTSPOTS_COLLECTION));
    const hotspots: HotspotCluster[] = [];
    snap.forEach((docSnap) => {
      hotspots.push(docSnap.data() as HotspotCluster);
    });
    return hotspots;
  } catch (error) {
    handleFirestoreError(error, 'list', HOTSPOTS_COLLECTION);
    return [];
  }
}

/**
 * Seed initial municipal dataset to Cloud Firestore if collection is empty or has fewer records
 */
export async function seedFirestoreIfEmpty(seedData: Complaint[]): Promise<number> {
  try {
    const snap = await getDocs(collection(db, COMPLAINTS_COLLECTION));
    if (snap.size < 10) {
      console.log(`[Firestore] Seeding ${seedData.length} initial civic reports to Firestore...`);
      // Firestore batch max size is 500
      const batch = writeBatch(db);
      for (const item of seedData) {
        const docRef = doc(db, COMPLAINTS_COLLECTION, item.id);
        batch.set(docRef, item);
      }
      await batch.commit();
      console.log(`[Firestore] Seeding completed: ${seedData.length} records saved to Cloud Firestore.`);
      return seedData.length;
    }
    return snap.size;
  } catch (error) {
    console.warn('[Firestore] Seed check or commit notice:', error);
    return 0;
  }
}

// -----------------------------------------------------------------------------
// Authentication Helper functions
// -----------------------------------------------------------------------------

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error) {
    console.error('[Firebase Auth] Google login error:', error);
    throw error;
  }
}

export async function loginAnonymously(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('[Firebase Auth] Anonymous login error:', error);
    throw error;
  }
}

export async function logOutUser(): Promise<void> {
  await signOut(auth);
}
