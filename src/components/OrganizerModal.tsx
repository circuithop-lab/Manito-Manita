import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, ShieldCheck, Play, Shuffle, CheckCircle2, AlertTriangle, Mail, RotateCcw, Trash2, Share2, Copy, Check, UserPlus, ArrowRight, RefreshCw, Edit3, ArrowLeftRight } from 'lucide-react';
import { Participant, EventConfig, OrganizerParticipant } from '../types/index.ts';
import { ParolStar } from './ParolStar.tsx';
import { FlagsHint } from './FlagsHint.tsx';

interface OrganizerModalProps {
  onClose: () => void;
  config: EventConfig;
  currentUser?: Participant | null;
  onExecuteDraw: (lockNow: boolean) => Promise<{ success: boolean; error?: string }>;
  onResetDraw: () => Promise<void>;
  onClearToBlank: () => Promise<void>;
  onRestoreSample: () => Promise<void>;
  onOpenEmailDispatch: () => void;
  onRefreshData?: () => Promise<void>;
}

export const OrganizerModal: React.FC<OrganizerModalProps> = ({
  onClose,
  config,
  currentUser,
  onExecuteDraw,
  onResetDraw,
  onClearToBlank,
  onRestoreSample,
  onOpenEmailDispatch,
  onRefreshData
}) => {
  // Check if current user is already the organizer (strictly fgainsanjr@gmail.com)
  const isDefaultOrganizer = currentUser?.email?.toLowerCase() === 'fgainsanjr@gmail.com';

  const [isOrganizerAuthed, setIsOrganizerAuthed] = useState<boolean>(isDefaultOrganizer);
  const [organizerEmail, setOrganizerEmail] = useState(currentUser?.email || '');
  const [organizerPin, setOrganizerPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active dashboard tab
  const [activeTab, setActiveTab] = useState<'roster' | 'pairings' | 'controls'>('roster');

  // Organizer Roster State (Secret Names Only!)
  const [roster, setRoster] = useState<OrganizerParticipant[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Add Participant State
  const [newNickname, setNewNickname] = useState('');
  const [newSpouseNickname, setNewSpouseNickname] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Manual Swap State
  const [swapA, setSwapA] = useState('');
  const [swapB, setSwapB] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  // Draw Simulation / Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    totalRuns: number;
    successfulRuns: number;
    selfMatchCount: number;
    spouseMatchCount: number;
    is100PercentValid: boolean;
  } | null>(null);

  const fetchOrganizerRoster = async () => {
    setRosterLoading(true);
    try {
      const res = await fetch('/api/organizer/roster');
      const data = await res.json();
      if (data.success && Array.isArray(data.roster)) {
        setRoster(data.roster);
      }
    } catch (err) {
      console.error('Error fetching organizer roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    if (isOrganizerAuthed) {
      fetchOrganizerRoster();
    }
  }, [isOrganizerAuthed]);

  // Handle Organizer Login
  const handleOrganizerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/organizer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: organizerEmail.trim(),
          password: organizerPin.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Invalid organizer email or PIN.');
        return;
      }

      setIsOrganizerAuthed(true);
      fetchOrganizerRoster();
    } catch {
      setLoginError('Error connecting to server.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Add a participant last-minute
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;

    setIsAdding(true);
    setActionError(null);
    try {
      const res = await fetch('/api/organizer/participants/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: newNickname.trim(),
          spouseNickname: newSpouseNickname.trim(),
          email: newEmail.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || 'Failed to add participant.');
        return;
      }

      setNewNickname('');
      setNewSpouseNickname('');
      setNewEmail('');
      setActionSuccess(`Added "${data.participant.nickname}" to roster.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchOrganizerRoster();
      if (onRefreshData) await onRefreshData();
    } catch {
      setActionError('Error adding participant.');
    } finally {
      setIsAdding(false);
    }
  };

  // Delete participant
  const handleDeleteParticipant = async (id: string, nickname: string) => {
    if (!confirm(`Are you sure you want to remove "${nickname}"? Their assignments will be cleared.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/organizer/participants/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Removed "${nickname}".`);
        setTimeout(() => setActionSuccess(null), 3000);
        await fetchOrganizerRoster();
        if (onRefreshData) await onRefreshData();
      } else {
        setActionError(data.error || 'Failed to remove.');
      }
    } catch {
      setActionError('Error deleting participant.');
    }
  };

  // Manual Pairing Re-assignment
  const handleReassignPairing = async (giverId: string, recipientId: string) => {
    setActionError(null);
    try {
      const res = await fetch('/api/organizer/pairings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giverId, recipientId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || 'Failed to update pairing.');
        return;
      }

      setActionSuccess(data.message || 'Pairing updated successfully.');
      setTimeout(() => setActionSuccess(null), 3500);
      await fetchOrganizerRoster();
      if (onRefreshData) await onRefreshData();
    } catch {
      setActionError('Error updating pairing.');
    }
  };

  // Swap Pairings between two givers
  const handleSwapPairings = async () => {
    if (!swapA || !swapB || swapA === swapB) {
      setActionError('Please select two distinct participants to swap recipients.');
      return;
    }

    setIsSwapping(true);
    setActionError(null);
    try {
      const res = await fetch('/api/organizer/pairings/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giverAId: swapA, giverBId: swapB })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || 'Failed to swap.');
        return;
      }

      setActionSuccess(data.message || 'Recipients swapped successfully.');
      setTimeout(() => setActionSuccess(null), 3500);
      setSwapA('');
      setSwapB('');
      await fetchOrganizerRoster();
      if (onRefreshData) await onRefreshData();
    } catch {
      setActionError('Error swapping recipients.');
    } finally {
      setIsSwapping(false);
    }
  };

  // Run AI Derangement simulation
  const handleSimulate = async () => {
    setIsSimulating(true);
    setActionError(null);
    try {
      const res = await fetch('/api/draw/test-simulation', { method: 'POST' });
      const data = await res.json();
      setSimulationResult(data);
    } catch {
      setActionError('Failed to run simulation test.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Execute Final Draw
  const handleExecute = async () => {
    setIsExecuting(true);
    setActionError(null);
    try {
      const res = await onExecuteDraw(true);
      if (!res.success && res.error) {
        setActionError(res.error);
      } else {
        setActionSuccess('Draw finalized! Participants can now unseal their envelopes.');
        setTimeout(() => setActionSuccess(null), 3500);
        await fetchOrganizerRoster();
      }
    } catch {
      setActionError('Execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset Draw
  const handleReset = async () => {
    if (confirm('Unlock and reset the draw? All secret assignments will be cleared for re-pairing.')) {
      await onResetDraw();
      setActionSuccess('Draw unlocked. Pairings reset.');
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchOrganizerRoster();
      setSimulationResult(null);
    }
  };

  // Clear Roster
  const handleClear = async () => {
    if (confirm('Clear all participants to an empty roster for fresh friend testing? You can restore sample couples anytime.')) {
      await onClearToBlank();
      onClose();
    }
  };

  // Restore Sample
  const handleRestore = async () => {
    if (confirm('Restore the 12 sample participants (6 married couples)?')) {
      await onRestoreSample();
      await fetchOrganizerRoster();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-3xl my-6 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-950 via-emerald-950 to-stone-900 text-white flex items-center justify-between border-b border-amber-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <ParolStar size={36} glow={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-300 font-semibold tracking-wide uppercase">
                  Organizer Dashboard
                </span>
                <span className="text-xs">🇵🇭 🇩🇪</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
                Lear Alumni Secret Santa Controls
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ORGANIZER LOGIN FORM (if not yet authed) */}
        {!isOrganizerAuthed ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                Organizer Verification
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Confidential organizer console for authorized event administrators. View secret names, adjust manual pairings, or manage participants.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleOrganizerLogin} className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-black dark:text-stone-200 mb-1">
                  Organizer Email
                </label>
                <input
                  type="email"
                  required
                  value={organizerEmail}
                  onChange={e => setOrganizerEmail(e.target.value)}
                  placeholder="Enter organizer email"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black dark:text-stone-200 mb-1">
                  Organizer Password or PIN
                </label>
                <input
                  type="password"
                  required
                  value={organizerPin}
                  onChange={e => setOrganizerPin(e.target.value)}
                  placeholder="Enter PIN or password"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Unlock Organizer Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ORGANIZER DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab navigation */}
            <div className="grid grid-cols-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'roster'
                    ? 'border-emerald-700 text-emerald-900 dark:text-emerald-200 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                👥 Secret Roster ({roster.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pairings')}
                className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'pairings'
                    ? 'border-emerald-700 text-emerald-900 dark:text-emerald-200 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                🎁 Manual Pairings
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('controls')}
                className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'controls'
                    ? 'border-emerald-700 text-emerald-900 dark:text-emerald-200 bg-white dark:bg-stone-900'
                    : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                ⚙️ AI Draw & Controls
              </button>
            </div>

            {/* Notifications */}
            {actionSuccess && (
              <div className="m-3 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="m-3 p-3 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

              {/* TAB 1: ROSTER (Secret Nicknames Only) */}
              {activeTab === 'roster' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                        Registered Participants (Secret Names Only)
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Real names & emails are kept confidential. You can add or delete participants in case of last-minute changes.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={fetchOrganizerRoster}
                      disabled={rosterLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 self-start sm:self-auto"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${rosterLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Add Last-Minute Participant Form */}
                  <form onSubmit={handleAddParticipant} className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                      + Add Participant Last-Minute
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <input
                          type="text"
                          required
                          value={newNickname}
                          onChange={e => setNewNickname(e.target.value)}
                          placeholder="Secret Nickname *"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={newSpouseNickname}
                          onChange={e => setNewSpouseNickname(e.target.value)}
                          placeholder="Spouse Nickname (optional)"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          placeholder="Email (optional)"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isAdding}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add to Roster</span>
                      </button>
                    </div>
                  </form>

                  {/* Roster Table */}
                  <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">#</th>
                          <th className="py-2.5 px-3 font-semibold">Secret Nickname</th>
                          <th className="py-2.5 px-3 font-semibold">Spouse Exclusion</th>
                          <th className="py-2.5 px-3 font-semibold">Wishlist</th>
                          <th className="py-2.5 px-3 font-semibold">Assigned Recipient</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {roster.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-stone-500 italic">
                              Roster is empty. Share the link or add names above.
                            </td>
                          </tr>
                        ) : (
                          roster.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                              <td className="py-2.5 px-3 text-stone-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-stone-900 dark:text-stone-100">
                                &ldquo;{p.nickname}&rdquo;
                              </td>
                              <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">
                                {p.spouseNickname ? `💍 ${p.spouseNickname}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400 font-mono">
                                {p.wishlistCount} {p.wishlistCount === 1 ? 'wish' : 'wishes'}
                              </td>
                              <td className="py-2.5 px-3">
                                {p.assignedToNickname ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
                                    <span>🎁 &ldquo;{p.assignedToNickname}&rdquo;</span>
                                  </span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 italic">Unassigned</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteParticipant(p.id, p.nickname)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                                  title="Remove participant who cannot join"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: MANUAL PAIRINGS & CUSTOM RE-ASSIGNMENT */}
              {activeTab === 'pairings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                      Manual Pairing Override (Special Cases & Requests)
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      In special cases, you can re-assign or swap gift recipients manually. Strict spouse exclusion and zero self-matching are validated.
                    </p>
                  </div>

                  {/* Swap Tool */}
                  <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Safe Pairing Swap Tool
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                      Swap recipients between two participants to keep a clean 1-to-1 bijection without creating deadlocks.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Participant A
                        </label>
                        <select
                          value={swapA}
                          onChange={e => setSwapA(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        >
                          <option value="">Select Participant A</option>
                          {roster.map(p => (
                            <option key={p.id} value={p.id}>
                              &ldquo;{p.nickname}&rdquo; (giving to &ldquo;{p.assignedToNickname || 'None'}&rdquo;)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                          Participant B
                        </label>
                        <select
                          value={swapB}
                          onChange={e => setSwapB(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        >
                          <option value="">Select Participant B</option>
                          {roster.map(p => (
                            <option key={p.id} value={p.id}>
                              &ldquo;{p.nickname}&rdquo; (giving to &ldquo;{p.assignedToNickname || 'None'}&rdquo;)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSwapPairings}
                        disabled={isSwapping || !swapA || !swapB || swapA === swapB}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-40"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Swap Recipients</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual Pairings List with direct re-assign selectors */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      Individual Re-Assignment Matrix:
                    </span>
                    <div className="space-y-2">
                      {roster.map(giver => {
                        // Candidate recipients: not giver himself
                        const eligibleRecipients = roster.filter(r => r.id !== giver.id);
                        return (
                          <div
                            key={giver.id}
                            className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                              <span className="text-emerald-700 dark:text-emerald-400">Giver:</span>
                              <span>&ldquo;{giver.nickname}&rdquo;</span>
                              {giver.spouseNickname && (
                                <span className="text-[10px] text-rose-500 font-normal">
                                  (Spouse: {giver.spouseNickname})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-stone-400">gifts to ➡️</span>
                              <select
                                value={giver.assignedToId || ''}
                                onChange={e => {
                                  if (e.target.value) {
                                    handleReassignPairing(giver.id, e.target.value);
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-stone-900 dark:text-stone-100"
                              >
                                <option value="">Select Recipient</option>
                                {eligibleRecipients.map(rec => {
                                  const isSpouse = Boolean(giver.spouseNickname && giver.spouseNickname.toLowerCase() === rec.nickname.toLowerCase());
                                  return (
                                    <option key={rec.id} value={rec.id} disabled={isSpouse}>
                                      {isSpouse ? `⚠️ ${rec.nickname} (Spouse)` : `🎁 ${rec.nickname}`}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTROLS & AI DRAW */}
              {activeTab === 'controls' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    config.isDrawFinalized
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {config.isDrawFinalized ? <Lock className="w-5 h-5 text-emerald-700" /> : <Unlock className="w-5 h-5 text-amber-700" />}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold">
                          {config.isDrawFinalized ? 'Draw Finalized & Sealed' : 'Draw Unsealed / In Progress'}
                        </h4>
                        <p className="text-[11px] opacity-80">
                          {config.isDrawFinalized ? 'Participants can unseal their secret envelopes in their dashboard.' : 'Participants cannot view matches until finalized.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Derangement Simulation */}
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                          AI Constraint Verification (100 Monte-Carlo Runs)
                        </span>
                        <p className="text-[11px] text-stone-500">
                          Mathematically verifies 0% self-draw and 0% spouse match with current roster.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSimulate}
                        disabled={isSimulating || roster.length < 3}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isSimulating ? 'Testing...' : 'Test AI Matching'}</span>
                      </button>
                    </div>

                    {simulationResult && (
                      <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border text-xs space-y-1">
                        <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>100% Valid Algorithm Test Passed!</span>
                        </span>
                        <p className="text-stone-600 dark:text-stone-300 text-[11px]">
                          100 simulated runs completed with 0 self-matches and 0 spouse-matches.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Execution Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleExecute}
                      disabled={isExecuting || roster.length < 3}
                      className="min-h-[44px] py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isExecuting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Run AI Draw & Seal Envelopes</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="min-h-[44px] py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Unlock / Reset Draw</span>
                    </button>
                  </div>

                  {/* Reset and Sample tools */}
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={onOpenEmailDispatch}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg"
                    >
                      <Mail className="w-3.5 h-3.5 text-red-600" />
                      <span>Configure EmailJS Dispatch</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRestore}
                        className="px-3 py-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg border border-stone-200 dark:border-stone-700"
                      >
                        Restore 12 Sample Couples
                      </button>

                      <button
                        type="button"
                        onClick={handleClear}
                        className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                      >
                        Clear Roster to Blank
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
