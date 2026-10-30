import React, { useState, useEffect } from 'react';
import type {
  Complaint,
  ComplaintStatus,
  ComplaintCategory,
  MunicipalDepartment,
  DashboardStats,
  ActionBrief,
} from '../types';
import { api } from '../services/api';
import { ActionBriefModal } from './ActionBriefModal';
import { HotspotMap } from './HotspotMap';
import {
  Shield,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Building2,
  Copy,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  GitMerge,
  Eye,
  SlidersHorizontal,
  X,
  FileCheck,
  FileText,
  MapPin,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onSelectComplaintForTracking?: (id: string) => void;
  isAdminAuthenticated: boolean;
  onSetAdminAuthenticated: (val: boolean) => void;
  onOpenAuthModal: () => void;
}

const DEPARTMENTS: MunicipalDepartment[] = [
  'Public Works Department',
  'Water & Sewerage Board',
  'Municipal Electricity Bureau',
  'Traffic & Road Safety Authority',
  'Waste Management Division',
  'Parks & Recreation Agency',
  'Public Health & Environment',
  'General Administration',
];

const WORKFLOW_STAGES: ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
];

export const AdminDashboard: React.FC<Props> = ({
  onSelectComplaintForTracking,
  isAdminAuthenticated,
  onSetAdminAuthenticated,
  onOpenAuthModal,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'queue' | 'map'>('queue');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewDuplicatesOnly, setViewDuplicatesOnly] = useState<boolean>(false);

  // Action Management Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [assignedDept, setAssignedDept] = useState<MunicipalDepartment>('Public Works Department');
  const [assignedOfficer, setAssignedOfficer] = useState('Officer David Ramirez');
  const [actionNote, setActionNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Duplicate Merge Confirmation Modal
  const [duplicateToMerge, setDuplicateToMerge] = useState<Complaint | null>(null);
  const [mergeNote, setMergeNote] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeMessage, setMergeMessage] = useState<string | null>(null);

  // 1-Minute Executive Action Brief Modal
  const [activeBrief, setActiveBrief] = useState<ActionBrief | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, complaintsData] = await Promise.all([
        api.getStats(),
        api.getComplaints({
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          search: searchQuery,
        }),
      ]);
      setStats(statsData);
      setComplaints(complaintsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, priorityFilter, searchQuery]);

  const handleOpenBrief = async (complaintId: string) => {
    setIsBriefModalOpen(true);
    setIsLoadingBrief(true);
    try {
      const brief = await api.getActionBrief(complaintId);
      setActiveBrief(brief);
    } catch (err) {
      console.error('Failed to load action brief:', err);
    } finally {
      setIsLoadingBrief(false);
    }
  };

  const handleOpenActionModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setAssignedDept(complaint.assignedDepartment || 'Public Works Department');
    setAssignedOfficer(complaint.assignedOfficer || 'Officer David Ramirez');
    setActionNote('');
    setUpdateError(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!actionNote.trim()) {
      setUpdateError('An official action note is required for municipal audit logging.');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await api.updateStatus(selectedComplaint.id, {
        status: newStatus,
        note: actionNote.trim(),
        actor: 'Dispatcher Elena Vance',
        actorRole: 'Operations Admin',
        assignedDepartment: assignedDept,
        assignedOfficer: assignedOfficer || undefined,
      });

      setSelectedComplaint(null);
      await loadData();
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmMerge = async () => {
    if (!duplicateToMerge || !duplicateToMerge.duplicateInfo?.parentComplaintId) return;
    setIsMerging(true);
    try {
      await api.mergeDuplicate(duplicateToMerge.id, {
        parentId: duplicateToMerge.duplicateInfo.parentComplaintId,
        adminNote:
          mergeNote ||
          `Consolidated duplicate report into primary incident ${duplicateToMerge.duplicateInfo.parentComplaintId}.`,
      });
      setDuplicateToMerge(null);
      setMergeMessage('Duplicate work order successfully consolidated into parent case.');
      setTimeout(() => setMergeMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to merge duplicate.');
    } finally {
      setIsMerging(false);
    }
  };

  // Sort queue by priority score descending
  const sortedComplaints = [...complaints].sort((a, b) => b.priority.score - a.priority.score);

  const displayedComplaints = viewDuplicatesOnly
    ? sortedComplaints.filter((c) => c.duplicateInfo?.isDuplicate)
    : sortedComplaints;

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 pb-12">
      {/* Top Header & Overview Bar */}
      <div className="gov-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Municipal Operations Dispatch · Demo data</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Admin Command Console & Priority Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Prioritized operational workflow, department task assignments, and duplicate resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setViewTab('queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'queue' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Priority Queue</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'map' ? 'bg-slate-800 text-teal-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map & Hotspots</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            title="Refresh Complaints"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gov-card p-4 space-y-1">
          <div className="text-[11px] text-slate-400">Total Registered Cases</div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.totalComplaints ?? complaints.length}
          </div>
          <div className="text-[11px] text-slate-500">Persisted in municipal registry</div>
        </div>

        <div className="gov-card p-4 space-y-1 border-orange-500/30">
          <div className="text-[11px] text-orange-400">High / Critical Priority</div>
          <div className="text-2xl font-bold text-orange-400 tracking-tight">
            {stats?.highPriorityComplaints ?? complaints.filter((c) => c.priority.score >= 65).length}
          </div>
          <div className="text-[11px] text-slate-500">Requires rapid SLA action</div>
        </div>

        <div className="gov-card p-4 space-y-1">
          <div className="text-[11px] text-teal-400">Assigned & In Progress</div>
          <div className="text-2xl font-bold text-teal-400 tracking-tight">
            {complaints.filter((c) => c.status === 'Assigned' || c.status === 'In Progress').length}
          </div>
          <div className="text-[11px] text-slate-500">Active municipal crew work orders</div>
        </div>

        <div className="gov-card p-4 space-y-1">
          <div className="text-[11px] text-emerald-400">Resolved Cases</div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {stats?.resolvedComplaints ?? complaints.filter((c) => c.status === 'Resolved').length}
          </div>
          <div className="text-[11px] text-slate-500">With documented action logs</div>
        </div>
      </div>

      {mergeMessage && (
        <div className="p-3 rounded-lg bg-teal-950/40 border border-teal-500/40 text-teal-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-400" />
          <span>{mergeMessage}</span>
        </div>
      )}

      {/* View: Map View Embedded if toggled */}
      {viewTab === 'map' ? (
        <HotspotMap onSelectComplaint={onSelectComplaintForTracking} />
      ) : (
        /* View: Priority Queue & Table */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="gov-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                <span>Filters:</span>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical (Score 85+)</option>
                <option value="High">High (Score 65-84)</option>
                <option value="Medium">Medium (Score 40-64)</option>
                <option value="Low">Low (Score &lt; 40)</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500"
              >
                <option value="All">All Categories</option>
                <option value="Roads & Potholes">Roads & Potholes</option>
                <option value="Water & Sanitation">Water & Sanitation</option>
                <option value="Streetlights & Electrical">Streetlights & Electrical</option>
                <option value="Public Safety & Hazards">Public Safety & Hazards</option>
                <option value="Traffic & Signage">Traffic & Signage</option>
                <option value="Waste & Sanitation">Waste & Sanitation</option>
                <option value="Parks & Public Spaces">Parks & Public Spaces</option>
              </select>

              {/* Duplicates Toggle */}
              <button
                type="button"
                onClick={() => setViewDuplicatesOnly(!viewDuplicatesOnly)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  viewDuplicatesOnly
                    ? 'bg-orange-950/40 text-orange-400 border-orange-500/40 font-semibold'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {viewDuplicatesOnly ? 'Showing Duplicates Only' : 'Filter Duplicates'}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, title, address..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Queue List Table */}
          <div className="gov-card overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                Operational Queue ({displayedComplaints.length} Records)
              </span>
              <span>Sorted by Priority Score (Explainable Urgency)</span>
            </div>

            <div className="divide-y divide-slate-800">
              {displayedComplaints.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No complaints match current filter parameters.
                </div>
              ) : (
                displayedComplaints.map((c) => {
                  const isCritical = c.priority.level === 'Critical';
                  const isHigh = c.priority.level === 'High';
                  const isResolved = c.status === 'Resolved';

                  return (
                    <div
                      key={c.id}
                      className="p-4 hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: ID, Priority, Title & Metadata */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-teal-400">{c.id}</span>
                          <span className="text-slate-500">·</span>

                          {/* Priority Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCritical
                                ? 'bg-red-500 text-white'
                                : isHigh
                                ? 'bg-orange-500 text-white'
                                : c.priority.level === 'Medium'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-700 text-slate-200'
                            }`}
                          >
                            {c.priority.level} ({c.priority.score})
                          </span>

                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400">{c.category}</span>

                          {/* Duplicate Flag */}
                          {c.duplicateInfo?.isDuplicate && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-950/60 text-orange-400 border border-orange-500/30">
                              Duplicate ({c.duplicateInfo.confidenceScore ?? 85}% match)
                            </span>
                          )}

                          {c.isDemo && (
                            <span className="text-[10px] text-slate-500">Demo data</span>
                          )}
                        </div>

                        {/* Title */}
                        <div className="font-semibold text-white text-sm truncate" title={c.title}>
                          {c.title}
                        </div>

                        {/* Location & Status Line */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{c.location.address}</span>
                          </span>
                          <span>·</span>
                          <span>
                            Status:{' '}
                            <strong
                              className={
                                isResolved
                                  ? 'text-emerald-400'
                                  : c.status === 'In Progress'
                                  ? 'text-teal-400'
                                  : 'text-slate-200'
                              }
                            >
                              {c.status}
                            </strong>
                          </span>
                          {c.assignedDepartment && (
                            <>
                              <span>·</span>
                              <span>Dept: {c.assignedDepartment}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                        <button
                          type="button"
                          onClick={() => handleOpenBrief(c.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Open 1-Minute Executive Action Brief"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-400" />
                          <span>Brief</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenActionModal(c)}
                          className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Manage Action</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {onSelectComplaintForTracking && (
                          <button
                            type="button"
                            onClick={() => onSelectComplaintForTracking(c.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="View Citizen Tracking View"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Management Modal (Workflow: Submitted -> Under Review -> Assigned -> In Progress -> Resolved) */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-100">
          <div className="relative w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">Action Management & Workflow</h3>
                <span className="text-xs text-teal-400 font-mono">Case ID: {selectedComplaint.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium">"{selectedComplaint.title}"</p>

            {updateError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                {updateError}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-3.5 text-xs">
              {/* Workflow Status Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Transition Audit Stage *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {WORKFLOW_STAGES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`p-2 rounded-lg text-xs font-semibold text-left border transition-colors cursor-pointer ${
                        newStatus === st
                          ? 'bg-teal-500 text-slate-950 border-teal-500 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Assignment */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Assign Municipal Department *
                </label>
                <select
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value as MunicipalDepartment)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-teal-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lead Officer Assignment */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Designated Officer / Crew Lead
                </label>
                <input
                  type="text"
                  value={assignedOfficer}
                  onChange={(e) => setAssignedOfficer(e.target.value)}
                  placeholder="e.g. Officer David Ramirez (Crew Lead 4)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-teal-500"
                />
              </div>

              {/* Audit Action Note (Mandatory) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Action Note (Visible on Citizen Tracking) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="e.g. Crew 4 dispatched with asphalt repair equipment. Cones placed at intersection."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-teal-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Saving Update...' : 'Commit Status & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-Minute Executive Action Brief Modal */}
      <ActionBriefModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        brief={activeBrief}
        isLoading={isLoadingBrief}
      />
    </div>
  );
};
