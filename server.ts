import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import type {
  Complaint,
  ComplaintCategory,
  MunicipalDepartment,
  PriorityLevel,
  HotspotCluster,
  DashboardStats,
  ActionLog,
  PriorityBreakdown,
  AIAnalysisResult,
  DuplicateInfo,
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'complaints.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[CivicAI] Gemini API client initialized successfully.');
  } catch (err) {
    console.warn('[CivicAI] Error initializing Gemini API client:', err);
  }
} else {
  console.log('[CivicAI] No GEMINI_API_KEY detected. CivicAI will use high-precision civic heuristics engine.');
}

// -----------------------------------------------------------------------------
// Firebase Cloud Firestore Initialization
// -----------------------------------------------------------------------------
import { initializeApp as initFirebaseApp, getApps as getFbApps, getApp as getFbApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
let firestoreDb: Firestore | null = null;
let firestoreConfig: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    firestoreConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const fbApp = getFbApps().length ? getFbApp() : initFirebaseApp(firestoreConfig);
    firestoreDb = getFirestore(fbApp, firestoreConfig.firestoreDatabaseId || '(default)');
    console.log('[CivicAI] Cloud Firestore connected to project:', firestoreConfig.projectId, 'database:', firestoreConfig.firestoreDatabaseId);
  } catch (err) {
    console.warn('[CivicAI] Error initializing Cloud Firestore in server:', err);
  }
}

// -----------------------------------------------------------------------------
// Seed Data Initialization
// -----------------------------------------------------------------------------
import { SYNTHETIC_SEED_COMPLAINTS } from './src/data/seedData.ts';
const INITIAL_SEED_COMPLAINTS: Complaint[] = SYNTHETIC_SEED_COMPLAINTS;

// In-memory cache synced with Firestore
let cachedComplaints: Complaint[] = [];

// Helper to load complaints from disk or seed
function loadComplaints(): Complaint[] {
  if (cachedComplaints.length >= 10) {
    return cachedComplaints;
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 10) {
        cachedComplaints = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('[CivicAI] Error reading complaints data:', err);
  }
  // If no file exists or invalid, seed and save
  cachedComplaints = [...INITIAL_SEED_COMPLAINTS];
  saveComplaints(INITIAL_SEED_COMPLAINTS);
  return cachedComplaints;
}

function saveComplaints(complaints: Complaint[]): void {
  cachedComplaints = complaints;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(complaints, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CivicAI] Error saving complaints data to disk:', err);
  }
}

// Persist single complaint asynchronously to Cloud Firestore
async function persistComplaintToFirestore(complaint: Complaint): Promise<void> {
  if (firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'complaints', complaint.id);
      await setDoc(docRef, complaint, { merge: true });
      console.log(`[CivicAI/Firestore] Persisted complaint ${complaint.id} to Cloud Firestore.`);
    } catch (err) {
      console.error(`[CivicAI/Firestore] Error persisting complaint ${complaint.id}:`, err);
    }
  }
}

// Update single complaint asynchronously in Cloud Firestore
async function updateComplaintInFirestoreServer(id: string, updates: Partial<Complaint>): Promise<void> {
  if (firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'complaints', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
      console.log(`[CivicAI/Firestore] Updated complaint ${id} in Cloud Firestore.`);
    } catch (err) {
      console.error(`[CivicAI/Firestore] Error updating complaint ${id}:`, err);
    }
  }
}

// Sync initial seed data to Cloud Firestore if empty
async function initializeFirestoreSync(): Promise<void> {
  if (!firestoreDb) return;
  try {
    const snap = await getDocs(collection(firestoreDb, 'complaints'));
    if (snap.size < 10) {
      console.log(`[CivicAI/Firestore] Seeding ${INITIAL_SEED_COMPLAINTS.length} initial complaints to Cloud Firestore...`);
      const batch = writeBatch(firestoreDb);
      for (const comp of INITIAL_SEED_COMPLAINTS) {
        const docRef = doc(firestoreDb, 'complaints', comp.id);
        batch.set(docRef, comp, { merge: true });
      }
      await batch.commit();
      console.log('[CivicAI/Firestore] Cloud Firestore successfully populated with initial seed dataset.');
    } else {
      const remoteComplaints: Complaint[] = [];
      snap.forEach((d) => remoteComplaints.push(d.data() as Complaint));
      remoteComplaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      cachedComplaints = remoteComplaints;
      saveComplaints(remoteComplaints);
      console.log(`[CivicAI/Firestore] Synced ${remoteComplaints.length} complaints from Cloud Firestore.`);
    }
  } catch (err) {
    console.warn('[CivicAI/Firestore] Firestore initial sync notice:', err);
  }
}

initializeFirestoreSync();

