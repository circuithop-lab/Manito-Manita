import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ParolStar } from './ParolStar.tsx';
import { Sparkles, Heart, Gift, Check, Plus, Trash2, Link, ExternalLink, ArrowRight, Copy, Share2 } from 'lucide-react';
import { Participant, WishlistItem, AiGiftSuggestion, EventConfig } from '../types/index.ts';

interface FriendRegisterViewProps {
  config: EventConfig;
  allParticipants: Participant[];
  onRegister: (newParticipant: Partial<Participant>) => Promise<Participant | void>;
  onDone: (newParticipantId: string) => void;
}

export const FriendRegisterView: React.FC<FriendRegisterViewProps> = ({
  config,
  allParticipants,
  onRegister,
  onDone
}) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Wish input fields
  const [wishTitle, setWishTitle] = useState('');
  const [wishPrice, setWishPrice] = useState<number | ''>(config.minBudgetEur);
  const [wishUrl, setWishUrl] = useState('');
  const [wishNotes, setWishNotes] = useState('');

  // AI suggestions
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiGiftSuggestion[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredParticipant, setRegisteredParticipant] = useState<Participant | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishTitle.trim()) return;

    const price = typeof wishPrice === 'number' ? wishPrice : config.minBudgetEur;
    const newItem: WishlistItem = {
      id: 'w_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      title: wishTitle.trim(),
      priceEur: Math.max(config.minBudgetEur, price),
      category: 'Holiday Wish',
      notes: wishNotes.trim() || undefined,
      url: wishUrl.trim() || undefined,
      isAiGenerated: false
    };

    setWishlist([...wishlist, newItem]);
    setWishTitle('');
    setWishPrice(config.minBudgetEur);
    setWishUrl('');
    setWishNotes('');
  };

  const handleRemoveWish = (id: string) => {
    setWishlist(wishlist.filter(w => w.id !== id));
  };

  const handleGenerateAiGifts = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-gift-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: interests.length > 0 ? interests : ['Christmas gifts', 'Coffee', 'Warm comfort'],
          participantName: name || 'Friend',
          participantNickname: nickname || 'Guest'
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Error with AI gifts:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiSuggestion = (sug: AiGiftSuggestion) => {
    const newItem: WishlistItem = {
      id: 'ai_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      title: sug.title,
      priceEur: Math.max(config.minBudgetEur, sug.estimatedPriceEur),
      category: sug.category,
      notes: `${sug.reasoning}${sug.suggestedStores ? ` (Available: ${sug.suggestedStores})` : ''}`,
      isAiGenerated: true
    };
    setWishlist([...wishlist, newItem]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nickname.trim() || !email.trim()) {
      alert('Please enter your Name, Nickname, and Email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onRegister({
        name: name.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        spouseName: spouseName.trim(),
        interests,
        wishlist
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DC2626', '#15803D', '#F59E0B', '#FBBF24', '#FFFFFF']
      });

      if (created) {
        setRegisteredParticipant(created);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPersonalLink = () => {
    if (!registeredParticipant) return;
    const url = `${window.location.origin}?participant=${registeredParticipant.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // If already successfully registered
  if (registeredParticipant) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xl text-center space-y-6">
        <ParolStar size={84} glow={true} className="mx-auto" />

        <div>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block mb-1">
            Registration Confirmed!
          </span>
          <h2 className="text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
            Maligayang Pasko, {registeredParticipant.name}!
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-md mx-auto">
            You are now registered for our Christmas Manito Manita gathering in Lohra-Kirchvers on December 24, 2026.
          </p>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-stone-800 rounded-xl border border-amber-200 dark:border-stone-700 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-stone-500">Your Manito/Manita Nickname:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">&ldquo;{registeredParticipant.nickname}&rdquo;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Registered Email:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{registeredParticipant.email}</span>
          </div>
          {registeredParticipant.spouseName && (
            <div className="flex justify-between">
              <span className="text-stone-500">Spouse Protection:</span>
              <span className="font-semibold text-rose-600">{registeredParticipant.spouseName} (Blocked)</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone-500">Wishlist Items Added:</span>
            <span className="font-semibold text-emerald-700">{registeredParticipant.wishlist.length} wishes</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleCopyPersonalLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-xl transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy My Personal Link'}</span>
          </button>

          <button
            onClick={() => onDone(registeredParticipant.id)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            <span>Open My Personal Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Invitation Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-amber-400/30 text-center sm:text-left relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-medium text-amber-300 mb-2">
              <span>Christmas Invitation</span>
              <span aria-hidden="true">·</span>
              <span>Dec 24, 2026</span>
              <span aria-hidden="true">·</span>
              <span>Lohra-Kirchvers</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white mb-2">
              Join Our Manito Manita Exchange
            </h1>

            <p className="text-xs sm:text-sm text-stone-200 max-w-lg leading-relaxed">
              Welcome! Fill in your details, interests, and gift wishlist below. The minimum gift budget is <strong className="text-amber-300">€{config.minBudgetEur}</strong>. Spouses are guaranteed never to draw each other.
            </p>
          </div>

          <div className="shrink-0">
            <ParolStar size={72} glow={true} />
          </div>
        </div>
      </div>

      {/* Blank Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Step 1: Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-400">01</span>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-xs">
              Your Details & Secret Manito/Manita Alias
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Your Real Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Santos"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Mystery Nickname (Manito/Manita) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bibingka Queen, Kape King"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                This is your fun alias used on the secret draw list!
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Your Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Your assigned recipient will be delivered to this email.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Spouse's Secret Nickname (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kape King or Bibingka Queen"
                value={spouseName}
                onChange={e => setSpouseName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Enter your spouse&rsquo;s secret nickname so the algorithm strictly prevents you two from drawing each other.
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Interests */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-400">02</span>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-xs">
              Your Hobbies, Passions & Interests
            </h2>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Pour-over coffee, Sourdough baking, Hiking, Board games"
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterest();
                }
              }}
              className="flex-1 px-3.5 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <button
              type="button"
              onClick={handleAddInterest}
              className="px-4 py-2 min-h-[44px] bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              Add Interest
            </button>
          </div>

          {/* Interests List */}
          <div className="flex flex-wrap gap-2 pt-1">
            {interests.map((int, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-stone-800 text-amber-950 dark:text-amber-200 text-xs font-medium rounded-lg border border-amber-200 dark:border-stone-700"
              >
                <span>{int}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(i)}
                  className="hover:text-red-700 ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* AI Helper Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerateAiGifts}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiLoading ? 'Asking Gemini for ideas...' : 'Curate gift ideas with Gemini AI (≥ €30)'}</span>
            </button>
          </div>

          {/* AI Recommendations */}
          {aiSuggestions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {aiSuggestions.map((sug, i) => (
                <div key={i} className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">{sug.title}</span>
                      <span className="font-mono text-xs font-bold text-emerald-700">~€{sug.estimatedPriceEur}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">{sug.reasoning}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddAiSuggestion(sug)}
                    className="mt-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add to My Wishlist
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Wishlist with Links */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-400">03</span>
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-xs">
                Your Gift Wishlist ({wishlist.length} Items)
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              Min. €{config.minBudgetEur} each
            </span>
          </div>

          {/* Wishlist Items List */}
          <div className="space-y-2">
            {wishlist.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500">
                No wishes added yet. Add at least 1 gift idea below so your Secret Santa knows what you want!
              </div>
            ) : (
              wishlist.map(item => (
                <div key={item.id} className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{item.title}</span>
                      <span className="font-mono font-bold text-amber-700">€{item.priceEur}</span>
                    </div>
                    {item.notes && <p className="text-stone-500 text-[11px] mt-0.5">{item.notes}</p>}
                    {item.url && (
                      <a
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" /> View Item Link
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWish(item.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Inline Add Wish Form with Item Link input */}
          <div className="p-4 bg-amber-50/50 dark:bg-stone-800/40 rounded-xl border border-amber-200/60 dark:border-stone-700 space-y-3">
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
              + Add Item to Your Wishlist
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Gift Name (e.g. Pour-over dripper, Scented candle)"
                value={wishTitle}
                onChange={e => setWishTitle(e.target.value)}
                className="sm:col-span-2 px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-stone-500">€</span>
                <input
                  type="number"
                  min={config.minBudgetEur}
                  placeholder={`Min ${config.minBudgetEur}`}
                  value={wishPrice}
                  onChange={e => setWishPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Notes or preferred color / size (optional)"
                value={wishNotes}
                onChange={e => setWishNotes(e.target.value)}
                className="px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Link className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="url"
                    placeholder="Product URL / Store Link (optional)"
                    value={wishUrl}
                    onChange={e => setWishUrl(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddWish}
                  disabled={!wishTitle.trim()}
                  className="px-4 py-2 min-h-[44px] bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                >
                  Add Wish
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 min-h-[48px] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-950/20 active:scale-[0.98] transition-all"
          >
            {isSubmitting ? 'Registering...' : 'Complete Registration & Join Event'}
          </button>
        </div>
      </form>
    </div>
  );
};
