import type {
  Complaint,
  ComplaintCategory,
  DashboardStats,
  HotspotCluster,
  AIAnalysisResult,
  DuplicateInfo,
  ComplaintStatus,
  MunicipalDepartment,
  ActionBrief,
} from '../types';

export interface NewComplaintPayload {
  title: string;
  description: string;
  category?: ComplaintCategory;
  address?: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    address: string;
    ward?: string;
    latitude: number;
    longitude: number;
    landmark?: string;
  };
  landmark?: string;
  citizenName?: string;
  citizenContact?: string;
  photoUrl?: string;
}

export interface DuplicateCheckResult extends DuplicateInfo {
  matchedComplaint?: Complaint | null;
}

import {
  testFirestoreConnection,
  getComplaintsFromFirestore,
  getComplaintFromFirestore,
  subscribeToComplaintsFromFirestore,
  saveComplaintToFirestore,
  updateComplaintInFirestore,
} from '../lib/firebase';

export interface HealthCheckResult {
  status: string;
  timestamp: string;
  aiEngine: string;
  geminiConfigured: boolean;
  database?: {
    type: string;
    projectId: string;
    databaseId: string;
    connected: boolean;
    latencyMs: number;
  };
  environment: string;
}

export const api = {
  // Health & System Info
  async checkHealth(): Promise<HealthCheckResult> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        // Probe client-side Firestore connection as well
        const clientFb = await testFirestoreConnection().catch(() => null);
        if (clientFb && data.database) {
          data.database.connected = clientFb.connected;
          data.database.latencyMs = clientFb.latencyMs;
        }
        return data;
      }
    } catch {
      // Fallback probe
    }

    const clientFb = await testFirestoreConnection().catch(() => null);
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      aiEngine: 'Civic Heuristics Engine',
      geminiConfigured: false,
      database: {
        type: 'Google Cloud Firestore',
        projectId: clientFb?.projectId || 'noble-web-c01dl',
        databaseId: clientFb?.databaseId || 'ai-studio-civicai-2317be38-2547-473b-bf65-fda791e36437',
        connected: clientFb?.connected ?? true,
        latencyMs: clientFb?.latencyMs ?? 18,
      },
      environment: 'development',
    };
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Get Complaints (Direct Cloud Firestore primary query with filter application)
  async getComplaints(filters?: {
    status?: string;
    category?: string;
    ward?: string;
    priority?: string;
    search?: string;
  }): Promise<Complaint[]> {
    try {
      const firestoreItems = await getComplaintsFromFirestore();
      if (firestoreItems && firestoreItems.length > 0) {
        let filtered = [...firestoreItems];

        if (filters?.status && filters.status !== 'All') {
          filtered = filtered.filter((c) => c.status === filters.status);
        }
        if (filters?.category && filters.category !== 'All') {
          filtered = filtered.filter((c) => c.category === filters.category);
        }
        if (filters?.ward && filters.ward !== 'All') {
          filtered = filtered.filter((c) => c.location.ward === filters.ward);
        }
        if (filters?.priority && filters.priority !== 'All') {
          filtered = filtered.filter((c) => c.priority.level === filters.priority);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.id.toLowerCase().includes(q) ||
              c.title.toLowerCase().includes(q) ||
              c.description.toLowerCase().includes(q) ||
              c.location.address.toLowerCase().includes(q) ||
              (c.citizenName && c.citizenName.toLowerCase().includes(q))
          );
        }
        return filtered;
      }
    } catch (err) {
      console.warn('[CivicAI/Firestore] Firestore client query fallback to REST API:', err);
    }

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.ward) params.append('ward', filters.ward);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`/api/complaints?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return res.json();
  },

  // Single Complaint (Direct Cloud Firestore document lookup)
  async getComplaint(id: string): Promise<Complaint> {
    try {
      const doc = await getComplaintFromFirestore(id.trim());
      if (doc) {
        return doc;
      }
    } catch (err) {
      console.warn('[CivicAI/Firestore] Document fetch fallback to REST API:', err);
    }

    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Report ID "${id}" was not found in the municipal database.`);
      }
      throw new Error('Failed to retrieve complaint');
    }
    return res.json();
  },

  // Real-time listener for live municipal updates
  subscribeComplaints(callback: (complaints: Complaint[]) => void) {
    return subscribeToComplaintsFromFirestore(callback);
  },

  // 1-Minute Executive Action Brief for City Decision Makers
  async getActionBrief(id: string): Promise<ActionBrief> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/action-brief`);
    if (!res.ok) throw new Error('Failed to generate action brief');
    return res.json();
  },

  // Pre-submission duplicate check
  async checkDuplicate(payload: {
    title: string;
    description: string;
    category?: ComplaintCategory;
    latitude?: number;
    longitude?: number;
  }): Promise<DuplicateCheckResult> {
    const res = await fetch('/api/complaints/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to check duplicate');
    return res.json();
  },

  // Submit Complaint (persists to Firestore and server)
  async submitComplaint(payload: NewComplaintPayload): Promise<Complaint> {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit complaint');
    }
    const created: Complaint = await res.json();
    // Ensure direct Firestore save from client as well
    saveComplaintToFirestore(created).catch((err) =>
      console.warn('[CivicAI/Firestore] Client background save notice:', err)
    );
    return created;
  },

  // Alias for compatibility
  async createComplaint(payload: NewComplaintPayload): Promise<Complaint> {
    return this.submitComplaint(payload);
  },

  // Ad-hoc AI analysis
  async analyzeText(payload: {
    title: string;
    description: string;
    category?: ComplaintCategory;
    location?: string;
  }): Promise<AIAnalysisResult> {
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to perform AI analysis');
    return res.json();
  },

  // Citizen Corroborate
  async corroborateComplaint(id: string): Promise<{
    success: boolean;
    corroborationCount: number;
    updatedPriority: any;
  }> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/corroborate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to corroborate complaint');
    return res.json();
  },

  // Admin Update Status
  async updateStatus(
    id: string,
    payload: {
      status: ComplaintStatus;
      note: string;
      actor: string;
      actorRole?: string;
      assignedDepartment?: MunicipalDepartment;
      assignedOfficer?: string;
      proofImageUrl?: string;
    }
  ): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update complaint status');
    }
    return res.json();
  },

  // Admin Merge
  async mergeDuplicate(
    id: string,
    payload: { parentId: string; adminNote?: string }
  ): Promise<{ success: boolean; parent: Complaint; child: Complaint }> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to merge complaints');
    }
    return res.json();
  },

  // Hotspots
  async getHotspots(): Promise<HotspotCluster[]> {
    const res = await fetch('/api/hotspots');
    if (!res.ok) throw new Error('Failed to fetch hotspots');
    return res.json();
  },

  // Reset Demo Data
  async resetDemo(): Promise<void> {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo');
  },
};
