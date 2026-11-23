import React, { useState } from 'react';
import { UserPlus, Edit3, Trash2, RotateCcw, Heart, Gift, Sparkles, CheckCircle2, Share2 } from 'lucide-react';
import { Participant } from '../types/index.ts';

interface RosterViewProps {
  participants: Participant[];
  minBudgetEur: number;
  onEditParticipant: (participant: Participant) => void;
  onDeleteParticipant: (id: string) => void;
  onAddParticipant: (newP: Partial<Participant>) => Promise<Participant | void>;
  onResetSample: () => Promise<void>;
  onClearToBlank?: () => Promise<void>;
  onOpenInvite?: () => void;
  isDrawFinalized: boolean;
}

export const RosterView: React.FC<RosterViewProps> = ({
  participants,
  minBudgetEur,
  onEditParticipant,
  onDeleteParticipant,
  onAddParticipant,
  onResetSample,
  onClearToBlank,
  onOpenInvite,
  isDrawFinalized
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSpouse, setNewSpouse] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Group participants into couples where possible
  const groupedCouples: { partnerA: Participant; partnerB?: Participant }[] = [];
  const processed = new Set<string>();

  participants.forEach(p => {
    if (processed.has(p.id)) return;
    processed.add(p.id);

    let partnerB: Participant | undefined;
    const spouseA = (p.spouseNickname || p.spouseName || '').trim().toLowerCase();
    if (spouseA) {
      partnerB = participants.find(other => 
        !processed.has(other.id) &&
        (other.name.trim().toLowerCase() === spouseA ||
         other.nickname.trim().toLowerCase() === spouseA ||
         (other.spouseNickname || other.spouseName || '').trim().toLowerCase() === p.nickname.trim().toLowerCase())
      );
      if (partnerB) processed.add(partnerB.id);
    }

    groupedCouples.push({ partnerA: p, partnerB });
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newNickname.trim()) return;

    await onAddParticipant({
      name: newName.trim(),
      nickname: newNickname.trim(),
      email: newEmail.trim(),
      spouseName: newSpouse.trim(),
      interests: ['Christmas cheer', 'Coffee', 'Holiday treats'],
      wishlist: []
    });

    setNewName('');
    setNewNickname('');
    setNewEmail('');
    setNewSpouse('');
    setShowAddForm(false);
  };

  const handleResetClick = async () => {
    if (confirm('Reset roster back to the pre-loaded 12 participants (6 married couples)? Any custom changes will be restored to defaults.')) {
      setIsResetting(true);
      await onResetSample();
      setIsResetting(false);
    }
  };

  const handleClearClick = async () => {
    if (confirm('Clear ALL participants to start with an EMPTY roster for your friends? You can restore the 12 sample participants at any time.')) {
      if (onClearToBlank) {
        setIsClearing(true);
        await onClearToBlank();
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
            Registered Couples & Participants ({participants.length})
          </h2>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-1">
            <span>{participants.length === 0 ? 'Empty roster ready for friends' : `${Math.floor(participants.length / 2)} Married Couples`}</span>
            <span aria-hidden="true">·</span>
            <span>Spouse exclusion active</span>
            <span aria-hidden="true">·</span>
            <span>Min €{minBudgetEur}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenInvite && (
            <button
              onClick={onOpenInvite}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-semibold text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Invite Friends Link</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={isDrawFinalized}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Register Person'}</span>
          </button>

          {participants.length > 0 && onClearToBlank && (
            <button
              onClick={handleClearClick}
              disabled={isClearing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 rounded-lg border border-red-200 dark:border-red-900 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Clearing...' : 'Clear to Blank (0)'}</span>
            </button>
          )}

          <button
            onClick={handleResetClick}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 bg-stone-100 dark:bg-stone-800 rounded-lg transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Restore 6 Couples</span>
          </button>
        </div>
      </div>

      {/* Optional Add Participant Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="p-5 bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200 dark:border-stone-700 rounded-2xl shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Register New Participant
            </h3>
            <span className="text-xs text-stone-500">Add to Dec 24, 2026 exchange</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
                Real Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Santos"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
                Manito / Manita Nickname *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bibingka Queen"
                value={newNickname}
                onChange={e => setNewNickname(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300 mb-1">
                Spouse Name (Exclusion)
              </label>
              <input
                type="text"
                placeholder="Partner / Spouse name"
                value={newSpouse}
                onChange={e => setNewSpouse(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 min-h-[44px] text-xs text-stone-600 dark:text-stone-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 min-h-[44px] text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
            >
              Save Registration
            </button>
          </div>
        </form>
      )}

      {/* Couples Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groupedCouples.map((pair, index) => (
          <div
            key={index}
            className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm hover:border-amber-300/80 transition-all"
          >
            {/* Couple Heading */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-600 fill-red-600/20" />
                <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  Couple #{index + 1}
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                Mutual Draw Blocked
              </span>
            </div>

            {/* Participants in this pair */}
            <div className="space-y-4">
              {[pair.partnerA, pair.partnerB].filter(Boolean).map(p => {
                if (!p) return null;
                const wishlistCount = p.wishlist?.length || 0;
                const hasValidWishes = p.wishlist?.some(w => w.priceEur >= minBudgetEur);

                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-stone-50/80 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                            {p.name}
                          </span>
                          <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                            &ldquo;{p.nickname}&rdquo;
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          <span>{p.email}</span>
                          {p.spouseName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Spouse: {p.spouseName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => onEditParticipant(p)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Interests Pill-Free Text */}
                    {p.interests && p.interests.length > 0 && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-1">
                        <span className="text-stone-400 font-medium">Interests: </span>
                        {p.interests.join(' · ')}
                      </p>
                    )}

                    {/* Wishlist Status & Quick Trigger */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                        <Gift className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>
                          {wishlistCount} {wishlistCount === 1 ? 'wish' : 'wishes'}
                        </span>
                        {hasValidWishes ? (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> (&ge; €{minBudgetEur})
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600">
                            (needs &ge; €{minBudgetEur} wish)
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onEditParticipant(p)}
                        className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Manage Wishlist
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
