import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  ArrowRight,
  ExternalLink,
  X,
  Sparkles,
  Award,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenDemoTour: () => void;
}

export const HonestyDossierModal: React.FC<Props> = ({ isOpen, onClose, onOpenDemoTour }) => {
  const [activeTab, setActiveTab] = useState<'honesty' | 'stages' | 'ai-math' | 'checklist'>('honesty');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl glass-panel-dark border border-white/20 shadow-2xl flex flex-col">
        {/* Glow Spheres */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#7028E4] opacity-25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#00D4FF] opacity-20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7028E4] via-[#F72585] to-[#4169FF] flex items-center justify-center text-white shadow-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white">Hackathon Dossier & Honesty Note</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gradient-to-r from-[#00D4FF] to-[#00C9A7] text-slate-950">
                  PromptWars × ASTRA
                </span>
              </div>
              <p className="text-xs text-slate-300 font-light">
                Transparent technical disclosures, architecture validation, and lifecycle proofs.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl glass-panel-dark text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-white/10 text-xs overflow-x-auto relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('honesty')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'honesty'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Honesty & Limitations Note
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stages')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stages'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            4-Stage Report Lifecycle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai-math')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ai-math'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            AI Engine & Mathematical Model
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Submission Checklist
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-200 relative z-10 font-light leading-relaxed">
          {activeTab === 'honesty' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  What is Real & Working in this Prototype
                </div>
                <ul className="space-y-1.5 text-slate-200 list-disc list-inside">
                  <li><strong>Real Full-Stack Persistence:</strong> All complaints, upvotes, and status changes are stored on disk in <code>data/complaints.json</code> through real REST APIs. Survives page reloads and cross-device sessions.</li>
                  <li><strong>Real AI Neural Analysis:</strong> Server-side proxy calls Gemini 3.8 Flash via <code>@google/genai</code> with structured JSON schema. Cleanly falls back to deterministic civic heuristics if unconfigured.</li>
                  <li><strong>Real Duplicate Fusion:</strong> Mathematical Haversine distance calculator + Jaccard token overlap that warns citizens pre-submission and lets dispatchers merge duplicates.</li>
                  <li><strong>Real GIS Spatial Hotspot Clustering:</strong> Proximity grouping that identifies recurrent clusters and generates systemic capital works advice.</li>
                  <li><strong>Real Explainable Scoring:</strong> Direct weighted formula with transparent sliders and natural-language justifications.</li>
                  <li><strong>Real Automated Diagnostics:</strong> E2E test runner executing 8 live assertions against the backend.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-400/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  What is Synthetic / Mocked (In Compliance with Hackathon Rule 6 & 7)
                </div>
                <ul className="space-y-1.5 text-slate-200 list-disc list-inside">
                  <li><strong>Synthetic Citizen Data:</strong> To adhere strictly to privacy guidelines, names, emails, and phone numbers are generated synthetic citizen profiles. No real personal citizen data is used.</li>
                  <li><strong>Simulated Government Radio Dispatch:</strong> No claims are made of an existing government legacy radio network. Dispatches occur via CivicAI's own simulated operations dispatch database.</li>
                  <li><strong>Synthetic Benchmark Dataset:</strong> Preloaded with 36 diverse municipal records across 5 wards with deliberate duplicates and acute safety emergencies.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-400/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Where the AI Can Be Wrong & Next Engineering Horizons
                </div>
                <p>
                  <strong>Failure Modes:</strong> Complex multi-clause reports (e.g. "I love the new park flowers but the nearby light is broken") can occasionally confuse sentiment detectors. Sarcastic citizen descriptions can cause heuristic misclassification. Highly dense overlapping incidents with coarse GPS locks can trigger false-positive duplicate suggestions.
                </p>
                <p>
                  <strong>What We Would Build Next:</strong> Real-time computer vision photogrammetry to estimate pothole volume and asphalt square-footage directly from phone camera photos, two-way WhatsApp municipal bot integration, and GIS CAD shapefile exports.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white text-sm text-cyan-300">Stage 1. Capture</div>
                <p>Allows citizens to submit complaints via mobile-optimized form under 60 seconds with text, photo attachment, ward selector, and browser GPS lock. Features real-time pre-submission duplicate warning.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white text-sm text-pink-300">Stage 2. Understand</div>
                <p>Neural categorization, executive 1-sentence dispatch summary, duplicate proximity matching with percentage confidence, and urgency/safety/impact scoring.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white text-sm text-amber-300">Stage 3. Reveal</div>
                <p>Interactive SVG GIS Map visualizing chronic hotspots with glowing radar circles, recurrence statistics, ward activity density, and systemic capital overhaul recommendations.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white text-sm text-teal-300">Stage 4. Act</div>
                <p>Operational assignment workflow for city dispatchers, mandatory audit logs, duplicate consolidation merging, and live public tracking with citizen corroboration upvoting.</p>
              </div>
            </div>
          )}

          {activeTab === 'ai-math' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs space-y-2">
                <div className="text-cyan-300 font-bold font-sans text-sm">Mathematical Explainability Model:</div>
                <div className="text-pink-300">Composite Priority Score = (Safety Risk × 4.0) + (Urgency × 3.5) + (Public Impact × 2.5)</div>
                <div className="text-slate-300">Score Range: 10 to 100. Clamped to: Critical (80-100), High (60-79), Medium (40-59), Low (1-39).</div>
                <div className="text-slate-400 font-sans">
                  Target SLAs: Critical → 2-4 Hours; High → 24 Hours; Medium → 48 Hours; Low → 120 Hours.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="font-bold text-white text-sm text-yellow-300">Duplicate Matching Formulation:</div>
                <p>Haversine Distance: d ≤ 50m (+50 pts), d ≤ 150m (+40 pts), d ≤ 350m (+25 pts). Same Category: +25 pts. Jaccard Token Overlap: up to +25 pts. Match threshold ≥ 55% triggers duplicate alert.</p>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Working prototype hosted and fully testable locally on port 3000.</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Synthetic dataset of 36+ realistic municipal reports seeded with deliberate duplicates and clusters.</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI features include real Gemini 3.8 Flash triage, duplicate fusion, hotspot detection, and 1-minute Action Briefs.</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full end-to-end user journey demonstrator ready for 5-minute judge evaluation.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10 bg-black/40">
          <div className="text-[11px] text-slate-400">
            Validated for PromptWars × ASTRA Hackathon Judging
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl glass-panel-dark text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDemoTour();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#7028E4] to-[#F72585] text-white text-xs font-extrabold shadow-lg hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Launch 5-Minute Demo Tour</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
