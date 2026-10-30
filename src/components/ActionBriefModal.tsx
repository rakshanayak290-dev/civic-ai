import React, { useState } from 'react';
import type { ActionBrief } from '../types';
import {
  FileText,
  Clock,
  AlertTriangle,
  Users,
  Wrench,
  DollarSign,
  ArrowRight,
  Copy,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  brief: ActionBrief | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const ActionBriefModal: React.FC<Props> = ({
  brief,
  isOpen,
  onClose,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!brief) return;
    const text = `
[CIVICAI 1-MINUTE ACTION BRIEF]
Incident ID: ${brief.complaintId}
Title: ${brief.title}
Urgency / SLA: ${brief.urgencyLevel} (${brief.timeToActSla})
Department: ${brief.recommendedDepartment}

EXECUTIVE SUMMARY:
${brief.executiveSummary}

OPERATIONAL RESOURCES REQUIRED:
• Crew: ${brief.requiredResources.crewType} (${brief.requiredResources.personnelCount} personnel)
• Equipment: ${brief.requiredResources.specializedEquipment.join(', ')}
• Estimated Material Cost: ${brief.requiredResources.estimatedMaterialsCost}

SAFETY & TORT LIABILITY RISK:
${brief.safetyAndLiabilityRisk}

IMMEDIATE NEXT STEP:
${brief.immediateNextStep}

Engine: ${brief.generatedBy}
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCritical = brief?.urgencyLevel.includes('Critical') || brief?.urgencyLevel.includes('High');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-100">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">1-Minute Executive Action Brief</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-400">
                  Decision Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operational directive for municipal dispatchers and department heads.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close brief"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {isLoading || !brief ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Synthesizing municipal decision brief...</p>
            </div>
          ) : (
            <>
              {/* Target Incident & SLA Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Target Incident</div>
                  <div className="font-mono text-sm font-bold text-teal-400">
                    {brief.complaintId}: {brief.title}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                      isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {brief.urgencyLevel}
                  </span>
                  <span className="text-xs text-slate-300 font-medium bg-slate-800 px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{brief.timeToActSla}</span>
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-200">Executive Summary</div>
                <p className="text-xs text-slate-300 leading-relaxed">{brief.executiveSummary}</p>
              </div>

              {/* Department & Operational Resources */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Recommended Department:</span>
                  <span className="font-bold text-white">{brief.recommendedDepartment}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      <span>Crew Deployment</span>
                    </div>
                    <div className="font-semibold text-white">
                      {brief.requiredResources.crewType} ({brief.requiredResources.personnelCount} staff)
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-teal-400" />
                      <span>Equipment</span>
                    </div>
                    <div className="font-semibold text-slate-200 truncate" title={brief.requiredResources.specializedEquipment.join(', ')}>
                      {brief.requiredResources.specializedEquipment.slice(0, 2).join(', ')}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                      <span>Estimated Material</span>
                    </div>
                    <div className="font-semibold text-white font-mono">
                      {brief.requiredResources.estimatedMaterialsCost}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety & Legal Liability */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="font-semibold text-orange-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  <span>Safety Risk & Legal Exposure</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {brief.safetyAndLiabilityRisk}
                </p>
              </div>

              {/* Immediate Next Step */}
              <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-500/30 space-y-1">
                <div className="font-semibold text-teal-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Immediate Next Action</span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {brief.immediateNextStep}
                </p>
              </div>

              {/* Attribution */}
              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                <span>Decision Engine: {brief.generatedBy}</span>
                <span>Audit Ref: {brief.complaintId}-BRIEF</span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!brief || isLoading}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Brief' : 'Copy Brief to Clipboard'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
