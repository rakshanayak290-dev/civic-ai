import React, { useState } from 'react';
import type { ComplaintCategory, AIAnalysisResult, PriorityBreakdown } from '../types';
import { api } from '../services/api';
import { ExplainablePriorityCard } from './ExplainablePriorityCard';
import {
  Cpu,
  Sparkles,
  Sliders,
  Send,
  Zap,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  Lightbulb,
  Tag,
  RotateCcw,
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    title: 'High-pressure water main rupture flooding sidewalks and undermining curb',
    description: 'Clean drinking water is erupting from beneath the pavement on Riverside Blvd. The street is flooded for 100 meters, water pressure has dropped in neighboring blocks, and soil erosion is beginning to undermine the curbside.',
    category: 'Water & Sanitation' as ComplaintCategory,
    location: '782 Riverside Boulevard, Ward 7',
  },
  {
    title: 'Exposed live electrical wires hanging from bent streetlight pole over sidewalk',
    description: 'A delivery truck clipped the metal lamp pole at Pine & 12th. The pole is bent at a 30-degree angle and raw insulated electrical wiring is exposed and dangling at eye level over the sidewalk near a busy metro station entrance.',
    category: 'Streetlights & Electrical' as ComplaintCategory,
    location: 'Pine Street & 12th Ave, Ward 5',
  },
  {
    title: 'Massive sinkhole opening up directly in front of primary school gate',
    description: 'A 5-foot cavity has appeared in the crosswalk right where children cross for morning drop-off. Asphalt edge is actively crumbling into an underground drainage canal with running water visible.',
    category: 'Public Safety & Hazards' as ComplaintCategory,
    location: '420 Oak Avenue, Ward 3',
  },
  {
    title: 'Automated traffic controller failure with all signals dark at major 6-lane artery',
    description: 'Traffic signals completely non-functional at the main highway offramp intersection. Drivers are getting aggressive, gridlock stretches 1.5 miles, and multiple near-miss broadside collisions observed.',
    category: 'Traffic & Signage' as ComplaintCategory,
    location: 'Montgomery & 2nd St, Ward 1',
  },
];

