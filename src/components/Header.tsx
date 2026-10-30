import React, { useState, useEffect } from 'react';
import { api, type HealthCheckResult } from '../services/api';
import {
  ShieldAlert,
  Send,
  Search,
  MapPin,
  Shield,
  Activity,
  Cpu,
  Info,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export type AppTab =
  | 'home'
  | 'submit'
  | 'track'
  | 'hotspots'
  | 'admin'
  | 'about'
  | 'diagnostics'
  | 'analytics'
  | 'ai-sandbox';

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  isAdminAuthenticated: boolean;
  onOpenAuthModal: () => void;
  userName?: string;
  userRole?: string;
  onOpenDemoTour?: () => void;
  onOpenDossier?: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  isAdminAuthenticated,
  onOpenAuthModal,
  userName = 'Elena Vance',
  userRole = 'Chief Dispatcher',
  onOpenDemoTour,
  onOpenDossier,
}) => {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api
      .checkHealth()
      .then(setHealth)
      .catch((err) => console.warn('Health check error:', err));
  }, []);

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Overview', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'submit', label: 'Report Issue', icon: <Send className="w-4 h-4" /> },
    { id: 'track', label: 'Track', icon: <Search className="w-4 h-4" /> },
    { id: 'hotspots', label: 'Hotspot Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'admin', label: 'Admin', icon: <Shield className="w-4 h-4" /> },
    { id: 'about', label: 'About & Limitations', icon: <Info className="w-4 h-4" /> },
    { id: 'diagnostics', label: 'Diagnostics', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100">
      {/* Top Utility Bar */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs text-slate-400 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">CivicAI</span>
          <span className="text-slate-600">·</span>
          <span>PromptWars × ASTRA Hackathon</span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-400 hidden sm:inline">"From Complaints to Action"</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">AI Engine:</span>
            {health?.geminiConfigured ? (
              <span className="text-teal-400 font-medium">Gemini 3.8 Flash (Active)</span>
            ) : (
              <span className="text-slate-300 font-medium">Civic Heuristics Engine</span>
            )}
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Database:</span>
            <span className="flex items-center gap-1 text-teal-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              Cloud Firestore (Connected)
            </span>
          </div>

          <span className="text-slate-700">|</span>

          {onOpenDemoTour && (
            <button
              type="button"
              onClick={onOpenDemoTour}
              className="text-teal-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
            >
              Tour
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
              C
            </div>
            <div>
              <div className="font-bold text-white text-base leading-none">CivicAI</div>
              <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">Municipal Operations</div>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-teal-400 font-semibold border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Admin User Status */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <div className="text-left">
                <div className="font-medium text-white">{userName}</div>
                <div className="text-[10px] text-slate-400 leading-none">{userRole}</div>
              </div>
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Accessible from top hamburger if needed) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  isActive
                    ? 'bg-slate-800 text-teal-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800 mt-2">
            <button
              type="button"
              onClick={() => {
                onOpenAuthModal();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-300 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>{userName} ({userRole})</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
