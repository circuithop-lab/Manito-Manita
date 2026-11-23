import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { ParolStar } from './ParolStar.tsx';
import { FlagsHint } from './FlagsHint.tsx';
import { Participant, EventConfig } from '../types/index.ts';

interface AuthViewProps {
  config: EventConfig;
  totalRegistered: number;
  targetParticipants: number;
  onAuthSuccess: (token: string, participant: Participant, isOrganizer?: boolean) => void;
  defaultMode?: 'login' | 'register';
  onOpenOrganizer?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  config,
  totalRegistered,
  targetParticipants,
  onAuthSuccess,
  defaultMode = 'login',
  onOpenOrganizer
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Simple direct login state: email & password
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Simple direct register state: ONLY email & password
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your email address and password.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Login failed. Please check your credentials.');
        return;
      }

      onAuthSuccess(data.token, data.participant, data.isOrganizer);
    } catch {
      setLoginError('Network error connecting to server. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Submit Simple Register (Email & Password only!)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim()) {
      setRegError('Email address and password are required.');
      return;
    }

    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    setRegLoading(true);
    setRegError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          password: regPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRegError(data.error || 'Registration failed. Please try again.');
        return;
      }

      onAuthSuccess(data.token, data.participant, data.isOrganizer);
    } catch {
      setRegError('Network error creating account. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header with dual flags hint */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shadow-sm">
          <ParolStar size={42} glow={false} />
        </div>

        <div className="flex justify-center">
          <FlagsHint size="sm" showLabel={true} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Lear Alumni Secret Santa
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
          Sign up with your email and password to enter your private dashboard, choose your secret alias, and add your Christmas wishlist.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-200/80 dark:bg-stone-800 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setLoginError(null);
          }}
          className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            mode === 'login'
              ? 'bg-white dark:bg-stone-900 text-emerald-900 dark:text-emerald-200 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          🔑 Log In
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('register');
            setRegError(null);
          }}
          className={`py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            mode === 'register'
              ? 'bg-white dark:bg-stone-900 text-emerald-900 dark:text-emerald-200 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          ✨ Register as New Participant
        </button>
      </div>

      {/* LOGIN CARD */}
      {mode === 'login' && (
        <form
          onSubmit={handleLoginSubmit}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
              Log In to My Dashboard
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Enter your email address and password to access your personal dashboard.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-black dark:text-stone-200 mb-1.5">
                Email Address <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-stone-200 mb-1.5">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-black dark:hover:text-stone-200"
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full min-h-[46px] py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loginLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Access My Private Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center space-y-2">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
              >
                Register here (simple email & password)
              </button>
            </p>

            {onOpenOrganizer && (
              <p className="text-[11px] text-stone-400">
                Are you the organizer?{' '}
                <button
                  type="button"
                  onClick={onOpenOrganizer}
                  className="text-stone-600 dark:text-stone-300 font-medium hover:underline cursor-pointer"
                >
                  Organizer Login
                </button>
              </p>
            )}
          </div>
        </form>
      )}

      {/* REGISTRATION CARD (Direct and simple: ONLY Email and Password) */}
      {mode === 'register' && (
        <form
          onSubmit={handleRegisterSubmit}
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
              Register as New Participant
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Simple and direct: enter your email and choose a password to create your account.
            </p>
          </div>

          {regError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <span className="font-bold shrink-0">⚠️</span>
              <span>{regError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-black dark:text-stone-200 mb-1.5">
                Email Address <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
              </div>
              <span className="text-[11px] text-stone-700 dark:text-stone-400 font-medium mt-1 block">
                Used to log in to your dashboard. Never revealed to other participants.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-black dark:text-stone-200 mb-1.5">
                Create Personal Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Min. 4 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-black dark:hover:text-stone-200"
                  tabIndex={-1}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Next Step: Your Dashboard</span>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
              Once registered, you'll be inside your private dashboard where you can easily pick your secret nickname, spouse exclusion, and Christmas wishlist.
            </p>
          </div>

          <button
            type="submit"
            disabled={regLoading}
            className="w-full min-h-[46px] py-3 px-4 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {regLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account & Open My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
              >
                Log in to your existing dashboard
              </button>
            </span>
          </div>
        </form>
      )}
    </div>
  );
};