export const AISandbox: React.FC = () => {
  const [title, setTitle] = useState(PRESET_SCENARIOS[0].title);
  const [description, setDescription] = useState(PRESET_SCENARIOS[0].description);
  const [category, setCategory] = useState<ComplaintCategory>(PRESET_SCENARIOS[0].category);
  const [location, setLocation] = useState(PRESET_SCENARIOS[0].location);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive weight modifier sliders
  const [safetyWeight, setSafetyWeight] = useState(40);
  const [urgencyWeight, setUrgencyWeight] = useState(35);
  const [impactWeight, setImpactWeight] = useState(25);

  const handleRunAnalysis = async (customTitle?: string, customDesc?: string, customCat?: ComplaintCategory) => {
    const t = customTitle || title;
    const d = customDesc || description;
    const c = customCat || category;

    if (!t.trim() || !d.trim()) {
      setErrorMsg('Please provide both an incident title and description.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeText({
        title: t,
        description: d,
        category: c,
        location,
      });
      setAnalysisResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI analysis request failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPreset = (p: typeof PRESET_SCENARIOS[0]) => {
    setTitle(p.title);
    setDescription(p.description);
    setCategory(p.category);
    setLocation(p.location);
    handleRunAnalysis(p.title, p.description, p.category);
  };

  // Recalculated custom score based on weights
  const customScore = analysisResult
    ? Math.min(
        100,
        Math.round(
          analysisResult.priority.factors.safetyRisk * (safetyWeight / 10) +
            analysisResult.priority.factors.urgency * (urgencyWeight / 10) +
            analysisResult.priority.factors.publicImpact * (impactWeight / 10)
        )
      )
    : 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-[#1f1646] via-[#2f1b66] to-[#141b44] border border-[#7028E4]/40 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-r from-[#F72585] to-[#7028E4] opacity-30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#4169FF]/30 to-[#F72585]/30 border border-white/20 text-xs font-bold text-cyan-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Interactive Neural Triage Sandbox</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              AI Analysis & Explainability Engine
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-light">
              Experience how Gemini 3.8 Flash dissects natural-language complaints into concise action orders, safety metrics, and explainable priority scores.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl glass-panel-dark text-xs font-semibold text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time Server Model
            </span>
          </div>
        </div>
      </div>

      {/* Preset Scenario Quick-Picks */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Load Municipal Benchmark Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SCENARIOS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="p-3.5 rounded-2xl glass-panel-dark border border-white/10 hover:border-[#7028E4] text-left transition-all hover:scale-102 group cursor-pointer"
            >
              <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-1">
                {p.category}
              </div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                {p.title}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Playground Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-3xl p-6 glass-panel-dark border border-white/10 text-white space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Input Incident Parameters</span>
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-500/20 border border-rose-400 text-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Complaint Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Incident summary headline..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Detailed Description & Hazard Observed
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exact conditions, pedestrian exposure, speed of deterioration..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                >
                  <option value="Roads & Potholes">Roads & Potholes</option>
                  <option value="Water & Sanitation">Water & Sanitation</option>
                  <option value="Streetlights & Electrical">Streetlights & Electrical</option>
                  <option value="Public Safety & Hazards">Public Safety & Hazards</option>
                  <option value="Waste & Sanitation">Waste & Sanitation</option>
                  <option value="Traffic & Signage">Traffic & Signage</option>
                  <option value="Parks & Public Spaces">Parks & Public Spaces</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Location Context
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Street / Ward..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRunAnalysis()}
              disabled={isAnalyzing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F72585] via-[#7028E4] to-[#4169FF] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Neural Triage...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Execute AI Triage Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* Dynamic Weight Tuning Card */}
          <div className="rounded-3xl p-5 glass-panel-dark border border-white/10 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                <Sliders className="w-4 h-4 text-pink-400" />
                Explainability Weight Tuner
              </span>
              <button
                type="button"
                onClick={() => {
                  setSafetyWeight(40);
                  setUrgencyWeight(35);
                  setImpactWeight(25);
                }}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Weights
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Safety Risk Weight</span>
                  <span className="font-bold text-rose-400">{safetyWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={safetyWeight}
                  onChange={(e) => setSafetyWeight(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Urgency Weight</span>
                  <span className="font-bold text-amber-400">{urgencyWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={urgencyWeight}
                  onChange={(e) => setUrgencyWeight(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Public Footfall Impact Weight</span>
                  <span className="font-bold text-cyan-400">{impactWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={impactWeight}
                  onChange={(e) => setImpactWeight(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {analysisResult && (
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300">Simulated Custom Priority Score:</span>
                <span className="text-base font-black text-cyan-300">{customScore} / 100</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-6 space-y-4">
          {analysisResult ? (
            <div className="rounded-3xl p-6 glass-panel-dark border border-white/10 text-white space-y-5 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Analysis Completed
                  </span>
                </div>
                <span className="text-[11px] bg-[#7028E4]/40 px-3 py-1 rounded-full text-purple-200 border border-purple-400/30">
                  Engine: {analysisResult.analysisEngine}
                </span>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#4169FF]/20 to-[#7028E4]/20 border border-indigo-400/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-1">
                  Executive Dispatch Summary
                </span>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  "{analysisResult.summary}"
                </p>
              </div>

              {/* Action Recommendation */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F72585]/20 to-[#FF9F43]/20 border border-pink-400/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300 block mb-1">
                  Immediate Field Action Recommendation
                </span>
                <p className="text-xs font-medium text-slate-100 leading-relaxed">
                  {analysisResult.recommendedAction}
                </p>
              </div>

              {/* Explainable Priority Card */}
              <ExplainablePriorityCard
                priority={analysisResult.priority}
                analysisEngine={analysisResult.analysisEngine}
                showDetailsDefault={true}
              />

              {/* Routing & Keywords */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Assigned Municipal Agency
                  </span>
                  <span className="font-bold text-white mt-0.5 block">
                    {analysisResult.suggestedDepartment}
                  </span>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Confidence Metric
                  </span>
                  <span className="font-bold text-cyan-300 mt-0.5 block">
                    {Math.round(analysisResult.confidence * 100)}% Confidence
                  </span>
                </div>
              </div>

              {/* Keywords Tag cloud */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Extracted Civic Entities & Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.detectedKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[11px] font-medium text-slate-200"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl p-12 glass-panel-dark border border-white/10 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7028E4] to-[#00D4FF] flex items-center justify-center text-white mx-auto shadow-xl">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">AI Engine Awaiting Input</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Select a benchmark scenario above or type custom incident parameters to run the live explainable priority evaluation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
