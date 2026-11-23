import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Gift, Check, Plus, Trash2, Mail, User, Shield, Share2, AlertCircle, ArrowRight, ExternalLink, Link, LogOut, Lock, Eye, EyeOff, Save, PenLine, Sparkles } from 'lucide-react';
import { Participant, WishlistItem, EventConfig } from '../types/index.ts';
import { ParolStar } from './ParolStar.tsx';

interface ParticipantDashboardViewProps {
  currentParticipant: Participant;
  config: EventConfig;
  token?: string;
  totalRegistered: number;
  onSaveParticipant: (updated: Participant) => Promise<void>;
  onLogout: () => void;
}

export const ParticipantDashboardView: React.FC<ParticipantDashboardViewProps> = ({
  currentParticipant,
  config,
  token,
  totalRegistered,
  onSaveParticipant,
  onLogout
}) => {
  // Form states for the logged in participant
  const [name, setName] = useState(currentParticipant.name || '');
  const [nickname, setNickname] = useState(currentParticipant.nickname || '');
  const [email, setEmail] = useState(currentParticipant.email || '');
  const [spouseNickname, setSpouseNickname] = useState(currentParticipant.spouseNickname || currentParticipant.spouseName || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [interests, setInterests] = useState<string[]>(currentParticipant.interests || []);
  const [interestsInput, setInterestsInput] = useState<string>((currentParticipant.interests || []).join(', '));
  const [wishlist, setWishlist] = useState<WishlistItem[]>(currentParticipant.wishlist || []);

  // Sync state if currentParticipant prop updates from server
  useEffect(() => {
    setName(currentParticipant.name || '');
    setNickname(currentParticipant.nickname || '');
    setEmail(currentParticipant.email || '');
    setSpouseNickname(currentParticipant.spouseNickname || currentParticipant.spouseName || '');
    const currentInt = currentParticipant.interests || [];
    setInterests(currentInt);
    setInterestsInput(currentInt.join(', '));
    setWishlist(currentParticipant.wishlist || []);
  }, [currentParticipant]);

  // New Custom Wish inputs
  const [customTitle, setCustomTitle] = useState('');
  const [customPrice, setCustomPrice] = useState<number | ''>(config.minBudgetEur);
  const [customNotes, setCustomNotes] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Secret envelope state
  const [unsealedRecipient, setUnsealedRecipient] = useState<{
    id?: string;
    nickname: string;
    interests: string[];
    wishlist: WishlistItem[];
  } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Add custom wish
  const handleAddCustomWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newItem: WishlistItem = {
      id: 'w_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      title: customTitle.trim(),
      priceEur: typeof customPrice === 'number' ? customPrice : config.minBudgetEur,
      category: 'General',
      notes: customNotes.trim() || undefined,
      url: customUrl.trim() || undefined,
      isAiGenerated: false
    };

    const updated = [...wishlist, newItem];
    setWishlist(updated);
    setCustomTitle('');
    setCustomNotes('');
    setCustomUrl('');
    setCustomPrice(config.minBudgetEur);

    try {
      await onSaveParticipant({
        ...currentParticipant,
        name: name.trim() || currentParticipant.name,
        nickname: nickname.trim() || currentParticipant.nickname,
        spouseNickname: spouseNickname.trim(),
        spouseName: spouseNickname.trim(),
        interests,
        wishlist: updated
      });
    } catch {
      // Handled silently
    }
  };

  const handleRemoveWish = async (id: string) => {
    const updated = wishlist.filter(w => w.id !== id);
    setWishlist(updated);
    try {
      await onSaveParticipant({
        ...currentParticipant,
        name: name.trim() || currentParticipant.name,
        nickname: nickname.trim() || currentParticipant.nickname,
        spouseNickname: spouseNickname.trim(),
        spouseName: spouseNickname.trim(),
        interests,
        wishlist: updated
      });
    } catch {
      // Handled silently
    }
  };

  // Save changes to participant profile
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const parsedInterests = interestsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const updatedInterests = parsedInterests.length > 0 ? parsedInterests : interests;

      const updated: Participant = {
        ...currentParticipant,
        name: name.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        spouseNickname: spouseNickname.trim(),
        spouseName: spouseNickname.trim(),
        password: newPassword.trim() ? newPassword.trim() : undefined,
        interests: updatedInterests,
        wishlist
      };

      await onSaveParticipant(updated);
      setSaveSuccess(true);
      setNewPassword('');
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.85 }
        });
      } catch {
        // Confetti optional
      }
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Unseal Secret Envelope
  const handleQuickReveal = async () => {
    setIsRevealing(true);
    setRevealError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          participantId: currentParticipant.id,
          nicknameOrPin: currentParticipant.nickname
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRevealError(data.error || 'Could not unseal envelope.');
        return;
      }

      if (data.recipient) {
        setUnsealedRecipient(data.recipient);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#DC2626', '#15803D', '#F59E0B', '#FBBF24']
        });
      }
    } catch (err) {
      setRevealError('Network error unsealing your envelope.');
    } finally {
      setIsRevealing(false);
    }
  };

  const validWishCount = wishlist.filter(w => w.priceEur >= config.minBudgetEur).length;

  const hasUnsavedChanges =
    name.trim() !== (currentParticipant.name || '').trim() ||
    nickname.trim() !== (currentParticipant.nickname || '').trim() ||
    spouseNickname.trim() !== (currentParticipant.spouseNickname || currentParticipant.spouseName || '').trim() ||
    Boolean(newPassword.trim()) ||
    interestsInput.trim() !== (currentParticipant.interests || []).join(', ').trim() ||
    JSON.stringify(wishlist) !== JSON.stringify(currentParticipant.wishlist || []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner: Profile Identity & Account Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <h2 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
              My Personal Dashboard
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Lear Alumni Secret Santa · Manito-Manita in Germany 🇵🇭 🇩🇪 · Dec 24, 2026
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl border border-stone-200 dark:border-stone-700 transition-colors"
            title="Log out of this private dashboard"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-500" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white p-6 sm:p-7 shadow-lg border border-amber-400/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <ParolStar size={56} glow={true} />
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-300 font-medium tracking-wide">
                <span>🎄 Authenticated Dashboard</span>
                <span aria-hidden="true">·</span>
                <span>Lohra-Kirchvers 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight mt-0.5">
                {name || 'Participant'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300 mt-1">
                <span>Secret Manito/Manita: <strong className="text-amber-300 font-serif font-normal">&ldquo;{nickname}&rdquo;</strong></span>
                {spouseNickname && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-rose-300">
                      <Heart className="w-3 h-3 fill-rose-300/40 text-rose-300" />
                      <span>Spouse: {spouseNickname} (Exclusion Active)</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Wishlist Status */}
          <div className="bg-emerald-900/80 border border-amber-300/30 rounded-xl px-4 py-2.5 text-right w-full sm:w-auto">
            <span className="text-[11px] text-stone-300 block">Wishlist Readiness</span>
            <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
              {wishlist.length} {wishlist.length === 1 ? 'Wish' : 'Wishes'}
            </span>
            <span className="text-[10px] text-emerald-200 block">
              {validWishCount} meet minimum €{config.minBudgetEur}
            </span>
          </div>
        </div>
      </div>

      {(!nickname || nickname.startsWith('Participant #')) && (
        <div className="p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-2xl flex items-start gap-3 shadow-sm animate-fadeIn">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-black dark:text-amber-200">
              Welcome to Lear Alumni Secret Santa! Next Step: Set your Secret Nickname
            </h4>
            <p className="text-xs text-black dark:text-amber-300 leading-relaxed font-medium">
              In <strong>Section 01</strong> below, choose your personal holiday alias (e.g. <em>Bibingka Queen</em>, <em>kamote</em>, <em>Lechon Boss</em>) so your giver knows who you are. Then add your hobbies and Christmas wishlist!
            </p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-black dark:text-emerald-200 font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Your personal profile, spouse exclusion, and wishlist have been saved successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{saveError}</span>
        </div>
      )}

      {/* SECTION 01: Personal Profile & Spouse Privacy */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-stone-200">
              01 · My Personal Details & Security
            </h3>
          </div>
          <span className="text-xs text-black font-medium">Only you can edit this</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-black mb-1">
              Full Real Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              Secret Manito / Manita Nickname (Unique Alias)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-serif text-black font-semibold placeholder:text-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">
              Change Password <span className="text-stone-600 font-normal">(Leave blank to keep current)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (optional)"
                className="w-full pl-3.5 pr-10 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Spouse Nickname Entry */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <label className="block text-xs font-bold text-black mb-1">
            Spouse's Secret Nickname <span className="text-stone-600 font-normal">(Optional)</span>
          </label>
          <div className="relative max-w-md">
            <Heart className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={spouseNickname}
              onChange={e => setSpouseNickname(e.target.value)}
              placeholder="e.g. Bibingka Queen"
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
            />
          </div>
          <p className="text-[11px] text-stone-700 font-medium mt-1">
            You and your spouse will never be assigned to give gifts to each other.
          </p>
        </div>

        {/* Interests and Hobbies Entry */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <label className="block text-xs font-bold text-black mb-1">
            Your Interests or Hobbies <span className="text-stone-600 font-normal">(Help your Secret Santa choose the perfect gift)</span>
          </label>
          <input
            type="text"
            value={interestsInput}
            onChange={e => setInterestsInput(e.target.value)}
            placeholder="e.g. Specialty coffee, sourdough baking, tabletop board games, Taunus hiking, warm wool socks..."
            className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
          />
          <p className="text-[11px] text-stone-700 font-medium mt-1">
            Shared with your assigned Secret Santa when they open their secret envelope.
          </p>
        </div>
      </section>

      {/* SECTION 02: My Christmas Wishlist */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-red-700" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-black dark:text-stone-200">
              02 · My Christmas Wishlist
            </h3>
          </div>
          <span className="text-xs text-black font-mono font-semibold">Min. budget: €{config.minBudgetEur}</span>
        </div>

        {/* Existing Wishlist Items */}
        <div className="space-y-3">
          {wishlist.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-black text-xs space-y-1">
              <Gift className="w-8 h-8 mx-auto text-stone-500 stroke-1 mb-2" />
              <p className="font-bold text-black dark:text-stone-200">Your wishlist is currently empty</p>
              <p className="text-stone-700 font-medium">Use the form below to enter gifts you would love to receive.</p>
            </div>
          ) : (
            wishlist.map(item => (
              <div
                key={item.id}
                className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-300 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <span className="text-sm font-bold text-black dark:text-stone-100 block">
                    {item.title}
                  </span>
                  {item.notes && (
                    <p className="text-xs text-stone-800 font-medium dark:text-stone-300">
                      {item.notes}
                    </p>
                  )}
                  {item.url && (
                    <div className="pt-0.5">
                      <a
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Product Link ↗</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-emerald-800 dark:text-emerald-300 tabular-nums block">
                      ~€{item.priceEur}
                    </span>
                    {item.priceEur < config.minBudgetEur && (
                      <span className="text-[10px] text-amber-700 font-semibold">Below €{config.minBudgetEur}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveWish(item.id)}
                    className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Direct Wish Entry Form */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
          <form onSubmit={handleAddCustomWish} className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-stone-800/40 rounded-xl border border-emerald-200/60 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-black dark:text-stone-200 flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5 text-emerald-700" />
                <span>Add a Gift to Your Wishlist</span>
              </span>
              <span className="text-[11px] text-black font-semibold">Min. €{config.minBudgetEur}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-black mb-1">
                  Item Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="e.g. Hario V60 Ceramic Pour-Over Dripper"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Est. Price (€)
                </label>
                <input
                  type="number"
                  min={config.minBudgetEur}
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`€${config.minBudgetEur}`}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Product Link / URL <span className="text-stone-600 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Link className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="url"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    placeholder="https://amazon.de/dp/... or store URL"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black mb-1">
                  Color, Size, or Specific Preferences <span className="text-stone-600 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="e.g. Size M, olive green or white ceramic"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-black font-semibold placeholder:text-stone-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add to Wishlist</span>
              </button>
            </div>
          </form>
        </div>

        {/* Save Bar at the end of Wishlist */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {hasUnsavedChanges ? '● Unsaved edits in your alias, wishlist, or interests' : '✓ All wishlist items are up to date'}
          </span>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-amber-300 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-300" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* SECTION 03: The Secret Christmas Reveal Envelope */}
      <section className="rounded-2xl overflow-hidden shadow-lg border border-red-900/40 bg-gradient-to-br from-red-950 via-stone-950 to-emerald-950 text-white p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <ParolStar size={24} glow={false} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
              03 · Your Secret Christmas Envelope
            </h3>
          </div>
          <span className="text-xs text-stone-300 font-mono">
            {config.isDrawFinalized ? '✨ Sealed & Ready' : `Waiting for all 12 (${totalRegistered}/12)`}
          </span>
        </div>

        {!config.isDrawFinalized ? (
          <div className="p-6 text-center space-y-4 bg-black/20 rounded-xl border border-white/10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-3xl">
              ✉️
            </div>
            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-serif font-bold text-amber-200">
                Envelope Sealed With Christmas Gold
              </h4>
              <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto">
                Once all 12 participants have joined ({totalRegistered}/12 currently registered), the organizer will review and finalize the draw to unlock your envelope!
              </p>
            </div>
          </div>
        ) : !unsealedRecipient ? (
          <div className="p-6 text-center space-y-4 bg-white/5 rounded-xl border border-amber-400/30">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>All 12 participants registered · Draw finalized by organizer!</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-200 max-w-md mx-auto">
              Your assigned Manito/Manita has been secretly matched! Click the button below to break your golden seal and reveal their mystery alias and Christmas wishes.
            </p>

            {revealError && (
              <p className="text-xs text-red-400 bg-red-950/60 p-2 rounded-lg">{revealError}</p>
            )}

            <button
              type="button"
              onClick={handleQuickReveal}
              disabled={isRevealing}
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[46px] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-950/40 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isRevealing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Unsealing Envelope...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Unseal My Envelope & Reveal Recipient</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* UNSEALED RECIPIENT REVEAL */
          <div className="p-5 bg-white/10 backdrop-blur-md rounded-xl border border-amber-300/40 space-y-4 animate-fadeIn">
            <div className="text-center">
              <span className="text-xs text-amber-200 uppercase tracking-widest block mb-1 font-semibold">
                🎄 Your Assigned Secret Manito / Manita 🎁
              </span>
              <h4 className="text-2xl sm:text-3xl font-serif font-extrabold text-amber-300">
                &ldquo;{unsealedRecipient.nickname}&rdquo;
              </h4>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-200 text-[11px] rounded-full mt-2 border border-amber-400/30">
                <Shield className="w-3 h-3" />
                <span>Their real name remains an absolute Christmas mystery until Dec 24!</span>
              </div>
            </div>

            {unsealedRecipient.interests && unsealedRecipient.interests.length > 0 && (
              <div className="text-xs text-stone-200 pt-2 border-t border-white/10">
                <span className="font-semibold text-amber-200">Their Passions: </span>
                {unsealedRecipient.interests.join(' · ')}
              </div>
            )}

            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-xs font-semibold text-amber-200 block">
                Their Wishlist ({unsealedRecipient.wishlist.length} Items &ge; €{config.minBudgetEur}):
              </span>
              <div className="space-y-2">
                {unsealedRecipient.wishlist.length === 0 ? (
                  <p className="text-xs text-stone-300 italic">No specific wishlist items entered yet.</p>
                ) : (
                  unsealedRecipient.wishlist.map((w, idx) => (
                    <div key={idx} className="p-3 bg-black/40 rounded-xl flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-white block">{w.title}</span>
                        {w.notes && <p className="text-[11px] text-stone-300 mt-0.5">{w.notes}</p>}
                        {w.url && (
                          <a
                            href={w.url.startsWith('http') ? w.url : `https://${w.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 hover:underline mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open Item Link ↗</span>
                          </a>
                        )}
                      </div>
                      <span className="font-mono font-bold text-amber-300 shrink-0">~€{w.priceEur}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ADDITIONAL BIG "SAVE CHANGES" BUTTON AT THE BOTTOM */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-emerald-600 dark:border-emerald-500 p-6 sm:p-8 shadow-xl text-center space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`} />
              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                {hasUnsavedChanges ? 'Unsaved Dashboard Changes' : 'Dashboard Saved & Synchronized'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              {hasUnsavedChanges
                ? 'Your secret alias, spouse exclusion, wishlist, or interests have unsaved edits. Click the big button below to save!'
                : 'All your personal entries, secret alias, and wishlist items are safely recorded on the server.'}
            </p>
          </div>

          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Unsaved Edits</span>
            </span>
          )}
        </div>

        {saveError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 font-semibold flex items-center justify-center gap-2 animate-fadeIn">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
            <span>✓ All Changes Successfully Saved to Server!</span>
          </div>
        )}

        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`w-full sm:w-auto min-w-[280px] sm:min-w-[360px] inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-4 min-h-[58px] text-base sm:text-lg font-bold text-white rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-700 shadow-emerald-900/40 ring-4 ring-emerald-400/40'
                : 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 shadow-emerald-950/40 ring-4 ring-emerald-500/20 hover:ring-amber-400/40'
            }`}
            title="Save all changes to your personal dashboard"
          >
            {isSaving ? (
              <>
                <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving All Changes...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-6 h-6 text-amber-300 stroke-[3]" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-6 h-6 text-amber-300" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-stone-400 dark:text-stone-500">
          Saves your secret alias, spouse nickname exclusion, wishlist items, and interest tags.
        </p>
      </section>

      {/* FLOATING QUICK SAVE PILL WHEN UNSAVED CHANGES EXIST */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-8 z-40 animate-bounce">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-900 text-white font-bold text-sm shadow-2xl shadow-emerald-950/60 ring-2 ring-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Quick Save Unsaved Changes"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-amber-300" />
            )}
            <span>Save Changes</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </button>
        </div>
      )}
    </div>
  );
};
