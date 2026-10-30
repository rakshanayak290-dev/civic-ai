import React, { useState, useEffect } from 'react';
import type { HotspotCluster, Complaint, ActionBrief } from '../types';
import { api } from '../services/api';
import { ActionBriefModal } from './ActionBriefModal';
import {
  MapPin,
  RefreshCw,
  Layers,
  FileText,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  onSelectComplaint?: (id: string) => void;
}

export const HotspotMap: React.FC<Props> = ({ onSelectComplaint }) => {
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotCluster | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Action brief modal state
  const [activeBrief, setActiveBrief] = useState<ActionBrief | null>(null);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hData, cData] = await Promise.all([api.getHotspots(), api.getComplaints()]);
      setHotspots(hData);
      setComplaints(cData);
      if (hData.length > 0) {
        setSelectedHotspot(hData[0]);
      }
    } catch (err) {
      console.error('Failed to load hotspot data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBrief = async (complaintId: string) => {
    setIsBriefOpen(true);
    setBriefLoading(true);
    try {
      const brief = await api.getActionBrief(complaintId);
      setActiveBrief(brief);
    } catch (err) {
      console.error('Failed to load action brief:', err);
    } finally {
      setBriefLoading(false);
    }
  };

  const minLat = 37.74;
  const maxLat = 37.795;
  const minLng = -122.455;
  const maxLng = -122.395;

  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 600;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 440;
    return {
      x: Math.max(25, Math.min(575, x)),
      y: Math.max(25, Math.min(415, y)),
    };
  };

  const filteredComplaints = complaints.filter((c) => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (priorityFilter !== 'All' && c.priority.level !== priorityFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    return true;
  });

  const getPinColor = (complaint: Complaint) => {
    if (complaint.status === 'Resolved') return '#10b981'; // Green
    switch (complaint.priority.level) {
      case 'Critical':
        return '#ef4444'; // Red
      case 'High':
        return '#f97316'; // Orange
      case 'Medium':
        return '#eab308'; // Amber/Yellow
      default:
        return '#14b8a6'; // Teal
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="gov-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>GIS Hotspot Intelligence · Demo data</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Community Hotspot Radar & Geographic Clusters
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spatial analysis detects recurring infrastructure failures within 400m clusters to trigger systemic repairs.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="gov-card p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Filter className="w-3.5 h-3.5 text-teal-400" />
          <span>Filters:</span>
        </div>

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

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500"
        >
          <option value="All">All Priorities</option>
          <option value="Critical">Critical (Red)</option>
          <option value="High">High (Orange)</option>
          <option value="Medium">Medium (Yellow)</option>
          <option value="Low">Low (Teal)</option>
        </select>

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

        <span className="ml-auto text-slate-400 text-[11px]">
          Showing <strong>{filteredComplaints.length}</strong> of {complaints.length} reports
        </span>
      </div>

      {/* Main Grid: SVG Map Canvas + Hotspot Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Map Canvas */}
        <div className="lg:col-span-7 gov-card p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700 text-xs">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>Municipal Spatial Grid</span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                Low
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Resolved
              </span>
            </div>
          </div>

          {/* SVG Map Frame */}
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <svg
              viewBox="0 0 600 440"
              className="w-full h-auto max-h-[480px] select-none"
              style={{ background: '#090d16' }}
            >
              <defs>
                <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#1e293b" opacity="0.6" />
                </pattern>
              </defs>

              <rect width="600" height="440" fill="url(#grid-dots)" />

              {/* Waterway / Coastal Bay */}
              <path
                d="M 490 0 Q 450 180 520 300 T 590 440"
                fill="none"
                stroke="#0369a1"
                strokeWidth="28"
                opacity="0.3"
                strokeLinecap="round"
              />

              {/* Major Arterial Roads */}
              <line x1="30" y1="200" x2="570" y2="200" stroke="#334155" strokeWidth="2.5" />
              <line x1="260" y1="20" x2="260" y2="420" stroke="#334155" strokeWidth="2.5" />
              <line x1="100" y1="30" x2="480" y2="410" stroke="#475569" strokeWidth="1.5" strokeDasharray="5,4" />

              {/* Sector Labels */}
              <text x="60" y="60" fill="#64748b" fontSize="9" fontWeight="bold">
                WARD 1 (RICHMOND)
              </text>
              <text x="210" y="150" fill="#64748b" fontSize="9" fontWeight="bold">
                WARD 3 (CENTRAL DISTRICT)
              </text>
              <text x="210" y="270" fill="#64748b" fontSize="9" fontWeight="bold">
                WARD 5 (MISSION CORRIDOR)
              </text>
              <text x="80" y="360" fill="#64748b" fontSize="9" fontWeight="bold">
                WARD 4 (SUNSET)
              </text>

              {/* Hotspot Cluster Concentric Radii */}
              {hotspots.map((h) => {
                const { x, y } = projectCoords(h.latitude, h.longitude);
                const isSelected = selectedHotspot?.id === h.id;
                const isCritical = h.severityIndex === 'Critical';

                return (
                  <g
                    key={h.id}
                    onClick={() => setSelectedHotspot(h)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    {/* Outer Cluster Radius */}
                    <circle
                      cx={x}
                      cy={y}
                      r={Math.min(55, 25 + h.complaintCount * 5)}
                      fill={isCritical ? '#ef4444' : '#14b8a6'}
                      opacity={isSelected ? 0.25 : 0.14}
                      stroke={isCritical ? '#ef4444' : '#14b8a6'}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? '4,3' : 'none'}
                    />

                    {/* Centroid Badge */}
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="#0f172a"
                      stroke={isCritical ? '#ef4444' : '#14b8a6'}
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={y + 4}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {h.complaintCount}
                    </text>
                  </g>
                );
              })}

              {/* Individual Complaint Pins */}
              {filteredComplaints.map((c) => {
                const { x, y } = projectCoords(c.location.latitude, c.location.longitude);
                const color = getPinColor(c);

                return (
                  <circle
                    key={c.id}
                    cx={x}
                    cy={y}
                    r={c.priority.level === 'Critical' ? 4.5 : 3.5}
                    fill={color}
                    stroke="#0f172a"
                    strokeWidth="1"
                    className="cursor-pointer hover:r-6 transition-all"
                    onClick={() => onSelectComplaint && onSelectComplaint(c.id)}
                  >
                    <title>{`${c.id}: ${c.title} (${c.priority.level} - ${c.status})`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Click any cluster or individual pin to inspect details.</span>
            <span>Spatial Engine: Haversine $\le$ 400m density</span>
          </div>
        </div>

        {/* Selected Hotspot Action Brief & Cluster Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {selectedHotspot ? (
            <div className="gov-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedHotspot.severityIndex === 'Critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    }`}
                  >
                    {selectedHotspot.severityIndex} Hotspot Cluster
                  </span>
                  <h2 className="text-base font-bold text-white mt-1.5">{selectedHotspot.name}</h2>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>{selectedHotspot.ward} · {selectedHotspot.radiusMeters}m radius</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-teal-400">
                    {selectedHotspot.complaintCount}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">Reports</div>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Open Cases</div>
                  <div className="text-base font-bold text-orange-400">
                    {selectedHotspot.openCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Resolved Cases</div>
                  <div className="text-base font-bold text-emerald-400">
                    {selectedHotspot.resolvedCount}
                  </div>
                </div>
              </div>

              {/* Systemic Action Brief Card */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-teal-400 text-xs">
                    Systemic Action Brief
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Dominant: {selectedHotspot.primaryCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedHotspot.recommendedSystemicAction}
                </p>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <strong>Pattern:</strong> {selectedHotspot.recurringIssuesSummary}
                </div>
              </div>

              {/* Incident list in this cluster */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    Cluster Reports ({selectedHotspot.complaintIds.length})
                  </span>
                  <span className="text-[11px]">Click to view in tracking</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {selectedHotspot.complaintIds.map((cId) => {
                    const c = complaints.find((x) => x.id === cId);
                    if (!c) return null;
                    return (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between text-xs gap-2"
                      >
                        <div
                          className="truncate cursor-pointer flex-1"
                          onClick={() => onSelectComplaint && onSelectComplaint(c.id)}
                        >
                          <span className="font-mono font-bold text-teal-400 mr-2">{c.id}</span>
                          <span className="text-slate-300">{c.title}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenBrief(c.id)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer"
                            title="Open Decision Brief"
                          >
                            <FileText className="w-3 h-3 text-teal-400" />
                            <span>Brief</span>
                          </button>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              c.priority.level === 'Critical'
                                ? 'bg-red-500/20 text-red-400'
                                : c.priority.level === 'High'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {c.priority.level}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="gov-card p-8 text-center text-slate-400 text-xs">
              Select a cluster on the map to inspect systemic diagnosis and action briefs.
            </div>
          )}
        </div>
      </div>

      {/* 1-Minute Executive Action Brief Modal */}
      <ActionBriefModal
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        brief={activeBrief}
        isLoading={briefLoading}
      />
    </div>
  );
};
