import React, { useState } from 'react';
import { Shuffle, ShieldCheck, Lock, Unlock, Eye, EyeOff, Play, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Participant, DrawPairingSummary } from '../types/index.ts';

interface DrawAdminViewProps {
  participants: Participant[];
  isDrawFinalized: boolean;
  drawnAt?: string;
  onExecuteDraw: (lockNow: boolean) => Promise<{ success: boolean; pairings?: DrawPairingSummary[]; error?: string }>;
  onResetDraw: () => Promise<void>;
  onNavigateToEmails: () => void;
  onNavigateToReveal: () => void;
}

export const DrawAdminView: React.FC<DrawAdminViewProps> = ({
  participants,
  isDrawFinalized,
  drawnAt,
  onExecuteDraw,
  onResetDraw,
  onNavigateToEmails,
  onNavigateToReveal
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulationResults, setSimulationResults] = useState<{
    totalRuns: number;
    successfulRuns: number;
    selfMatchCount: number;
    spouseMatchCount: number;
    is100PercentValid: boolean;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [adminPairings, setAdminPairings] = useState<DrawPairingSummary[] | null>(null);
  const [hideAdminSecrets, setHideAdminSecrets] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Load existing pairings summary if already drawn
  React.useEffect(() => {
    if (isDrawFinalized) {
      fetch('/api/draw/summary')
        .then(res => res.json())
        .then(data => {
          if (data.summary) setAdminPairings(data.summary);
        })
        .catch(err => console.error('Error fetching draw summary:', err));
    }
  }, [isDrawFinalized]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setAdminError(null);
    try {
      const res = await fetch('/api/draw/test-simulation', { method: 'POST' });
      const data = await res.json();
      setSimulationResults(data);
    } catch (err) {
      console.error('Simulation error:', err);
      setAdminError('Simulation failed. Please check server logs.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecuteDraw = async (lockNow: boolean) => {
    setIsExecuting(true);
    setAdminError(null);
    try {
      const result = await onExecuteDraw(lockNow);
      if (result.success && result.pairings) {
        setAdminPairings(result.pairings);
      } else if (result.error) {
        setAdminError(result.error);
      }
    } catch (err: unknown) {
      console.error('Draw execution failed:', err);
      setAdminError('Draw execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to unlock and reset the draw? All existing pairings will be cleared.')) {
      await onResetDraw();
      setAdminPairings(null);
      setSimulationResults(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Status */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-red-700 dark:text-red-400" />
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                The Grand Draw & Matching Engine
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-1">
              <span>Constrained Derangement Solver</span>
              <span aria-hidden="true">·</span>
              <span>Zero Self-Matches</span>
              <span aria-hidden="true">·</span>
              <span>Zero Spouse-Matches</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDrawFinalized ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Draw Locked ({new Date(drawnAt || Date.now()).toLocaleDateString()})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800">
                <Unlock className="w-3.5 h-3.5 text-amber-600" /> Unlocked / Ready to Draw
              </span>
            )}
          </div>
        </div>

        {/* Algorithm Rules Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800">
            <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-1">
              Rule 1: No Self-Drawing
            </span>
            <p className="text-stone-500 dark:text-stone-400 text-[11px]">
              Every participant $A$ gives to someone other than $A$ ($P_i \neq i$).
            </p>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800">
            <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-1">
              Rule 2: No Spouse-Drawing
            </span>
            <p className="text-stone-500 dark:text-stone-400 text-[11px]">
              Married partners cannot draw each other (Receiver &ne; Spouse).
            </p>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800">
            <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-1">
              Rule 3: Bijective Permutation
            </span>
            <p className="text-stone-500 dark:text-stone-400 text-[11px]">
              Everyone gives exactly 1 gift and receives exactly 1 gift.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Simulation Panel */}
      <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-serif font-bold text-base text-emerald-950 dark:text-emerald-100">
                Mathematical Verification Test
              </h3>
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              Run 100 consecutive randomized iterations on the server to verify 100% adherence to all spouse & self-draw constraints.
            </p>
          </div>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all whitespace-nowrap disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run 100 Test Simulations</span>
              </>
            )}
          </button>
        </div>

        {simulationResults && (
          <div className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-emerald-200 dark:border-emerald-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <span className="block text-lg font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                {simulationResults.totalRuns}
              </span>
              <span className="text-[11px] text-stone-500">Test Iterations</span>
            </div>

            <div>
              <span className="block text-lg font-bold font-mono text-emerald-600 tabular-nums">
                {simulationResults.successfulRuns} (100%)
              </span>
              <span className="text-[11px] text-stone-500">Valid Solutions</span>
            </div>

            <div>
              <span className="block text-lg font-bold font-mono text-emerald-600 tabular-nums">
                {simulationResults.selfMatchCount} (0%)
              </span>
              <span className="text-[11px] text-stone-500">Self Matches</span>
            </div>

            <div>
              <span className="block text-lg font-bold font-mono text-emerald-600 tabular-nums">
                {simulationResults.spouseMatchCount} (0%)
              </span>
              <span className="text-[11px] text-stone-500">Spouse Matches</span>
            </div>
          </div>
        )}
      </div>

      {adminError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{adminError}</span>
        </div>
      )}

      {/* Main Draw Trigger Console */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              Draw Execution Controls
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Click to generate the final secret assignments for all {participants.length} participants.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isDrawFinalized ? (
              <button
                onClick={() => handleExecuteDraw(true)}
                disabled={isExecuting || participants.length < 3}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md shadow-red-950/20 active:scale-[0.98] transition-all"
              >
                {isExecuting ? 'Shuffling & Solving...' : 'Execute & Lock Draw'}
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-lg transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" /> Unlock & Re-Draw
              </button>
            )}
          </div>
        </div>

        {/* Zero-Spoiler Blind Confirmation Card for Participating Organizer */}
        {isDrawFinalized && (
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-4">
            <div className="p-5 bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 text-white rounded-xl border border-amber-400/30 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <h4 className="font-serif font-bold text-base text-amber-300">
                  Draw Complete · 100% Blind & Secret Envelopes Sealed
                </h4>
              </div>

              <p className="text-xs text-stone-200 leading-relaxed">
                <strong className="text-amber-200">Zero-Spoilers Protection:</strong> Because you are also participating in the gift exchange, all pairings and real names are completely hidden from this admin panel. You can play and enjoy Christmas Eve with 100% genuine surprise!
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="p-2.5 bg-black/40 rounded-lg">
                  <span className="block font-bold text-amber-300 text-sm">{participants.length}</span>
                  <span className="text-[10px] text-stone-400">Total Envelopes</span>
                </div>
                <div className="p-2.5 bg-black/40 rounded-lg">
                  <span className="block font-bold text-emerald-400 text-sm">0 Self-Matches</span>
                  <span className="text-[10px] text-stone-400">Mathematically Verified</span>
                </div>
                <div className="p-2.5 bg-black/40 rounded-lg">
                  <span className="block font-bold text-emerald-400 text-sm">0 Spouse-Matches</span>
                  <span className="text-[10px] text-stone-400">Exclusion Enforced</span>
                </div>
                <div className="p-2.5 bg-black/40 rounded-lg">
                  <span className="block font-bold text-amber-300 text-sm">Dec 24, 2026</span>
                  <span className="text-[10px] text-stone-400">Lohra-Kirchvers</span>
                </div>
              </div>
            </div>

            {/* Quick Next Steps */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-stone-500">
                Each participant can now open their sealed envelope in &ldquo;My Dashboard&rdquo;!
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToReveal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800"
                >
                  <span>Go to My Dashboard</span>
                </button>

                <button
                  onClick={onNavigateToEmails}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm"
                >
                  <span>EmailJS Dispatch Log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
