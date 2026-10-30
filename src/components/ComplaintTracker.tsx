import React, { useState, useEffect } from 'react';
import type { Complaint, ComplaintStatus, ActionBrief } from '../types';
import { api } from '../services/api';
import { ExplainablePriorityCard } from './ExplainablePriorityCard';
import { ActionBriefModal } from './ActionBriefModal';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  UserCheck,
  ThumbsUp,
  MapPin,
  Calendar,
  Share2,
  ArrowRight,
  ShieldCheck,
  FileText,
  CheckCircle,
  Copy,
} from 'lucide-react';

interface Props {
  initialComplaintId?: string;
  onSelectComplaint?: (id: string) => void;
}

const STATUS_STEPS: { status: ComplaintStatus; label: string; desc: string }[] = [
  { status: 'Submitted', label: 'Submitted', desc: 'Received & registered' },
  { status: 'Under Review', label: 'Under Review', desc: 'AI triage & duplicate check' },
  { status: 'Assigned', label: 'Assigned', desc: 'Department & team designated' },
  { status: 'In Progress', label: 'In Progress', desc: 'Field crew active on site' },
  { status: 'Resolved', label: 'Resolved', desc: 'Remediation completed' },
];

export const ComplaintTracker: React.FC<Props> = ({ initialComplaintId }) => {
  const [searchId, setSearchId] = useState(initialComplaintId || 'CIV-2026-4819');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [corroborated, setCorroborated] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1-Minute Executive Action Brief
  const [activeBrief, setActiveBrief] = useState<ActionBrief | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);

  const handleOpenActionBrief = async () => {
    if (!complaint) return;
    setIsBriefModalOpen(true);
    setIsLoadingBrief(true);
    try {
      const brief = await api.getActionBrief(complaint.id);
      setActiveBrief(brief);
    } catch (err) {
      console.error('Failed to load action brief:', err);
    } finally {
      setIsLoadingBrief(false);
    }
  };

  useEffect(() => {
    api
      .getComplaints()
      .then((data) => setRecentComplaints(data.slice(0, 5)))
      .catch((err) => console.warn('Could not load recent list:', err));
  }, []);

  const fetchComplaint = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getComplaint(idToFetch.trim());
      setComplaint(data);
      setSearchId(data.id);
    } catch (err: any) {
      setErrorMsg(err.message || `No complaint found matching "${idToFetch}".`);
      setComplaint(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialComplaintId) {
      setSearchId(initialComplaintId);
      fetchComplaint(initialComplaintId);
    } else {
      fetchComplaint('CIV-2026-4819');
    }
  }, [initialComplaintId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaint(searchId);
  };

  const handleCorroborate = async () => {
    if (!complaint || corroborated) return;
    try {
      const res = await api.corroborateComplaint(complaint.id);
      setComplaint({
        ...complaint,
        corroborationCount: res.corroborationCount,
        priority: res.updatedPriority || complaint.priority,
      });
      setCorroborated(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not corroborate complaint.');
    }
  };

  const handleShare = () => {
    if (complaint) {
      navigator.clipboard.writeText(
        `${window.location.origin}?track=${encodeURIComponent(complaint.id)}`
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getCurrentStepIndex = (status: ComplaintStatus) => {
    if (status === 'Closed' || status === 'Resolved') return 4;
    if (status === 'In Progress') return 3;
    if (status === 'Assigned' || status === 'Department Assigned') return 2;
    if (status === 'Under Review') return 1;
    return 0; // Submitted
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-slate-100 pb-12">
      {/* Search Bar & Quick Chips */}
      <div className="gov-card p-6 sm:p-8 space-y-4">
        <div className="space-y-1">
          <div className="text-xs text-teal-400 font-medium">Citizen Audit & Tracking</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Track Incident Progress
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Enter your unique complaint reference ID to view real-time department assignment, audit logs, and status history.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              placeholder="e.g. CIV-2026-4819"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono uppercase text-white placeholder:text-slate-500 focus:outline-hidden focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Locating...' : 'Track'}
          </button>
        </form>

        {/* Quick Sample Links */}
        {recentComplaints.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Quick inspect:</span>
            {recentComplaints.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => fetchComplaint(c.id)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer border ${
                  searchId === c.id
                    ? 'bg-slate-800 text-teal-400 border-teal-500 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {c.id} ({c.status})
              </button>
            ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Complaint Report View */}
      {complaint && (
        <div className="gov-card p-6 sm:p-8 space-y-6">
          {/* Top Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-700">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-teal-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700">
                  {complaint.id}
                </span>
                <span className="text-slate-300 font-semibold">{complaint.category}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Ward: {complaint.location.ward}</span>
                {complaint.isDemo && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">Demo data</span>
                  </>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {complaint.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{complaint.location.address}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Submitted: {new Date(complaint.createdAt).toLocaleString()}</span>
                </span>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenActionBrief}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Action Brief</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={handleCorroborate}
                disabled={corroborated}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  corroborated
                    ? 'bg-teal-950 text-teal-300 border border-teal-500/40'
                    : 'bg-teal-500 hover:bg-teal-600 text-slate-950'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>
                  {corroborated
                    ? `Corroborated (${complaint.corroborationCount})`
                    : `Confirm Issue (${complaint.corroborationCount})`}
                </span>
              </button>
            </div>
          </div>

          {/* Real-Time Action Pipeline Stepper (Requirement 10) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Municipal Audit Workflow Stages</span>
              <span>Current Status: <strong className="text-teal-400">{complaint.status}</strong></span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const currentIdx = getCurrentStepIndex(complaint.status);
                const isCompleted = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={step.status}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      isCurrent
                        ? 'bg-slate-800 border-teal-500 text-white'
                        : isCompleted
                        ? 'bg-slate-900/90 border-slate-700 text-slate-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isCompleted ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span>{step.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainable Priority Card */}
          <ExplainablePriorityCard
            priority={complaint.priority}
            analysisEngine={complaint.aiAnalysis?.analysisEngine}
            showDetailsDefault={false}
          />

          {/* Description & Operational Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
            {/* Description */}
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                  Citizen Issue Description
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
                {complaint.location.landmark && (
                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <strong>Reported Landmark:</strong> {complaint.location.landmark}
                  </div>
                )}
              </div>

              {/* Resolution Note if resolved */}
              {complaint.resolutionNote && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified Resolution Note</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {complaint.resolutionNote}
                  </p>
                </div>
              )}
            </div>

            {/* Department Assignment & Photo */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs">
                <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Assigned Team & SLA
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Assigned Department</div>
                  <div className="font-bold text-white mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>{complaint.assignedDepartment || 'Pending Assignment'}</span>
                  </div>
                </div>

                {complaint.assignedOfficer && (
                  <div>
                    <div className="text-slate-400 text-[11px]">Officer / Crew Lead</div>
                    <div className="font-medium text-slate-200 mt-0.5 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span>{complaint.assignedOfficer}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target SLA: <strong>{complaint.priority.slaHours} hours</strong></span>
                </div>
              </div>

              {complaint.photoUrl && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                    Evidence Photo
                  </div>
                  <img
                    src={complaint.photoUrl}
                    alt="Evidence photograph"
                    className="w-full h-32 object-cover rounded-lg border border-slate-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Audit History Timeline with Real Timestamps (Requirement 10) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Verified Audit Trail ({complaint.actionLogs?.length || 0} Events)</span>
              </span>
              <span>Chronological record with certified timestamps</span>
            </div>

            <div className="relative border-l-2 border-slate-700 ml-3 space-y-4 pl-4 pt-1">
              {complaint.actionLogs?.map((log) => (
                <div key={log.id} className="relative text-xs space-y-1">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-400" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{log.note}</p>
                  <div className="text-[11px] text-slate-400">
                    Logged by <span className="text-slate-200 font-medium">{log.actor}</span> ({log.actorRole})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1-Minute Executive Action Brief Modal */}
      <ActionBriefModal
        brief={activeBrief}
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        isLoading={isLoadingBrief}
      />
    </div>
  );
};
