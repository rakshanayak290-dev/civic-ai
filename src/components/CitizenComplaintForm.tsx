import React, { useState, useEffect, useRef } from 'react';
import type { ComplaintCategory, Complaint, AIAnalysisResult } from '../types';
import { api, type DuplicateCheckResult } from '../services/api';
import { ExplainablePriorityCard } from './ExplainablePriorityCard';
import {
  Send,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  X,
  Upload,
  RotateCcw,
  Navigation,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  onComplaintSubmitted?: (complaint: Complaint) => void;
  onNavigateToTracking?: (complaintId: string) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Roads & Potholes',
  'Water & Sanitation',
  'Streetlights & Electrical',
  'Public Safety & Hazards',
  'Waste & Sanitation',
  'Traffic & Signage',
  'Parks & Public Spaces',
  'Noise & Pollution',
  'Other',
];

const SAMPLE_PHOTO_PRESETS = [
  {
    label: 'Pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Water Leak',
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Streetlight',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'Waste',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
  },
];

export const CitizenComplaintForm: React.FC<Props> = ({
  onComplaintSubmitted,
  onNavigateToTracking,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Roads & Potholes');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState<number>(37.7749);
  const [longitude, setLongitude] = useState<number>(-122.4194);
  const [citizenName, setCitizenName] = useState('');
  const [citizenContact, setCitizenContact] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // AI & Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState(0);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);
  const [dismissDuplicateNotice, setDismissDuplicateNotice] = useState(false);

  // Success state
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Duplicate Check Debounce on Title / Description change
  useEffect(() => {
    if (title.trim().length < 8 && description.trim().length < 15) {
      setDuplicateWarning(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const result = await api.checkDuplicate({
          title,
          description,
          category,
          latitude,
          longitude,
        });
        if (result.isDuplicate && (result.confidenceScore ?? 0) >= 65) {
          setDuplicateWarning(result);
          setDismissDuplicateNotice(false);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.warn('Duplicate check failed:', err);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [title, description, category, latitude, longitude]);

  // Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(5)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(5)));
        setGpsLoading(false);
        if (!address) {
          setAddress(`Near ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
      },
      (err) => {
        console.warn('GPS position error:', err);
        // Fallback to municipal default coordinates
        setLatitude(37.7749);
        setLongitude(-122.4194);
        setGpsLoading(false);
        if (!address) {
          setAddress('Central District (Default Geolocation)');
        }
      },
      { timeout: 7000 }
    );
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please upload a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick fill sample scenario
  const fillSampleComplaint = (type: 'pothole' | 'water' | 'electrical') => {
    if (type === 'pothole') {
      setTitle('Dangerous deep pothole bending car rims on Oak St');
      setDescription(
        'Deep 8-inch pothole right at the intersection crosswalk. Two vehicles have had tires blown out this morning and cyclists are swerving into oncoming traffic.'
      );
      setCategory('Roads & Potholes');
      setAddress('420 Oak Ave & 4th Street');
      setLandmark('Opposite Central Elementary School');
      setLatitude(37.7749);
      setLongitude(-122.4194);
      setPhotoUrl(SAMPLE_PHOTO_PRESETS[0].url);
    } else if (type === 'water') {
      setTitle('Ruptured water pipe flooding sidewalk and storefronts');
      setDescription(
        'High volume water is gushing through fractured asphalt. Water is 5 inches deep across two lanes and entering ground-floor commercial shops.'
      );
      setCategory('Water & Sanitation');
      setAddress('880 Market Street & 5th St');
      setLandmark('Outside Metro Plaza');
      setLatitude(37.7758);
      setLongitude(-122.4182);
      setPhotoUrl(SAMPLE_PHOTO_PRESETS[1].url);
    } else {
      setTitle('Sparking electric wire hanging low over wet sidewalk');
      setDescription(
        'Downed power line hanging approximately 5 feet off the ground and arcing into standing water puddle where pedestrians walk.'
      );
      setCategory('Streetlights & Electrical');
      setAddress('2001 Mission Street & 16th St');
      setLandmark('Near subway station entrance');
      setLatitude(37.7648);
      setLongitude(-122.4199);
      setPhotoUrl(SAMPLE_PHOTO_PRESETS[2].url);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Title and description are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Progress animation sequence
    setSubmitStage(1);
    const interval = setInterval(() => {
      setSubmitStage((prev) => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      const complaint = await api.createComplaint({
        title,
        description,
        category,
        location: {
          address: address || 'Reported Location',
          ward: 'Ward 3 - Central District',
          latitude,
          longitude,
          landmark,
        },
        photoUrl: photoUrl || undefined,
        citizenName: citizenName || 'Anonymous Citizen',
        citizenContact: citizenContact || undefined,
      });

      clearInterval(interval);
      setSubmittedComplaint(complaint);
      if (onComplaintSubmitted) {
        onComplaintSubmitted(complaint);
      }
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitStage(0);
    }
  };

  const handleCopyId = () => {
    if (!submittedComplaint) return;
    navigator.clipboard.writeText(submittedComplaint.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleResetForm = () => {
    setSubmittedComplaint(null);
    setTitle('');
    setDescription('');
    setAddress('');
    setLandmark('');
    setPhotoUrl('');
    setCitizenName('');
    setCitizenContact('');
    setDuplicateWarning(null);
  };

  // ---------------------------------------------------------------------------
  // Post-Submission AI Result Card (Requirement 8)
  // ---------------------------------------------------------------------------
  if (submittedComplaint) {
    const isCritical = submittedComplaint.priority.level === 'Critical';
    const isHigh = submittedComplaint.priority.level === 'High';
    const similarityPercent = submittedComplaint.duplicateInfo?.isDuplicate
      ? submittedComplaint.duplicateInfo.confidenceScore ?? 85
      : 0;

    return (
      <div className="max-w-3xl mx-auto gov-card p-6 sm:p-8 space-y-6 animate-fade-in text-slate-100">
        {/* Success Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Complaint Registered & Triaged
              </h2>
              <div className="text-xs text-slate-400">
                Official tracking record created in municipal operational register.
              </div>
            </div>
          </div>

          {/* Complaint ID Badge */}
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-teal-400">
              {submittedComplaint.id}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Copy ID"
            >
              {copiedId ? <CheckCircle className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* AI Analysis Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Identified Category
            </span>
            <div className="text-sm font-semibold text-white">
              {submittedComplaint.category}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Suggested Department
            </span>
            <div className="text-sm font-semibold text-white">
              {submittedComplaint.assignedDepartment || submittedComplaint.aiAnalysis?.suggestedDepartment || 'Public Works Department'}
            </div>
          </div>
        </div>

        {/* One-Line Summary */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            One-Line AI Executive Summary
          </span>
          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            "{submittedComplaint.aiAnalysis?.summary || submittedComplaint.title}"
          </p>
        </div>

        {/* Duplicate Check Result (Requirement 8) */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Duplicate Check Result
            </span>
            <span className={`text-xs font-bold ${similarityPercent >= 70 ? 'text-orange-400' : 'text-teal-400'}`}>
              {similarityPercent > 0 ? `${similarityPercent}% Similarity Match` : 'No Duplicates (0% Match)'}
            </span>
          </div>

          {submittedComplaint.duplicateInfo?.isDuplicate ? (
            <div className="text-xs text-orange-300 leading-relaxed bg-orange-950/20 p-2.5 rounded-lg border border-orange-500/30">
              <strong>Potential Duplicate:</strong> Matches existing record{' '}
              <span className="font-mono font-bold text-white">
                {submittedComplaint.duplicateInfo.parentComplaintId}
              </span>
              . {submittedComplaint.duplicateInfo.reason || 'High geographic and semantic overlap.'}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Report compared against all active incidents within 1,000m radius. No duplicate work orders detected.
            </p>
          )}
        </div>

        {/* Explainable Priority Card (Requirement 8) */}
        <ExplainablePriorityCard
          priority={submittedComplaint.priority}
          analysisEngine={submittedComplaint.aiAnalysis?.analysisEngine}
          showDetailsDefault={true}
        />

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Submit another report</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTracking && onNavigateToTracking(submittedComplaint.id)}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Track this report live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Input Form View (Completable in under 60 seconds)
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto gov-card p-6 sm:p-8 space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Report a Civic Issue</h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete in under 1 minute. AI will categorize, check duplicates, and prioritize your report.
          </p>
        </div>

        {/* Quick Demo Pre-fill */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Sample:</span>
          <button
            type="button"
            onClick={() => fillSampleComplaint('pothole')}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Pothole
          </button>
          <button
            type="button"
            onClick={() => fillSampleComplaint('water')}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Water Leak
          </button>
          <button
            type="button"
            onClick={() => fillSampleComplaint('electrical')}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
          >
            Live Wire
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-200 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Duplicate Notice on live typing */}
      {duplicateWarning && !dismissDuplicateNotice && (
        <div className="p-3.5 rounded-lg bg-orange-950/30 border border-orange-500/40 text-xs text-orange-200 space-y-2 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 font-semibold text-orange-300">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span>Possible Duplicate Detected ({duplicateWarning.confidenceScore}% Match)</span>
            </div>
            <button
              type="button"
              onClick={() => setDismissDuplicateNotice(true)}
              className="text-orange-400 hover:text-orange-200 text-[11px]"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{duplicateWarning.reason}</p>
          {duplicateWarning.matchedComplaint && (
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-slate-300">
                Case {duplicateWarning.matchedComplaint.id}: "{duplicateWarning.matchedComplaint.title}"
              </span>
              <button
                type="button"
                onClick={() =>
                  onNavigateToTracking && onNavigateToTracking(duplicateWarning.parentComplaintId!)
                }
                className="text-teal-400 hover:underline font-semibold text-[11px] cursor-pointer"
              >
                View Existing →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Category & Title */}
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:outline-hidden"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole causing tire damage near school crosswalk"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-hidden text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description & Details *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the exact location, severity, when it started, and any immediate hazard..."
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-hidden text-sm"
            />
          </div>
        </div>

        {/* Location & Map Pin */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>Location & Coordinates</span>
            </span>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gpsLoading}
              className="px-2.5 py-1 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-semibold border border-teal-500/30 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Navigation className="w-3 h-3" />
              <span>{gpsLoading ? 'Locating...' : 'Use my location'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Address / Street *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 420 Oak Ave & 4th Street"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Central Elementary"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-teal-500"
              />
            </div>
          </div>

          {/* Interactive Map Pin Coordinate Setter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Interactive Map Pin (Click to adjust pin location)</span>
              <span className="font-mono text-teal-400">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            </div>

            <div
              className="relative w-full h-28 rounded-lg bg-slate-950 border border-slate-700 overflow-hidden cursor-crosshair select-none"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width; // 0 to 1
                const y = (e.clientY - rect.top) / rect.height; // 0 to 1
                // Map to city coordinate bounding box ~ 37.7500 to 37.7900, -122.4500 to -122.4000
                const newLat = parseFloat((37.79 - y * 0.04).toFixed(4));
                const newLng = parseFloat((-122.45 + x * 0.05).toFixed(4));
                setLatitude(newLat);
                setLongitude(newLng);
              }}
            >
              {/* Grid Lines */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #334155 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="absolute inset-x-0 top-1/2 border-t border-slate-800" />
              <div className="absolute inset-y-0 left-1/2 border-l border-slate-800" />

              {/* Pin indicator */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                style={{
                  left: `${((longitude - -122.45) / 0.05) * 100}%`,
                  top: `${((37.79 - latitude) / 0.04) * 100}%`,
                }}
              >
                <div className="w-5 h-5 rounded-full bg-teal-500/30 border border-teal-400 flex items-center justify-center animate-ping" />
                <div className="absolute w-3 h-3 rounded-full bg-teal-400 border-2 border-slate-900 shadow-md" />
              </div>

              <div className="absolute bottom-1 right-2 text-[10px] text-slate-500">
                Civic Map Grid
              </div>
            </div>
          </div>
        </div>

        {/* Photo Upload with Preview */}
        <div>
          <label className="block font-semibold text-slate-300 mb-1">
            Photo Evidence (Optional)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition-colors">
              <Upload className="w-3.5 h-3.5 text-teal-400" />
              <span>Choose File</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

            <span className="text-slate-500 text-xs">or preset:</span>
            {SAMPLE_PHOTO_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPhotoUrl(p.url)}
                className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {photoUrl && (
            <div className="mt-2.5 relative inline-block">
              <img
                src={photoUrl}
                alt="Evidence preview"
                className="w-40 h-24 object-cover rounded-lg border border-slate-700 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="absolute -top-1.5 -right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full cursor-pointer"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Citizen Contact (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Your Name (Optional)</label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              placeholder="e.g. Marcus Bennett"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Contact Email / Phone (Optional)</label>
            <input
              type="text"
              value={citizenContact}
              onChange={(e) => setCitizenContact(e.target.value)}
              placeholder="e.g. marcus@example.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Submission Progress Bar & Submit Button */}
        <div className="pt-3 border-t border-slate-700 space-y-3">
          {isSubmitting && (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-teal-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
                  {submitStage === 1 && 'Analyzing report text with AI model...'}
                  {submitStage === 2 && 'Detecting neighborhood duplicates...'}
                  {submitStage === 3 && 'Computing explainable priority score...'}
                  {submitStage >= 4 && 'Saving report to municipal register...'}
                </span>
                <span>{submitStage * 25}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${submitStage * 25}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              Immediate persistent storage in municipal database.
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Analyzing & Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