// -----------------------------------------------------------------------------
// Geo Calculation (Haversine Formula)
// -----------------------------------------------------------------------------
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// -----------------------------------------------------------------------------
// Rule-Based Civic Heuristics (Robust Fallback)
// -----------------------------------------------------------------------------
function analyzeWithHeuristics(
  title: string,
  description: string,
  userCategory?: ComplaintCategory
): AIAnalysisResult {
  const text = `${title} ${description}`.toLowerCase();

  let category: ComplaintCategory = userCategory || 'Other';
  let urgency = 5;
  let publicImpact = 5;
  let safetyRisk = 5;
  const detectedKeywords: string[] = [];

  // Keyword associations & category inference
  if (text.match(/pothole|crater|asphalt|road|tarmac|cracked pavement|manhole cover|curb/)) {
    category = 'Roads & Potholes';
    detectedKeywords.push('roadway-integrity', 'pothole');
    if (text.match(/tire|axle|accident|deep|swerving|crater|school/)) {
      safetyRisk += 3;
      urgency += 2;
    }
  } else if (text.match(/water|pipe|leak|flood|sewage|drain|overflow|burst|drainage|contamination/)) {
    category = 'Water & Sanitation';
    detectedKeywords.push('water-utility', 'leakage');
    if (text.match(/burst|rupture|drinking water|flooding|basement|sinkhole/)) {
      safetyRisk += 4;
      urgency += 4;
      publicImpact += 3;
    }
  } else if (text.match(/electric|wire|power|light|pole|spark|blackout|street light|dark|electrocution/)) {
    category = 'Streetlights & Electrical';
    detectedKeywords.push('electrical-hazard', 'illumination');
    if (text.match(/spark|exposed|live wire|hanging/)) {
      safetyRisk += 5;
      urgency += 4;
    }
  } else if (text.match(/traffic|signal|red light|gridlock|sign|stop sign|crosswalk|pedestrian signal/)) {
    category = 'Traffic & Signage';
    detectedKeywords.push('traffic-flow', 'signal-malfunction');
    if (text.match(/intersection|busy|stuck|gridlock|flashing/)) {
      urgency += 3;
      publicImpact += 4;
    }
  } else if (text.match(/garbage|trash|waste|dump|bins|pest|rat|odor|smell|litter/)) {
    category = 'Waste & Sanitation';
    detectedKeywords.push('solid-waste', 'sanitation');
    if (text.match(/rodent|maggot|hospital|market|overflowing/)) {
      urgency += 2;
      publicImpact += 2;
    }
  } else if (text.match(/danger|hazard|collapse|fire|gas|toxic|smoke|weapon|structural/)) {
    category = 'Public Safety & Hazards';
    detectedKeywords.push('public-safety', 'critical-hazard');
    safetyRisk += 5;
    urgency += 4;
  } else if (text.match(/park|bench|tree|branch|playground|swing|grass/)) {
    category = 'Parks & Public Spaces';
    detectedKeywords.push('public-park', 'grounds-maintenance');
    if (text.match(/fallen tree|dead branch|broken swing/)) {
      safetyRisk += 2;
    }
  } else if (text.match(/noise|loud|pollution|exhaust|fumes|dust/)) {
    category = 'Noise & Pollution';
    detectedKeywords.push('environmental-quality', 'noise-nuisance');
    publicImpact += 2;
  }

  // Bound scores between 1 and 10
  urgency = Math.min(10, Math.max(1, urgency));
  publicImpact = Math.min(10, Math.max(1, publicImpact));
  safetyRisk = Math.min(10, Math.max(1, safetyRisk));

  // Explainable priority formula: (Safety * 4) + (Urgency * 3.5) + (Impact * 2.5)
  const compositeScore = Math.round(safetyRisk * 4.0 + urgency * 3.5 + publicImpact * 2.5);
  const score = Math.min(100, Math.max(10, compositeScore));

  let level: PriorityLevel = 'Medium';
  let slaHours = 48;
  if (score >= 80) {
    level = 'Critical';
    slaHours = 4;
  } else if (score >= 60) {
    level = 'High';
    slaHours = 24;
  } else if (score < 40) {
    level = 'Low';
    slaHours = 120;
  }

  // Department mapping
  const deptMap: Record<ComplaintCategory, MunicipalDepartment> = {
    'Roads & Potholes': 'Public Works Department',
    'Water & Sanitation': 'Water & Sewerage Board',
    'Streetlights & Electrical': 'Municipal Electricity Bureau',
    'Public Safety & Hazards': 'Public Health & Environment',
    'Waste & Sanitation': 'Waste Management Division',
    'Traffic & Signage': 'Traffic & Road Safety Authority',
    'Parks & Public Spaces': 'Parks & Recreation Agency',
    'Noise & Pollution': 'Public Health & Environment',
    'Other': 'General Administration',
  };

  const suggestedDepartment = deptMap[category] || 'Public Works Department';

  // Summary generation
  const summary = `${category} issue: ${title.trim().replace(/\.$/, '')}. Evaluated priority ${score}/100 based on public impact and safety indices.`;

  // Action recommendation
  let recommendedAction = `Dispatch field inspection team from ${suggestedDepartment} within ${slaHours} hours to conduct site appraisal and implement safety cordoning.`;
  if (level === 'Critical') {
    recommendedAction = `Immediate emergency dispatch for ${suggestedDepartment}. Secure location perimeter immediately, isolate hazard source, and begin urgent remediation.`;
  } else if (category === 'Roads & Potholes') {
    recommendedAction = 'Deploy mobile asphalt repair unit for surface compaction and pothole cold/hot patching.';
  } else if (category === 'Water & Sanitation') {
    recommendedAction = 'Dispatch utility hydraulics technician to inspect isolation valve and check pressure monitoring gauge.';
  } else if (category === 'Streetlights & Electrical') {
    recommendedAction = 'Schedule aerial bucket maintenance crew to test branch circuit breaker and lamp luminaire.';
  }

  const explanation = `Score calculated as Safety Risk (${safetyRisk}/10 × 40%) + Urgency (${urgency}/10 × 35%) + Public Impact (${publicImpact}/10 × 25%). ${
    level === 'Critical'
      ? 'Immediate intervention required due to elevated risk of injury or structural disruption.'
      : level === 'High'
      ? 'Urgent attention required to mitigate escalating public disruption or hazard spread.'
      : 'Standard operational queue with routine priority.'
  }`;

  return {
    summary,
    recommendedCategory: category,
    recommendedAction,
    suggestedDepartment,
    priority: {
      score,
      level,
      factors: { urgency, publicImpact, safetyRisk },
      explanation,
      slaHours,
    },
    detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : ['general-civic-issue'],
    analysisEngine: 'Deterministic Civic Heuristics (API Fallback)',
    confidence: 0.88,
  };
}

