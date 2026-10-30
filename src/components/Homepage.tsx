import React, { useState, useEffect } from 'react';
import type { DashboardStats } from '../types';
import { api } from '../services/api';
import {
  Send,
  BarChart3,
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Activity,
} from 'lucide-react';

interface Props {
  onNavigate: (tab: any) => void;
}

export const Homepage: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    api
      .getStats()
      .then((data) => {
        setStats(data);
        setLoadingStats(false);
      })
      .catch((err) => {
        console.warn('Could not load homepage stats:', err);
        setLoadingStats(false);
      });
  }, []);

  return (
    <div className="space-y-10 pb-8 animate-fade-in">
      {/* 1. HERO SECTION: Clean, modern, trustworthy government-tech product */}
      <section className="gov-card p-8 sm:p-12 text-slate-100 relative overflow-hidden">
        <div className="max-w-3xl space-y-5">
          <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>CivicAI Municipal Platform · PromptWars × ASTRA</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            From Complaints to Action
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
            Transform scattered citizen reports into prioritized, explainable, and trackable action for municipal teams.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('submit')}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Report an issue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <span>Open dashboard</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATS ROW */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-medium text-slate-300">Live Incident Metrics</span>
          <span>Demo data · Active local store</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="gov-card p-5 space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Total Reports</span>
            </div>
            {loadingStats ? (
              <div className="h-8 w-16 skeleton mt-2" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats?.totalComplaints ?? 40}
              </div>
            )}
            <div className="text-xs text-slate-400 pt-1">Logged across all wards</div>
          </div>

          <div className="gov-card p-5 space-y-1 border-orange-500/30">
            <div className="text-xs text-orange-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <span>Critical & High Priority</span>
            </div>
            {loadingStats ? (
              <div className="h-8 w-16 skeleton mt-2" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-orange-400 tracking-tight">
                {stats ? stats.highPriorityComplaints : 14}
              </div>
            )}
            <div className="text-xs text-slate-400 pt-1">Requiring rapid dispatch</div>
          </div>

          <div className="gov-card p-5 space-y-1">
            <div className="text-xs text-teal-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Active in Workflow</span>
            </div>
            {loadingStats ? (
              <div className="h-8 w-16 skeleton mt-2" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-teal-400 tracking-tight">
                {stats ? stats.openComplaints : 34}
              </div>
            )}
            <div className="text-xs text-slate-400 pt-1">Under review or dispatched</div>
          </div>

          <div className="gov-card p-5 space-y-1">
            <div className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resolved Cases</span>
            </div>
            {loadingStats ? (
              <div className="h-8 w-16 skeleton mt-2" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                {stats?.resolvedComplaints ?? 6}
              </div>
            )}
            <div className="text-xs text-slate-400 pt-1">With audit notes & closure</div>
          </div>
        </div>
      </section>

      {/* 3. 4-STEP "HOW IT WORKS" STRIP */}
      <section className="gov-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">How CivicAI Works</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            An end-to-end operational pipeline from citizen submission to field resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="font-semibold text-white text-sm">Capture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Citizens submit issue text, category, photo preview, and map pin in under 60 seconds on any device.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="font-semibold text-white text-sm">Understand</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI classifies categories, extracts one-line summaries, matches nearby duplicates with similarity %, and calculates an explainable priority score.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h3 className="font-semibold text-white text-sm">Reveal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive GIS maps cluster incidents spatially, highlighting recurring neighborhood failure patterns with actionable 1-minute briefs.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h3 className="font-semibold text-white text-sm">Act</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatchers assign municipal departments and advance audit stages (Submitted → Under Review → Assigned → In Progress → Resolved).
            </p>
          </div>
        </div>
      </section>

      {/* 4. FAST NAVIGATIONAL SHORTCUTS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('track')}
          className="gov-card gov-hover-card p-4 text-left cursor-pointer transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <Search className="w-4 h-4 text-teal-400" />
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-semibold text-white text-sm">Track Report by ID</div>
          <div className="text-xs text-slate-400">View real-time status and audit timeline.</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('hotspots')}
          className="gov-card gov-hover-card p-4 text-left cursor-pointer transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <MapPin className="w-4 h-4 text-teal-400" />
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-semibold text-white text-sm">GIS Hotspot Map</div>
          <div className="text-xs text-slate-400">Analyze geographic clusters & recurring hazards.</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('about')}
          className="gov-card gov-hover-card p-4 text-left cursor-pointer transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <Info className="w-4 h-4 text-teal-400" />
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-semibold text-white text-sm">About & Limitations</div>
          <div className="text-xs text-slate-400">Transparent disclosures on AI, data & models.</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('diagnostics')}
          className="gov-card gov-hover-card p-4 text-left cursor-pointer transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <Activity className="w-4 h-4 text-teal-400" />
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-semibold text-white text-sm">System Diagnostics</div>
          <div className="text-xs text-slate-400">Run test suites for scoring, duplicate detection & API.</div>
        </button>
      </section>
    </div>
  );
};
