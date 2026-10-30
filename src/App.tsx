import React, { useState } from 'react';
import { Header, type AppTab } from './components/Header';
import { Homepage } from './components/Homepage';
import { CitizenComplaintForm } from './components/CitizenComplaintForm';
import { ComplaintTracker } from './components/ComplaintTracker';
import { HotspotMap } from './components/HotspotMap';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutLimitations } from './components/AboutLimitations';
import { DiagnosticsSuite } from './components/DiagnosticsSuite';
import { AuthModal } from './components/AuthModal';
import { JudgeDemoTour } from './components/JudgeDemoTour';
import type { Complaint } from './types';
import {
  Send,
  Search,
  MapPin,
  Shield,
  Info,
  Activity,
  CheckCircle,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [trackedComplaintId, setTrackedComplaintId] = useState<string>('CIV-2026-4819');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Elena Vance');
  const [userRole, setUserRole] = useState<string>('Chief Dispatcher');

  const handleComplaintSubmitted = (complaint: Complaint) => {
    setTrackedComplaintId(complaint.id);
  };

  const handleNavigateToTracking = (complaintId: string) => {
    setTrackedComplaintId(complaintId);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectComplaintFromHotspot = (complaintId: string) => {
    setTrackedComplaintId(complaintId);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthenticate = (name: string, role: string) => {
    setUserName(name);
    setUserRole(role);
    setIsAdminAuthenticated(true);
  };

  // Mobile Bottom Nav items (Requirement 3: Report, Track, Map, Admin)
  const mobileNavItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'submit', label: 'Report', icon: <Send className="w-5 h-5" /> },
    { id: 'track', label: 'Track', icon: <Search className="w-5 h-5" /> },
    { id: 'hotspots', label: 'Map', icon: <MapPin className="w-5 h-5" /> },
    { id: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950 relative">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        userName={userName}
        userRole={userRole}
        onOpenDemoTour={() => setIsDemoTourOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 pb-28 md:pb-12">
        {activeTab === 'home' && (
          <Homepage
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'submit' && (
          <CitizenComplaintForm
            onComplaintSubmitted={handleComplaintSubmitted}
            onNavigateToTracking={handleNavigateToTracking}
          />
        )}

        {activeTab === 'track' && (
          <ComplaintTracker
            initialComplaintId={trackedComplaintId}
            onSelectComplaint={handleNavigateToTracking}
          />
        )}

        {activeTab === 'hotspots' && (
          <HotspotMap onSelectComplaint={handleSelectComplaintFromHotspot} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onSelectComplaintForTracking={handleNavigateToTracking}
            isAdminAuthenticated={isAdminAuthenticated}
            onSetAdminAuthenticated={setIsAdminAuthenticated}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'about' && (
          <AboutLimitations
            onNavigate={(tab) => {
              setActiveTab(tab as AppTab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'diagnostics' && <DiagnosticsSuite />}
      </main>

      {/* Auth Modal for Municipal Officers & Citizens */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={handleAuthenticate}
      />

      {/* 5-Minute Judge Demo Tour */}
      <JudgeDemoTour
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab as AppTab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectComplaintForTracking={handleNavigateToTracking}
      />

      {/* Mobile-First Bottom Navigation Bar (Requirement 3: Report, Track, Map, Admin) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-50 flex items-center justify-around py-2 px-3 shadow-lg"
      >
        {mobileNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modern, Trustworthy Government-Tech Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 mt-auto py-8 relative z-10 text-xs text-slate-400 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                C
              </div>
              <div>
                <span className="font-bold text-white text-sm">CivicAI</span>
                <span className="text-slate-500 ml-2 text-xs">PromptWars × ASTRA Project</span>
              </div>
            </div>

            <div className="text-center md:text-left text-xs text-slate-400 max-w-md">
              "Transform scattered citizen reports into prioritized, explainable, and trackable action."
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-400 hover:text-teal-400 font-medium transition-colors cursor-pointer"
              >
                About & Limitations
              </button>
              <span className="text-slate-700">·</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('diagnostics');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-400 hover:text-teal-400 font-medium transition-colors cursor-pointer"
              >
                Diagnostics
              </button>
              <span className="text-slate-700">·</span>
              <button
                type="button"
                onClick={() => setIsDemoTourOpen(true)}
                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer"
              >
                Judge Demo Tour
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>© 2026 CivicAI · Municipal Operations Platform · Demo data clearly labeled</span>
            <span>Deterministic Civic Priority Formula & Gemini AI Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