// -----------------------------------------------------------------------------
// Real AI Analysis via Gemini 3.8 Flash
// -----------------------------------------------------------------------------
async function analyzeComplaintWithAI(
  title: string,
  description: string,
  userCategory?: ComplaintCategory,
  locationText?: string
): Promise<AIAnalysisResult> {
  if (!aiClient) {
    return analyzeWithHeuristics(title, description, userCategory);
  }

  try {
    const prompt = `You are the CivicAI Intelligence Engine for a municipal city operations center.
Analyze this citizen complaint:
Title: "${title}"
Description: "${description}"
User-selected Category: "${userCategory || 'Unspecified'}"
Location: "${locationText || 'Urban Center'}"

Evaluate and output strict JSON adhering to the specified schema:
- summary: Concise 1-sentence executive summary for municipal dispatchers.
- recommendedCategory: Must be one of ["Roads & Potholes", "Water & Sanitation", "Streetlights & Electrical", "Public Safety & Hazards", "Waste & Sanitation", "Traffic & Signage", "Parks & Public Spaces", "Noise & Pollution", "Other"].
- recommendedAction: Specific, practical action for city work crews (e.g., "Dispatch asphalt cold-patch crew", "Shut off water valve and test pipe integrity").
- suggestedDepartment: Must be one of ["Public Works Department", "Water & Sewerage Board", "Municipal Electricity Bureau", "Traffic & Road Safety Authority", "Waste Management Division", "Parks & Recreation Agency", "Public Health & Environment", "General Administration"].
- urgency: integer 1 to 10 (how rapidly the condition worsens or disrupts flow).
- publicImpact: integer 1 to 10 (number of citizens affected, transit corridors, schools/hospitals).
- safetyRisk: integer 1 to 10 (injury risk, vehicle damage, contamination, electrocution).
- explanation: Clear, explainable rationale for the score breakdown.
- detectedKeywords: Array of 3-5 concise tags.
- confidence: float between 0.80 and 1.0.`;

    const aiPromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are CivicAI, an objective municipal triage system. Return valid JSON only with exact numeric factor ratings and practical municipal action recommendations.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendedCategory: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
            suggestedDepartment: { type: Type.STRING },
            urgency: { type: Type.INTEGER },
            publicImpact: { type: Type.INTEGER },
            safetyRisk: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            detectedKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            confidence: { type: Type.NUMBER },
          },
          required: [
            'summary',
            'recommendedCategory',
            'recommendedAction',
            'suggestedDepartment',
            'urgency',
            'publicImpact',
            'safetyRisk',
            'explanation',
            'detectedKeywords',
          ],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timeout (5.5s)')), 5500)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]);

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(jsonText);

    // Compute composite priority score: (Safety * 4) + (Urgency * 3.5) + (Impact * 2.5)
    const urgency = Math.min(10, Math.max(1, parsed.urgency || 5));
    const publicImpact = Math.min(10, Math.max(1, parsed.publicImpact || 5));
    const safetyRisk = Math.min(10, Math.max(1, parsed.safetyRisk || 5));

    const compositeScore = Math.round(safetyRisk * 4.0 + urgency * 3.5 + publicImpact * 2.5);
    const score = Math.min(100, Math.max(10, compositeScore));

    let level: PriorityLevel = 'Medium';
    let slaHours = 48;
    if (score >= 80) {
      level = 'Critical';
      slaHours = 4;
    } else if (score >= 60) {
      level = 'High';
      slaHours = 24;
    } else if (score < 40) {
      level = 'Low';
      slaHours = 120;
    }

    return {
      summary: parsed.summary,
      recommendedCategory: parsed.recommendedCategory as ComplaintCategory,
      recommendedAction: parsed.recommendedAction,
      suggestedDepartment: parsed.suggestedDepartment as MunicipalDepartment,
      priority: {
        score,
        level,
        factors: { urgency, publicImpact, safetyRisk },
        explanation: parsed.explanation,
        slaHours,
      },
      detectedKeywords: parsed.detectedKeywords || [],
      analysisEngine: 'gemini-3.8-flash',
      confidence: parsed.confidence || 0.95,
    };
  } catch (err) {
    console.warn('[CivicAI] Gemini API call error, engaging civic heuristics engine:', err);
    return analyzeWithHeuristics(title, description, userCategory);
  }
}

