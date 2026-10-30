import React, { useState } from 'react';
import {
  Shield,
  User,
  X,
  KeyRound,
  CheckCircle2,
  Building,
} from 'lucide-react';

import { loginWithGoogle, loginAnonymously } from '../lib/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (officerName: string, role: string) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onAuthenticate }) => {
  const [tab, setTab] = useState<'officer' | 'citizen'>('officer');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        const isAdmin = user.email === 'rakshanayak290@gmail.com';
        const role = isAdmin ? 'Municipal Chief Administrator (Admin)' : 'Municipal Dispatcher';
        const name = user.displayName || user.email || 'Municipal Officer';
        onAuthenticate(name, role);
        onClose();
      }
    } catch (err: any) {
      console.warn('[Firebase Auth] Sign in notice:', err);
      setErrorMsg(err.message || 'Firebase Google Sign-In could not be completed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOfficerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === 'CIVIC2026' || pin === 'admin' || pin === '1234' || pin === '') {
      onAuthenticate('Elena Vance', 'Chief Dispatcher');
      onClose();
    } else {
      setErrorMsg('Invalid municipal credentials. Demo PIN is CIVIC2026 (or leave blank).');
    }
  };

  const handleCitizenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    // Attempt anonymous Firebase auth session
    loginAnonymously().catch(() => null);
    onAuthenticate(fullName.trim(), 'Citizen Resident');
    onClose();
  };

  const handleQuickDemo = (name: string, role: string) => {
    onAuthenticate(name, role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-100">
      <div className="relative w-full max-w-md rounded-xl p-6 bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Identity & Access Control</h3>
              <p className="text-[11px] text-slate-400">Authenticate for dispatch role or resident profile</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('officer');
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              tab === 'officer'
                ? 'bg-slate-800 text-teal-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Municipal Officer
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('citizen');
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              tab === 'citizen'
                ? 'bg-slate-800 text-teal-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Citizen Resident
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-950/40 border border-red-500/40 text-red-200 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {/* Officer Form */}
        {tab === 'officer' ? (
          <form onSubmit={handleOfficerLogin} className="space-y-3.5 text-xs">
            {/* Real Firebase Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              {isSigningIn ? 'Connecting to Google...' : 'Sign In with Google (Admin rakshanayak290@gmail.com)'}
            </button>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 my-1">
              <div className="flex-1 h-px bg-slate-800" />
              <span>OR USE DISPATCHER PIN</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Officer Security PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Demo PIN: CIVIC2026 (or leave blank)"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 text-sm font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Sign In as Dispatcher
            </button>

            {/* Quick Officer Profiles */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[11px] text-slate-400">Or quick-switch profile:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('Elena Vance', 'Chief Dispatcher')}
                  className="p-2 text-left rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs cursor-pointer"
                >
                  <div className="font-semibold text-white">Elena Vance</div>
                  <div className="text-[10px] text-teal-400">Chief Dispatcher</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('David Ramirez', 'Public Works Lead')}
                  className="p-2 text-left rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs cursor-pointer"
                >
                  <div className="font-semibold text-white">David Ramirez</div>
                  <div className="text-[10px] text-teal-400">Public Works Lead</div>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Citizen Form */
          <form onSubmit={handleCitizenRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Your Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Marcus Bennett"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Continue as Citizen
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
