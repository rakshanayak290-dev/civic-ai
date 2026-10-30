import React, { useState } from 'react';
import type { PriorityBreakdown } from '../types';
import { AlertTriangle, Clock, ChevronDown, ChevronUp, Info, ShieldAlert } from 'lucide-react';

interface Props {
  priority: PriorityBreakdown;
  analysisEngine?: string;
  showDetailsDefault?: boolean;
}

export const ExplainablePriorityCard: React.FC<Props> = ({
  priority,
  analysisEngine,
  showDetailsDefault = false,
}) => {
  const [showFormula, setShowFormula] = useState(showDetailsDefault);

  const getPriorityStyle = (level: string) => {
    switch (level) {
      case 'Critical':
        return {
          badge: 'bg-red-500 text-white',
          border: 'border-red-500/40',
          text: 'text-red-400',
          bg: 'bg-red-950/20',
        };
      case 'High':
        return {
          badge: 'bg-orange-500 text-white',
          border: 'border-orange-500/40',
          text: 'text-orange-400',
          bg: 'bg-orange-950/20',
        };
      case 'Medium':
        return {
          badge: 'bg-amber-500 text-slate-950',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          bg: 'bg-amber-950/20',
        };
      default:
        return {
          badge: 'bg-slate-700 text-slate-200',
          border: 'border-slate-700',
          text: 'text-slate-300',
          bg: 'bg-slate-900/40',
        };
    }
  };

  const style = getPriorityStyle(priority.level);
  const isHeuristicFallback = analysisEngine?.includes('Fallback') || analysisEngine?.includes('Heuristics');

  return (
    <div className={`gov-card p-5 space-y-4 border ${style.border}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-teal-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              Explainable Priority Score
            </h4>
            <div className="text-[11px] text-slate-400">
              {isHeuristicFallback ? 'Calculated via Civic Heuristics' : 'Evaluated by Gemini AI'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${style.badge}`}>
            {priority.level} · {priority.score}/100
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{priority.slaHours}h Target SLA</span>
          </span>
        </div>
      </div>

      {/* Plain Language Explanation */}
      <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-teal-400" />
          <span>Priority Rationale:</span>
        </div>
        <p className="leading-relaxed text-slate-300">{priority.explanation}</p>
      </div>

      {/* 3 Component Factor Breakdown with Factor Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Safety Risk */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Safety Risk</span>
            <span className="font-bold text-red-400">{priority.factors.safetyRisk} / 10</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${priority.factors.safetyRisk * 10}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">Bodily injury & structural liability</p>
        </div>

        {/* Urgency */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Urgency</span>
            <span className="font-bold text-orange-400">{priority.factors.urgency} / 10</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${priority.factors.urgency * 10}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">Temporal degradation rate</p>
        </div>

        {/* Public Impact */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Public Impact</span>
            <span className="font-bold text-teal-400">{priority.factors.publicImpact} / 10</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${priority.factors.publicImpact * 10}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">Pedestrians & transit affected</p>
        </div>
      </div>

      {/* Expandable Mathematical Formula */}
      <div className="pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="text-xs text-slate-400 hover:text-teal-400 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showFormula ? 'Hide Scoring Formula' : 'View Transparent Mathematical Formula'}</span>
        </button>

        {showFormula && (
          <div className="mt-3 p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 animate-fade-in font-mono">
            <div className="text-teal-300 font-bold">
              PriorityScore = min(100, (Urgency × 3.5) + (PublicImpact × 3.5) + (SafetyRisk × 3.0))
            </div>
            <div className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Calculation for this case: ({priority.factors.urgency} × 3.5) + ({priority.factors.publicImpact} × 3.5) + ({priority.factors.safetyRisk} × 3.0) ={' '}
              <strong className="text-white font-mono">{priority.score} points</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