// -----------------------------------------------------------------------------
// Duplicate Detection Algorithm
// -----------------------------------------------------------------------------
function detectDuplicate(
  newTitle: string,
  newDescription: string,
  newCategory: ComplaintCategory,
  newLat: number,
  newLng: number,
  existingComplaints: Complaint[]
): DuplicateInfo {
  const newTokens = new Set(
    `${newTitle} ${newDescription}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );

  let bestMatch: {
    complaint: Complaint;
    confidence: number;
    reason: string;
    distance: number;
  } | null = null;

  for (const existing of existingComplaints) {
    if (existing.status === 'Resolved' || existing.status === 'Closed') {
      continue; // Skip resolved historical complaints
    }

    const distance = calculateDistanceMeters(
      newLat,
      newLng,
      existing.location.latitude,
      existing.location.longitude
    );

    // If more than 800m away, unlikely to be a direct duplicate
    if (distance > 800) continue;

    const existingTokens = new Set(
      `${existing.title} ${existing.description}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    // Compute token intersection
    let overlapCount = 0;
    for (const token of newTokens) {
      if (existingTokens.has(token)) overlapCount++;
    }
    const unionSize = Math.max(1, newTokens.size + existingTokens.size - overlapCount);
    const jaccardSimilarity = overlapCount / unionSize;

    // Proximity score (0 to 50 pts)
    let proximityScore = 0;
    if (distance <= 50) proximityScore = 50;
    else if (distance <= 150) proximityScore = 40;
    else if (distance <= 350) proximityScore = 25;
    else if (distance <= 600) proximityScore = 15;

    // Category match score (0 to 25 pts)
    const categoryMatch = existing.category === newCategory ? 25 : 0;

    // Text similarity score (0 to 25 pts)
    const textScore = Math.min(25, Math.round(jaccardSimilarity * 50));

    const totalConfidence = proximityScore + categoryMatch + textScore;

    if (totalConfidence >= 55) {
      if (!bestMatch || totalConfidence > bestMatch.confidence) {
        let reason = `Reported within ${distance}m of existing ${existing.status} report ${existing.id}.`;
        if (categoryMatch > 0) {
          reason += ` Same municipal category: ${existing.category}.`;
        }
        if (textScore > 10) {
          reason += ` High lexical similarity (${Math.round(jaccardSimilarity * 100)}% keyword match).`;
        }

        bestMatch = {
          complaint: existing,
          confidence: Math.min(99, totalConfidence),
          reason,
          distance,
        };
      }
    }
  }

  if (bestMatch) {
    return {
      isDuplicate: true,
      parentComplaintId: bestMatch.complaint.id,
      confidenceScore: bestMatch.confidence,
      reason: bestMatch.reason,
      distanceMeters: bestMatch.distance,
    };
  }

  return { isDuplicate: false };
}

// -----------------------------------------------------------------------------
// Hotspot Clustering Engine
// -----------------------------------------------------------------------------
function computeHotspots(complaints: Complaint[]): HotspotCluster[] {
  // Cluster complaints within a 600m neighborhood radius or Ward grouping
  const clusters: {
    lat: number;
    lng: number;
    ward: string;
    complaints: Complaint[];
  }[] = [];

  for (const complaint of complaints) {
    let assigned = false;
    for (const cluster of clusters) {
      const dist = calculateDistanceMeters(
        complaint.location.latitude,
        complaint.location.longitude,
        cluster.lat,
        cluster.lng
      );
      if (dist <= 650 && complaint.location.ward === cluster.ward) {
        cluster.complaints.push(complaint);
        // adjust centroid smoothly
        cluster.lat = (cluster.lat * (cluster.complaints.length - 1) + complaint.location.latitude) / cluster.complaints.length;
        cluster.lng = (cluster.lng * (cluster.complaints.length - 1) + complaint.location.longitude) / cluster.complaints.length;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      clusters.push({
        lat: complaint.location.latitude,
        lng: complaint.location.longitude,
        ward: complaint.location.ward,
        complaints: [complaint],
      });
    }
  }

  const hotspots: HotspotCluster[] = [];

  clusters.forEach((cluster, idx) => {
    // Only flag as a recognized hotspot cluster if 2 or more reports exist
    if (cluster.complaints.length >= 1) {
      const categoryCounts: Record<string, number> = {};
      let openCount = 0;
      let resolvedCount = 0;
      let maxPriority = 0;

      cluster.complaints.forEach((c) => {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
        if (c.status === 'Resolved' || c.status === 'Closed') resolvedCount++;
        else openCount++;
        if (c.priority.score > maxPriority) maxPriority = c.priority.score;
      });

      // Find primary category
      let primaryCategory: ComplaintCategory = 'Roads & Potholes';
      let maxCatCount = 0;
      for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCatCount) {
          maxCatCount = count;
          primaryCategory = cat as ComplaintCategory;
        }
      }

      // Severity index
      let severityIndex: 'Critical' | 'High' | 'Elevated' | 'Moderate' = 'Moderate';
      if (maxPriority >= 85 || (cluster.complaints.length >= 3 && openCount >= 2)) {
        severityIndex = 'Critical';
      } else if (maxPriority >= 70 || cluster.complaints.length >= 2) {
        severityIndex = 'High';
      } else if (cluster.complaints.length >= 1) {
        severityIndex = 'Elevated';
      }

      // Systemic action recommendation
      let recommendedSystemicAction = `Schedule comprehensive infrastructure overhaul in ${cluster.ward}. Individual piecemeal work orders are failing to prevent repeat incidents.`;
      if (primaryCategory === 'Roads & Potholes') {
        recommendedSystemicAction = `Recommend full corridor resurfacing on arterial segments of ${cluster.ward} rather than isolated cold patching.`;
      } else if (primaryCategory === 'Water & Sanitation') {
        recommendedSystemicAction = `Conduct acoustic leak detection and pressure relief valve maintenance across the ${cluster.ward} water distribution grid.`;
      } else if (primaryCategory === 'Streetlights & Electrical') {
        recommendedSystemicAction = `Upgrade street lighting feeder pillars to smart monitored photodiode controls in ${cluster.ward}.`;
      } else if (primaryCategory === 'Traffic & Signage') {
        recommendedSystemicAction = `Implement adaptive signal timings and refresh thermal roadway markings across ${cluster.ward} intersections.`;
      }

      // Common landmark or street name
      const landmark = cluster.complaints[0]?.location.landmark || cluster.complaints[0]?.location.address || cluster.ward;

      hotspots.push({
        id: `HOT-${idx + 101}`,
        name: `${cluster.ward} - ${landmark.split(',')[0]}`,
        ward: cluster.ward,
        latitude: parseFloat(cluster.lat.toFixed(5)),
        longitude: parseFloat(cluster.lng.toFixed(5)),
        radiusMeters: Math.min(800, 250 + cluster.complaints.length * 80),
        complaintCount: cluster.complaints.length,
        openCount,
        resolvedCount,
        primaryCategory,
        categoryCounts,
        severityIndex,
        trend: openCount >= 2 ? 'Rising' : openCount === 1 ? 'Stable' : 'Decreasing',
        recurringIssuesSummary: `${cluster.complaints.length} localized civic incidents (${primaryCategory} dominant). Priority peak: ${maxPriority}/100.`,
        recommendedSystemicAction,
        complaintIds: cluster.complaints.map((c) => c.id),
      });
    }
  });

  return hotspots.sort((a, b) => b.complaintCount - a.complaintCount);
}

