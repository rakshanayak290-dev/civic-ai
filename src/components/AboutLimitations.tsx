import React from 'react';
import {
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Database,
  Cpu,
  Compass,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Props {
  onNavigate?: (tab: string) => void;
}

export const AboutLimitations: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-xs text-teal-400 font-medium">Platform Transparency & Governance</div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">About & Limitations</h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          An honest, unembellished disclosure of system architecture, data provenance, AI capabilities, and known failure modes for judges and municipal stakeholders.
        </p>
      </div>

      {/* Grid: What is Real vs What is Demo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real */}
        <div className="gov-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-teal-400">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="font-bold text-white text-base">What is Real & Functional</h2>
          </div>
          <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span>
                <strong>Full-Stack Architecture:</strong> An Express + Node.js backend serves dedicated REST API endpoints for complaint ingestion, prioritization, deduplication, and workflow updates.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span>
                <strong>Disk Persistence:</strong> All submitted reports, status transitions, and audit logs persist to server disk in <code className="text-teal-300 font-mono">data/complaints.json</code> and survive server reboots.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span>
                <strong>Dual-Engine AI Triage:</strong> Calls Google Gemini 3.8 Flash via <code className="text-teal-300 font-mono">@google/genai</code> when an API key is configured. If unconfigured, a deterministic civic heuristic engine calculates categories, summaries, and priority scores.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span>
                <strong>Explainable Prioritization Formula:</strong> Transparent mathematical scoring: <code className="text-teal-300 font-mono">Score = (Urgency × 3.5) + (PublicImpact × 3.5) + (SafetyRisk × 3.0)</code> capped at 100 with plain-language factor explanations.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
              <span>
                <strong>Spatial Distance Engine:</strong> Real Haversine trigonometric distance formula calculates geographic proximity between reports to prevent duplicate work orders.
              </span>
            </li>
          </ul>
        </div>

        {/* Demo */}
        <div className="gov-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-orange-400">
            <Database className="w-5 h-5" />
            <h2 className="font-bold text-white text-base">What is Demo Data & Simulated</h2>
          </div>
          <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span>
                <strong>Preloaded Demo Incidents:</strong> The 40 preloaded complaints are synthetic test cases engineered to represent realistic municipal operations (only 4 Critical, 10 High, 16 Medium, 10 Low).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span>
                <strong>Synthetic Duplicate Pairs:</strong> Specific pairs (such as multiple reports of Montgomery & 2nd signal light failure) were deliberately synthesized to demonstrate duplicate fusion and link verification.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span>
                <strong>Municipal Dispatch Integration:</strong> Field officer assignments and dispatch statuses are managed within this prototype database; live city CAD (Computer-Aided Dispatch) radio integrations are simulated.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              <span>
                <strong>Geolocation Fallback:</strong> If a user denies browser location permissions, the app falls back to municipal center coordinates (Oak Ave & 4th St).
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Where AI Can Be Wrong */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle className="w-5 h-5" />
          <h2 className="font-bold text-white text-base">Where the AI Can Be Wrong (Failure Modes & Edge Cases)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-white">Ambiguous or Sarcastic Text</h3>
            <p className="leading-relaxed text-slate-400">
              Citizens reporting issues using slang or hyperbole (e.g., "The street is literally the Grand Canyon") can trigger inflated safety scores in rule-based fallback mode.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-white">Spatial Duplicate Overlap</h3>
            <p className="leading-relaxed text-slate-400">
              Two separate potholes 30 meters apart on the same street might be flagged as possible duplicates. Human dispatcher verification remains essential before merging work orders.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-white">Image Quality & Weather</h3>
            <p className="leading-relaxed text-slate-400">
              Photographs taken at night, during heavy rain, or from moving vehicles may lack sufficient visual detail for reliable computer vision defect depth estimation.
            </p>
          </div>
        </div>
      </div>

      {/* What Comes Next (Roadmap) */}
      <div className="gov-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-teal-400">
          <Compass className="w-5 h-5" />
          <h2 className="font-bold text-white text-base">What Comes Next (Production Roadmap)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-1">
            <div className="font-semibold text-white">Open311 Standard Compliance</div>
            <p className="text-slate-400 leading-relaxed">
              Bi-directional integration with standard Open311 GeoReport v2 REST endpoints used by major city governments worldwide.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-white">Enterprise GIS Layers</div>
            <p className="text-slate-400 leading-relaxed">
              Integration with Esri ArcGIS Shapefiles and municipal asset layers (water mains, fiber conduits, and transit lanes).
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-white">Multilingual Voice Intake</div>
            <p className="text-slate-400 leading-relaxed">
              Accepting citizen reports through WhatsApp and SMS voice notes with real-time translation across 30+ languages.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-white">Closed-Loop Contractor Verification</div>
            <p className="text-slate-400 leading-relaxed">
              Requiring GPS-tagged post-repair photos from contractors with automated AI before-and-after change verification.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      {onNavigate && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onNavigate('diagnostics')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Run automated system tests in Diagnostics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
