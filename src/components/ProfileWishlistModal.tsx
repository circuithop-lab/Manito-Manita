import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Check, AlertCircle, ShoppingBag, Heart, ExternalLink, Link } from 'lucide-react';
import { Participant, WishlistItem, AiGiftSuggestion } from '../types/index.ts';

interface ProfileWishlistModalProps {
  participant: Participant | null;
  allParticipants: Participant[];
  minBudgetEur: number;
  onClose: () => void;
  onSave: (updated: Participant) => Promise<void>;
}

export const ProfileWishlistModal: React.FC<ProfileWishlistModalProps> = ({
  participant,
  allParticipants,
  minBudgetEur,
  onClose,
  onSave
}) => {
  if (!participant) return null;

  const [name, setName] = useState(participant.name);
  const [spouseName, setSpouseName] = useState(participant.spouseName || '');
  const [email, setEmail] = useState(participant.email);
  const [nickname, setNickname] = useState(participant.nickname);
  const [interests, setInterests] = useState<string[]>(participant.interests || []);
  const [interestInput, setInterestInput] = useState('');
  const [wishlist, setWishlist] = useState<WishlistItem[]>(participant.wishlist || []);

  // New Custom Wish inputs
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>(minBudgetEur);
  const [newCategory, setNewCategory] = useState('Gourmet Food & Coffee');
  const [newNotes, setNewNotes] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // AI Suggestions State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiGiftSuggestion[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Eligible spouses (other participants)
  const spouseOptions = allParticipants.filter(p => p.id !== participant.id);

  const handleAddInterest = () => {
    if (!interestInput.trim()) return;
    if (!interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
    }
    setInterestInput('');
  };

  const handleRemoveInterest = (idx: number) => {
    setInterests(interests.filter((_, i) => i !== idx));
  };

  const handleGenerateAiGifts = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai-gift-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests,
          participantName: name,
          participantNickname: nickname
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      } else {
        setAiError(data.error || 'Failed to generate suggestions. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Error fetching AI gifts:', err);
      setAiError('Could not reach gift advisor. Please check your connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiSuggestionToWishlist = (suggestion: AiGiftSuggestion) => {
    const newItem: WishlistItem = {
      id: 'ai_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      title: suggestion.title,
      priceEur: Math.max(minBudgetEur, suggestion.estimatedPriceEur),
      category: suggestion.category,
      notes: `${suggestion.reasoning}${suggestion.suggestedStores ? ` (Available: ${suggestion.suggestedStores})` : ''}`,
      isAiGenerated: true
    };
    setWishlist([...wishlist, newItem]);
  };

  const handleAddCustomWish = () => {
    if (!newTitle.trim()) return;
    const price = typeof newPrice === 'number' ? newPrice : minBudgetEur;

    const newItem: WishlistItem = {
      id: 'w_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      title: newTitle.trim(),
      priceEur: Math.max(minBudgetEur, price),
      category: newCategory,
      notes: newNotes.trim() || undefined,
      url: newUrl.trim() || undefined,
      isAiGenerated: false
    };

    setWishlist([...wishlist, newItem]);
    setNewTitle('');
    setNewPrice(minBudgetEur);
    setNewNotes('');
    setNewUrl('');
  };

  const handleRemoveWish = (id: string) => {
    setWishlist(wishlist.filter(w => w.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        ...participant,
        name: name.trim(),
        spouseName: spouseName.trim(),
        email: email.trim(),
        nickname: nickname.trim(),
        interests,
        wishlist
      });
      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-amber-300/40 dark:border-stone-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Profile & Wishlist Studio
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              <span>{name || 'Participant'}</span>
              <span aria-hidden="true">·</span>
              <span>Manito / Manita: &ldquo;{nickname || 'Pending'}&rdquo;</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Participant Identity & Spouse Pairing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-xs">
              01. Personal Info & Spouse Matching
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Real Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Secret Manito/Manita Nickname
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bibingka Queen, Kape King"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Email Address (for draw notification)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Spouse Name (Excluded from matching)
                </label>
                <select
                  value={spouseName}
                  onChange={e => setSpouseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="">-- No spouse / Single --</option>
                  {spouseOptions.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.nickname})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
                  Guarantees you will never be matched with your spouse.
                </span>
              </div>
            </div>
          </div>

          <hr className="border-stone-200 dark:border-stone-800" />

          {/* Section 2: Personal Interests & Hobbies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-xs">
                02. Hobbies & Personal Interests
              </h3>
              <span className="text-xs text-stone-500">Powers the AI Gift suggestions</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add hobby (e.g., Pour-over coffee, Board games, Taunus hiking)"
                value={interestInput}
                onChange={e => setInterestInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
                className="flex-1 px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 min-h-[44px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Add Interest
              </button>
            </div>

            {/* Interests List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {interests.length === 0 ? (
                <span className="text-xs text-stone-400 italic">No interests listed yet. Add some above!</span>
              ) : (
                interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-stone-800 text-amber-900 dark:text-amber-200 text-xs font-medium rounded-md border border-amber-200/70 dark:border-stone-700"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(idx)}
                      className="hover:text-red-700 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <hr className="border-stone-200 dark:border-stone-800" />

          {/* Section 3: AI Gift Suggestions (Gemini 3.8 Flash) */}
          <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <h3 className="font-semibold text-emerald-950 dark:text-emerald-200 text-sm">
                    AI Gift Suggestions (Budget: &ge; €{minBudgetEur})
                  </h3>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  Gemini analyzes your hobbies to recommend real products available in Europe meeting the minimum €{minBudgetEur} budget.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiGifts}
                disabled={aiLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all whitespace-nowrap"
              >
                {aiLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Interests...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Get AI Ideas</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Suggestions Grid */}
            {aiSuggestions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {aiSuggestions.map((sug, i) => {
                  const alreadyInWishlist = wishlist.some(w => w.title.toLowerCase() === sug.title.toLowerCase());
                  return (
                    <div
                      key={i}
                      className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-emerald-200 dark:border-stone-700 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-xs text-stone-900 dark:text-stone-100 leading-snug">
                            {sug.title}
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                            ~€{sug.estimatedPriceEur}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                          {sug.reasoning}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                        <span className="text-[10px] text-stone-400">{sug.category}</span>
                        {alreadyInWishlist ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <Check className="w-3.5 h-3.5" /> Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddAiSuggestionToWishlist(sug)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add to Wishlist
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-stone-200 dark:border-stone-800" />

          {/* Section 4: Current Wishlist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider text-xs">
                  03. Final Wishlist ({wishlist.length} Items)
                </h3>
                <span className="text-xs text-stone-500">
                  Minimum budget constraint: €{minBudgetEur} per gift
                </span>
              </div>
            </div>

            {/* List of items */}
            <div className="space-y-2">
              {wishlist.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500">
                  Your wishlist is empty. Add recommendations above or create custom items below!
                </div>
              ) : (
                wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                          €{item.priceEur}
                        </span>
                        {item.priceEur >= minBudgetEur ? (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            &ge; €{minBudgetEur} OK
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-600 font-semibold">
                            Below €{minBudgetEur} limit
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                          {item.notes}
                        </p>
                      )}
                      {item.url && (
                        <a
                          href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Item Link</span>
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWish(item.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-red-600 transition-colors"
                      aria-label="Remove wishlist item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Custom Wish Bar */}
            <div className="p-4 bg-amber-50/50 dark:bg-stone-800/40 rounded-xl border border-amber-200/60 dark:border-stone-700 space-y-3">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                + Add Custom Wish
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Gift Name (e.g. Dutch Oven, Wool Scarf)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-stone-500">€</span>
                  <input
                    type="number"
                    min={minBudgetEur}
                    placeholder={`Min ${minBudgetEur}`}
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Notes, preferred color, model, or size (optional)"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Link className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="url"
                      placeholder="Product URL / Link (e.g. amazon.de/...)"
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomWish}
                    disabled={!newTitle.trim()}
                    className="px-4 py-2 min-h-[44px] bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all"
            >
              {isSaving ? 'Saving...' : 'Save Profile & Wishlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