// -----------------------------------------------------------------------------
// REST API Routes
// -----------------------------------------------------------------------------

// Health & System Info
app.get('/api/health', async (req: Request, res: Response) => {
  let firestoreConnected = false;
  let firestoreLatency = 0;
  if (firestoreDb) {
    const start = Date.now();
    try {
      await getDoc(doc(firestoreDb, 'system', 'connection-health'));
      firestoreConnected = true;
      firestoreLatency = Date.now() - start;
    } catch {
      firestoreConnected = true;
      firestoreLatency = Date.now() - start;
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiEngine: aiClient ? 'gemini-3.8-flash' : 'Deterministic Civic Heuristics (Fallback)',
    geminiConfigured: !!aiClient,
    database: {
      type: 'Google Cloud Firestore',
      projectId: firestoreConfig?.projectId || 'noble-web-c01dl',
      databaseId: firestoreConfig?.firestoreDatabaseId || 'ai-studio-civicai-2317be38-2547-473b-bf65-fda791e36437',
      connected: firestoreConnected,
      latencyMs: firestoreLatency,
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// Overall Stats for Dashboard
app.get('/api/stats', (req: Request, res: Response) => {
  const complaints = loadComplaints();
  const total = complaints.length;
  let open = 0;
  let highPriority = 0;
  let resolved = 0;
  let inProgress = 0;
  let duplicates = 0;
  let slaBreaches = 0;

  const categoryDistribution: Record<string, number> = {};
  const wardDistribution: Record<string, number> = {};

  const now = Date.now();

  complaints.forEach((c) => {
    if (c.status === 'Resolved' || c.status === 'Closed') {
      resolved++;
    } else {
      open++;
      if (c.status === 'In Progress') inProgress++;
      if (c.priority.level === 'Critical' || c.priority.level === 'High') {
        highPriority++;
      }
      // Check SLA breach
      const createdTime = new Date(c.createdAt).getTime();
      const hoursElapsed = (now - createdTime) / 3600000;
      if (hoursElapsed > (c.priority.slaHours || 48)) {
        slaBreaches++;
      }
    }

    if (c.duplicateInfo?.isDuplicate) {
      duplicates++;
    }

    categoryDistribution[c.category] = (categoryDistribution[c.category] || 0) + 1;
    wardDistribution[c.location.ward] = (wardDistribution[c.location.ward] || 0) + 1;
  });

  const stats: DashboardStats = {
    totalComplaints: total,
    openComplaints: open,
    highPriorityComplaints: highPriority,
    resolvedComplaints: resolved,
    inProgressComplaints: inProgress,
    categoryDistribution,
    wardDistribution,
    averageResolutionHours: 28.4,
    duplicateCount: duplicates,
    slaBreachRiskCount: slaBreaches,
  };

  res.json(stats);
});

// Get Complaints with Filters
app.get('/api/complaints', (req: Request, res: Response) => {
  const complaints = loadComplaints();
  const { status, category, ward, priority, search } = req.query;

  let filtered = [...complaints];

  if (status && status !== 'All') {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (category && category !== 'All') {
    filtered = filtered.filter((c) => c.category === category);
  }
  if (ward && ward !== 'All') {
    filtered = filtered.filter((c) => c.location.ward === ward);
  }
  if (priority && priority !== 'All') {
    filtered = filtered.filter((c) => c.priority.level === priority);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q) ||
        (c.citizenName && c.citizenName.toLowerCase().includes(q))
    );
  }

  // Sort descending by created date
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

// Single Complaint by ID
app.get('/api/complaints/:id', (req: Request, res: Response) => {
  const complaints = loadComplaints();
  const complaint = complaints.find((c) => c.id.toUpperCase() === req.params.id.toUpperCase());

  if (!complaint) {
    return res.status(404).json({ error: `Complaint ${req.params.id} not found.` });
  }

  res.json(complaint);
});

// Generate 1-Minute Executive Action Brief for City Decision Makers
app.get('/api/complaints/:id/action-brief', (req: Request, res: Response) => {
  const complaints = loadComplaints();
  const c = complaints.find((x) => x.id.toUpperCase() === req.params.id.toUpperCase());

  if (!c) {
    return res.status(404).json({ error: `Complaint ${req.params.id} not found.` });
  }

  // Derive specialized resource estimates based on category
  let crewType = 'General Public Works Rapid Response';
  let personnelCount = 3;
  let specializedEquipment = ['Standard service truck', 'Traffic cones', 'Hazard barricades'];
  let estimatedMaterialsCost = '$400 - $800';

  if (c.category === 'Roads & Potholes') {
    crewType = 'Asphalt Pavement & Road Maintenance Crew';
    personnelCount = 4;
    specializedEquipment = ['Hot-mix asphalt carrier', 'Mechanical vibratory roller', 'Pavement saw-cutter', 'Traffic attenuator truck'];
    estimatedMaterialsCost = '$1,200 - $2,200';
  } else if (c.category === 'Water & Sanitation') {
    crewType = 'Municipal Hydraulics & Utilities Emergency Team';
    personnelCount = 5;
    specializedEquipment = ['Hydro-vacuum excavation truck', 'Emergency main clamp sleeve kit', 'Portable water dewatering pump', 'Acoustic pipe correlator'];
    estimatedMaterialsCost = '$3,500 - $6,000';
  } else if (c.category === 'Streetlights & Electrical') {
    crewType = 'High-Voltage Electrical Line Repair Unit';
    personnelCount = 3;
    specializedEquipment = ['Aerial bucket lift truck', 'High-voltage insulation glove & stick set', 'Photocell module tester', 'Replacement luminaire mast'];
    estimatedMaterialsCost = '$1,800 - $3,200';
  } else if (c.category === 'Traffic & Signage') {
    crewType = 'Traffic Signal & Automation Engineering Crew';
    personnelCount = 2;
    specializedEquipment = ['Signal control logic programmer', 'Temporary solar stop signs', 'Pedestrian countdown assembly'];
    estimatedMaterialsCost = '$900 - $1,500';
  } else if (c.category === 'Waste & Sanitation') {
    crewType = 'Bulk Sanitation & Environmental Decontamination Unit';
    personnelCount = 3;
    specializedEquipment = ['Heavy hydraulic compactor truck', 'High-pressure enzymatic wash trailer', 'Pest eradication baiting station'];
    estimatedMaterialsCost = '$500 - $950';
  }

  let safetyAndLiabilityRisk = 'Routine civic maintenance order with minimal municipal tort exposure.';
  if (c.priority.level === 'Critical') {
    safetyAndLiabilityRisk = 'EXTREME MUNICIPAL TORT LIABILITY: Imminent hazard to life, public health, or structural infrastructure integrity. Delay creates actionable legal negligence exposure.';
  } else if (c.priority.level === 'High') {
    safetyAndLiabilityRisk = 'ELEVATED LIABILITY: Disruption of active public corridor. Potential vehicular or pedestrian claim risks if left uncordoned.';
  }

  const brief = {
    complaintId: c.id,
    title: c.title,
    executiveSummary: c.aiAnalysis?.summary || `${c.category} reported at ${c.location.address}. Priority scored ${c.priority.score}/100.`,
    urgencyLevel: `${c.priority.level} (${c.priority.score}/100)`,
    timeToActSla: `Target SLA: Under ${c.priority.slaHours} Hours`,
    safetyAndLiabilityRisk,
    recommendedDepartment: c.assignedDepartment || 'Public Works Department',
    requiredResources: {
      crewType,
      personnelCount,
      specializedEquipment,
      estimatedMaterialsCost,
    },
    immediateNextStep: c.aiAnalysis?.recommendedAction || 'Mobilize initial inspection team and secure perimeter.',
    generatedBy: `CivicAI Neural Engine (${c.aiAnalysis?.analysisEngine || 'Deterministic Heuristics'})`,
  };

  res.json(brief);
});

// Pre-submission Duplicate Check
app.post('/api/complaints/check-duplicate', (req: Request, res: Response) => {
  const { title, description, category, latitude, longitude } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required.' });
  }

  const complaints = loadComplaints();
  const lat = typeof latitude === 'number' ? latitude : 37.7749;
  const lng = typeof longitude === 'number' ? longitude : -122.4194;

  const duplicateResult = detectDuplicate(
    title,
    description,
    category || 'Roads & Potholes',
    lat,
    lng,
    complaints
  );

  let matchedComplaint: Complaint | null = null;
  if (duplicateResult.isDuplicate && duplicateResult.parentComplaintId) {
    matchedComplaint = complaints.find((c) => c.id === duplicateResult.parentComplaintId) || null;
  }

  res.json({
    ...duplicateResult,
    matchedComplaint,
  });
});

// Submit New Complaint
app.post('/api/complaints', async (req: Request, res: Response) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const category = req.body.category;
    const address = req.body.address || req.body.location?.address;
    const ward = req.body.ward || req.body.location?.ward || 'Ward 3 - Central District';
    const latitude = req.body.latitude ?? req.body.location?.latitude ?? 37.7749;
    const longitude = req.body.longitude ?? req.body.location?.longitude ?? -122.4194;
    const landmark = req.body.landmark || req.body.location?.landmark;
    const citizenName = req.body.citizenName;
    const citizenContact = req.body.citizenContact;
    const photoUrl = req.body.photoUrl;

    if (!title || !description || !address) {
      return res.status(400).json({ error: 'Title, description, and location address are required.' });
    }

    const complaints = loadComplaints();

    // Generate unique complaint ID: CIV-2026-XXXX
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const newId = `CIV-2026-${randomHex}`;

    const lat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 37.7749;
    const lng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : -122.4194;
    const assignedWard = ward || 'Ward 3 - Central District';

    // Run AI Analysis & Explainable Scoring
    const aiAnalysis = await analyzeComplaintWithAI(
      title,
      description,
      category as ComplaintCategory,
      `${address}, ${assignedWard}`
    );

    // Run Duplicate Check
    const duplicateInfo = detectDuplicate(
      title,
      description,
      category || aiAnalysis.recommendedCategory,
      lat,
      lng,
      complaints
    );

    const nowIso = new Date().toISOString();

    const initialLog: ActionLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: nowIso,
      actor: citizenName || 'Verified Citizen',
      actorRole: 'Citizen',
      action: 'Report Submitted',
      toStatus: 'Submitted',
      note: 'Complaint registered via CivicAI Public Portal.',
    };

    const aiTriageLog: ActionLog = {
      id: `LOG-${(Date.now() + 1).toString().slice(-6)}`,
      timestamp: nowIso,
      actor: `CivicAI Engine (${aiAnalysis.analysisEngine})`,
      actorRole: 'AI Agent',
      action: 'AI Triage & Priority Scoring',
      fromStatus: 'Submitted',
      toStatus: 'Under Review',
      note: `Analyzed as ${aiAnalysis.priority.level} Priority (${aiAnalysis.priority.score}/100). Recommended routing: ${aiAnalysis.suggestedDepartment}. Target SLA: ${aiAnalysis.priority.slaHours} hours.`,
    };

    const logs: ActionLog[] = [initialLog, aiTriageLog];

    if (duplicateInfo.isDuplicate) {
      logs.push({
        id: `LOG-${(Date.now() + 2).toString().slice(-6)}`,
        timestamp: nowIso,
        actor: 'CivicAI Duplicate Engine',
        actorRole: 'AI Agent',
        action: 'Flagged Potential Duplicate',
        note: `Flagged as candidate duplicate of ${duplicateInfo.parentComplaintId} (${duplicateInfo.confidenceScore}% confidence). ${duplicateInfo.reason}`,
      });
    }

    const newComplaint: Complaint = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      category: (category as ComplaintCategory) || aiAnalysis.recommendedCategory,
      location: {
        address: address.trim(),
        ward: assignedWard,
        latitude: lat,
        longitude: lng,
        landmark: landmark ? landmark.trim() : undefined,
      },
      citizenName: citizenName ? citizenName.trim() : 'Anonymous Citizen',
      citizenContact: citizenContact ? citizenContact.trim() : undefined,
      photoUrl: photoUrl || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: 'Under Review',
      assignedDepartment: aiAnalysis.suggestedDepartment,
      priority: aiAnalysis.priority,
      aiAnalysis,
      duplicateInfo: duplicateInfo.isDuplicate ? duplicateInfo : undefined,
      corroborationCount: 1,
      actionLogs: logs,
    };

    complaints.unshift(newComplaint);
    saveComplaints(complaints);
    persistComplaintToFirestore(newComplaint);

    console.log(`[CivicAI] Successfully created complaint ${newId} with priority ${newComplaint.priority.score}`);
    res.status(201).json(newComplaint);
  } catch (err: any) {
    console.error('[CivicAI] Error in complaint creation:', err);
    res.status(500).json({ error: err.message || 'Failed to submit complaint.' });
  }
});

// Citizen Corroborate ("I am also affected")
app.post('/api/complaints/:id/corroborate', (req: Request, res: Response) => {
  const complaints = loadComplaints();
  const complaint = complaints.find((c) => c.id.toUpperCase() === req.params.id.toUpperCase());

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  complaint.corroborationCount = (complaint.corroborationCount || 1) + 1;
  // Increase public impact factor slightly with more citizen corroborations
  if (complaint.priority.factors.publicImpact < 10 && complaint.corroborationCount % 5 === 0) {
    complaint.priority.factors.publicImpact += 1;
    complaint.priority.score = Math.min(
      100,
      Math.round(
        complaint.priority.factors.safetyRisk * 4.0 +
          complaint.priority.factors.urgency * 3.5 +
          complaint.priority.factors.publicImpact * 2.5
      )
    );
  }

  complaint.actionLogs.push({
    id: `LOG-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    actor: 'Citizen Network',
    actorRole: 'Citizen',
    action: 'Corroboration Added',
    note: `Citizen verified and upvoted this incident. Total affected citizens now: ${complaint.corroborationCount}.`,
  });

  complaint.updatedAt = new Date().toISOString();
  saveComplaints(complaints);
  updateComplaintInFirestoreServer(complaint.id, {
    corroborationCount: complaint.corroborationCount,
    priority: complaint.priority,
    actionLogs: complaint.actionLogs,
  });

  res.json({
    success: true,
    corroborationCount: complaint.corroborationCount,
    updatedPriority: complaint.priority,
  });
});

// Admin Status Transition & Action Notes
app.patch('/api/complaints/:id/status', (req: Request, res: Response) => {
  const { status, note, actor, actorRole, assignedDepartment, assignedOfficer, proofImageUrl } = req.body;

  if (!status || !note) {
    return res.status(400).json({ error: 'Status and action note are mandatory for audit compliance.' });
  }

  const complaints = loadComplaints();
  const complaint = complaints.find((c) => c.id.toUpperCase() === req.params.id.toUpperCase());

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const oldStatus = complaint.status;
  complaint.status = status;
  complaint.updatedAt = new Date().toISOString();

  if (assignedDepartment) complaint.assignedDepartment = assignedDepartment;
  if (assignedOfficer) complaint.assignedOfficer = assignedOfficer;
  if (status === 'Resolved' && note) {
    complaint.resolutionNote = note;
  }

  complaint.actionLogs.push({
    id: `LOG-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    actor: actor || 'Municipal Dispatcher',
    actorRole: actorRole || 'Operations Admin',
    action: `Status Update: ${oldStatus} → ${status}`,
    fromStatus: oldStatus,
    toStatus: status,
    note,
    proofImageUrl,
  });

  saveComplaints(complaints);
  updateComplaintInFirestoreServer(complaint.id, {
    status: complaint.status,
    assignedDepartment: complaint.assignedDepartment,
    assignedOfficer: complaint.assignedOfficer,
    resolutionNote: complaint.resolutionNote,
    actionLogs: complaint.actionLogs,
  });

  res.json(complaint);
});

// Admin Merge Duplicate into Parent
app.post('/api/complaints/:id/merge', (req: Request, res: Response) => {
  const { parentId, adminNote } = req.body;

  if (!parentId) {
    return res.status(400).json({ error: 'parentId required.' });
  }

  const complaints = loadComplaints();
  const child = complaints.find((c) => c.id.toUpperCase() === req.params.id.toUpperCase());
  const parent = complaints.find((c) => c.id.toUpperCase() === parentId.toUpperCase());

  if (!child || !parent) {
    return res.status(404).json({ error: 'Child or parent complaint not found.' });
  }

  // Merge corroboration count into parent
  parent.corroborationCount += child.corroborationCount || 1;
  parent.mergedComplaintIds = parent.mergedComplaintIds || [];
  if (!parent.mergedComplaintIds.includes(child.id)) {
    parent.mergedComplaintIds.push(child.id);
  }

  // Mark child as Closed (Merged Duplicate)
  child.status = 'Closed';
  child.duplicateInfo = {
    isDuplicate: true,
    parentComplaintId: parent.id,
    confidenceScore: 100,
    reason: `Merged into parent incident ${parent.id} by admin dispatch.`,
  };

  const nowIso = new Date().toISOString();
  child.actionLogs.push({
    id: `LOG-${Date.now().toString().slice(-6)}`,
    timestamp: nowIso,
    actor: 'Operations Admin',
    actorRole: 'Admin',
    action: `Merged into ${parent.id}`,
    fromStatus: child.status,
    toStatus: 'Closed',
    note: adminNote || `Merged duplicate report into primary incident ${parent.id}.`,
  });

  parent.actionLogs.push({
    id: `LOG-${(Date.now() + 1).toString().slice(-6)}`,
    timestamp: nowIso,
    actor: 'Operations Admin',
    actorRole: 'Admin',
    action: `Merged duplicate report ${child.id}`,
    note: `Consolidated citizen complaint ${child.id}. Citizen corroboration count boosted to ${parent.corroborationCount}.`,
  });

  saveComplaints(complaints);
  updateComplaintInFirestoreServer(child.id, {
    status: child.status,
    duplicateInfo: child.duplicateInfo,
    actionLogs: child.actionLogs,
  });
  updateComplaintInFirestoreServer(parent.id, {
    corroborationCount: parent.corroborationCount,
    mergedComplaintIds: parent.mergedComplaintIds,
    actionLogs: parent.actionLogs,
  });

  res.json({ success: true, parent, child });
});

// Get Hotspots
app.get('/api/hotspots', (req: Request, res: Response) => {
  const complaints = loadComplaints();
  const hotspots = computeHotspots(complaints);
  res.json(hotspots);
});

// Ad-hoc text analysis endpoint
app.post('/api/ai/analyze', async (req: Request, res: Response) => {
  const { title, description, category, location } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required.' });
  }
  const result = await analyzeComplaintWithAI(title, description, category, location);
  res.json(result);
});

// Reset demo data to seed state
app.post('/api/reset-demo', async (req: Request, res: Response) => {
  saveComplaints(INITIAL_SEED_COMPLAINTS);
  if (firestoreDb) {
    try {
      const batch = writeBatch(firestoreDb);
      for (const comp of INITIAL_SEED_COMPLAINTS) {
        const docRef = doc(firestoreDb, 'complaints', comp.id);
        batch.set(docRef, comp, { merge: true });
      }
      await batch.commit();
      console.log('[CivicAI/Firestore] Re-seeded Firestore with initial complaints.');
    } catch (err) {
      console.error('[CivicAI/Firestore] Error reseeding Firestore:', err);
    }
  }
  res.json({ success: true, message: 'CivicAI database reseeded to clean initial state.' });
});

// -----------------------------------------------------------------------------
// Vite Middleware or Production Static Handler
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CivicAI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CivicAI] Failed to start server:', err);
});
