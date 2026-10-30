import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  Send,
  MapPin,
  Shield,
} from 'lucide-react';
import type { AppTab } from './Header';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: AppTab) => void;
  onSelectComplaintForTracking: (id: string) => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Stage 1: Capture (Under 1 Minute)',
    description: 'Submit an issue with text description, category, photo preview, and map pin. Notice duplicate warning alerts before final submission.',
    targetTab: 'submit' as AppTab,
    recommendedActionText: 'Open Report Form',
    highlightKey: 'Fast intake & duplicate preview',
  },
  {
    step: 2,
    title: 'Stage 2: Understand (AI Triage & Explainable Priority)',
    description: 'Calculates an explainable priority score out of 100 with transparent factors: Urgency (35%), Public Impact (35%), Safety Risk (30%).',
    targetTab: 'admin' as AppTab,
    recommendedActionText: 'Inspect Priority Queue',
    highlightKey: 'Explainable scoring & suggested department',
  },
  {
    step: 3,
    title: 'Stage 3: Reveal (GIS Hotspot Clusters)',
    description: 'Explore the GIS Hotspot Map. Spatial analysis highlights recurring neighborhood infrastructure bottlenecks with short executive action briefs.',
    targetTab: 'hotspots' as AppTab,
    recommendedActionText: 'Explore Hotspot Map',
    highlightKey: 'Spatial clusters & 1-minute briefs',
  },
  {
    step: 4,
    title: 'Stage 4: Act (Audit Workflow & Tracking)',
    description: 'Assign a municipal team and advance the status pipeline (Submitted → Under Review → Assigned → In Progress → Resolved) visible in real-time tracking.',
    targetTab: 'track' as AppTab,
    recommendedActionText: 'View Citizen Tracker',
    highlightKey: 'Timestamped audit logs & resolution notes',
  },
];

export const JudgeDemoTour: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectComplaintForTracking,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      onNavigate(TOUR_STEPS[nextIdx].targetTab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      onNavigate(TOUR_STEPS[prevIdx].targetTab);
    }
  };

  const handleExecuteStep = () => {
    onNavigate(currentStep.targetTab);
    if (currentStep.step === 4) {
      onSelectComplaintForTracking('CIV-2026-4819');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-fade-in text-slate-100">
      <div className="rounded-xl p-5 bg-slate-900 border border-slate-700 shadow-2xl space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-xs font-bold text-teal-400">
              Demo Tour · Step {currentStep.step} of 4
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-white">{currentStep.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {currentStep.description}
          </p>
          <div className="text-[11px] text-teal-400 font-medium">
            Key focus: {currentStep.highlightKey}
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {TOUR_STEPS.map((s, idx) => (
            <div
              key={s.step}
              className={`h-1.5 rounded-full transition-all ${
                idx <= currentStepIndex ? 'bg-teal-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold disabled:opacity-30 cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <button
            type="button"
            onClick={handleExecuteStep}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            {currentStep.recommendedActionText}
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold cursor-pointer flex items-center gap-1"
          >
            <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
