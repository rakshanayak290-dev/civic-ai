export type ComplaintCategory =
  | 'Roads & Potholes'
  | 'Water & Sanitation'
  | 'Streetlights & Electrical'
  | 'Public Safety & Hazards'
  | 'Waste & Sanitation'
  | 'Traffic & Signage'
  | 'Parks & Public Spaces'
  | 'Noise & Pollution'
  | 'Other';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'Department Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export type MunicipalDepartment =
  | 'Public Works Department'
  | 'Water & Sewerage Board'
  | 'Municipal Electricity Bureau'
  | 'Traffic & Road Safety Authority'
  | 'Waste Management Division'
  | 'Parks & Recreation Agency'
  | 'Public Health & Environment'
  | 'General Administration';

export interface LocationData {
  address: string;
  ward: string;
  latitude: number;
  longitude: number;
  landmark?: string;
}

export interface PriorityBreakdown {
  score: number; // 1 to 100
  level: PriorityLevel;
  factors: {
    urgency: number; // 1 to 10
    publicImpact: number; // 1 to 10
    safetyRisk: number; // 1 to 10
  };
  explanation: string;
  slaHours: number;
}

export interface DuplicateInfo {
  isDuplicate: boolean;
  parentComplaintId?: string;
  confidenceScore?: number; // 0 to 100
  reason?: string;
  distanceMeters?: number;
}

export interface ActionLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  fromStatus?: ComplaintStatus;
  toStatus?: ComplaintStatus;
  note: string;
  proofImageUrl?: string;
}

export interface AIAnalysisResult {
  summary: string;
  recommendedCategory: ComplaintCategory;
  recommendedAction: string;
  suggestedDepartment: MunicipalDepartment;
  priority: PriorityBreakdown;
  detectedKeywords: string[];
  analysisEngine: string; // 'gemini-3.8-flash' or 'Rule-Based Civic Heuristics (Fallback)'
  confidence: number; // 0 to 1
}

export interface Complaint {
  id: string; // e.g. "CIV-2026-7842"
  title: string;
  description: string;
  category: ComplaintCategory;
  location: LocationData;
  photoUrl?: string;
  citizenName?: string;
  citizenContact?: string;
  createdAt: string;
  updatedAt: string;
  status: ComplaintStatus;
  assignedDepartment?: MunicipalDepartment;
  assignedOfficer?: string;
  priority: PriorityBreakdown;
  aiAnalysis: AIAnalysisResult;
  duplicateInfo?: DuplicateInfo;
  mergedComplaintIds?: string[];
  isDemo?: boolean; // Clearly labels synthetic hackathon seed data
  corroborationCount: number; // number of citizens also reporting this
  actionLogs: ActionLog[];
  internalNotes?: string[];
  targetResolutionDate?: string;
  resolutionNote?: string;
}

export interface HotspotCluster {
  id: string;
  name: string;
  ward: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  complaintCount: number;
  openCount: number;
  resolvedCount: number;
  primaryCategory: ComplaintCategory;
  categoryCounts: Record<string, number>;
  severityIndex: 'Critical' | 'High' | 'Elevated' | 'Moderate';
  trend: 'Rising' | 'Stable' | 'Decreasing';
  recurringIssuesSummary: string;
  recommendedSystemicAction: string;
  complaintIds: string[];
}

export interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  highPriorityComplaints: number;
  resolvedComplaints: number;
  inProgressComplaints: number;
  categoryDistribution: Record<string, number>;
  wardDistribution: Record<string, number>;
  averageResolutionHours: number;
  duplicateCount: number;
  slaBreachRiskCount: number;
}

export interface ActionBrief {
  complaintId: string;
  title: string;
  executiveSummary: string;
  urgencyLevel: string;
  timeToActSla: string;
  safetyAndLiabilityRisk: string;
  recommendedDepartment: string;
  requiredResources: {
    crewType: string;
    personnelCount: number;
    specializedEquipment: string[];
    estimatedMaterialsCost: string;
  };
  immediateNextStep: string;
  generatedBy: string;
}
