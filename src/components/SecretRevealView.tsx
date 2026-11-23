import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Lock, Unlock, Sparkles, Copy, Check, Share2, Heart, ArrowLeft, ExternalLink } from 'lucide-react';
import { Participant, WishlistItem } from '../types/index.ts';
import { ParolStar } from './ParolStar.tsx';

interface SecretRevealViewProps {
  participants: Participant[];
  isDrawFinalized: boolean;
  minBudgetEur: number;
}

interface RevealData {
  yourName: string;
  yourNickname: string;
  recipient: {
    id: string;
    name?: string;
    nickname: string;
    interests: string[];
    wishlist: WishlistItem[];
  };
  eventDetails: {
    name: string;
    date: string;
    location: string;
    minBudgetEur: number;
  };
}

export const SecretRevealView: React.FC<SecretRevealViewProps> = ({
  participants,
  isDrawFinalized,
  minBudgetEur
}) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(participants[0]?.id || '');
  const [verificationInput, setVerificationInput] = useState('');
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#15803D', '#F59E0B', '#FBBF24', '#FFFFFF']
    });
  };

  const handleOpenEnvelope = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: selectedParticipantId,
          nicknameOrPin: verificationInput.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setRevealData(data);
        setIsEnvelopeOpen(true);
        triggerConfetti();
      } else {
        setError(data.error || 'Failed to reveal assignment.');
      }
    } catch (err) {
      console.error('Error revealing:', err);
      setError('Could not connect to the draw server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecretLink = () => {
    const currentUrl = window.location.origin + window.location.pathname;
    const selectedP = participants.find(p => p.id === selectedParticipantId);
    const link = `${currentUrl}?participant=${selectedParticipantId}`;
    const textToCopy = `Maligayang Pasko! 🎄 Open your Manito Manita Secret Envelope for Lohra-Kirchvers: ${link}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  if (!isDrawFinalized) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
          The Draw Has Not Been Finalized Yet
        </h2>
        <p className="text-sm text-stone-500 leading-relaxed mb-6">
          The secret envelopes will be sealed and ready for viewing once the organizer runs and locks the official matching draw.
        </p>
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
          Tip: Switch to the &ldquo;The Draw (Admin)&rdquo; tab to execute matching!
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* If envelope is NOT opened yet */}
      {!isEnvelopeOpen ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <ParolStar size={72} glow={true} className="mx-auto mb-3" />
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Open Your Secret Manito Manita Envelope
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
              Select your name to unseal your festive Christmas envelope and discover who you will be gifting on Christmas Eve in Lohra-Kirchvers!
            </p>
          </div>

          <form onSubmit={handleOpenEnvelope} className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Select Your Name
              </label>
              <select
                value={selectedParticipantId}
                onChange={e => setSelectedParticipantId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Manito/Manita: &ldquo;{p.nickname}&rdquo;)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Verification (Optional)
                </label>
                <span className="text-[11px] text-stone-400">Your nickname or PIN</span>
              </div>
              <input
                type="text"
                placeholder="Enter your Manito/Manita nickname (e.g. Bibingka Queen)"
                value={verificationInput}
                onChange={e => setVerificationInput(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Leave blank or enter your nickname to unseal. Master code: &ldquo;admin&rdquo;.
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3 px-6 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-semibold text-sm rounded-xl shadow-md shadow-red-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Unsealing Envelope...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Break Golden Seal & Open Envelope</span>
                </>
              )}
            </button>
          </form>

          {/* Shareable Link generator */}
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 text-center">
            <button
              onClick={handleCopySecretLink}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 bg-stone-100 dark:bg-stone-800 rounded-lg transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Copied! Send via WhatsApp / SMS</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Private Share Link for Selected Person</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Unsealed Secret Envelope Presentation */
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-stone-50 via-white to-amber-50/40 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 p-6 sm:p-8 border-2 border-amber-400/80 shadow-2xl">
            {/* Ribbon Accent */}
            <div className="flex items-center justify-between pb-4 border-b border-amber-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ParolStar size={28} glow={false} />
                <span className="text-xs font-semibold tracking-wider uppercase text-amber-800 dark:text-amber-400">
                  Secret Christmas Mission Revealed
                </span>
              </div>

              <button
                onClick={() => {
                  setIsEnvelopeOpen(false);
                  setRevealData(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Reseal Envelope
              </button>
            </div>

            {/* Recipient Announcement Card */}
            <div className="text-center py-6">
              <span className="text-xs text-stone-500 uppercase tracking-widest block mb-2">
                Dear {revealData?.yourName}, your assigned Manito / Manita is:
              </span>

              <h1 className="text-3xl sm:text-4xl font-serif font-black text-amber-500 dark:text-amber-400 tracking-tight mb-2">
                &ldquo;{revealData?.recipient.nickname}&rdquo;
              </h1>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300 font-medium text-xs rounded-full border border-amber-300 dark:border-stone-700">
                <span>🎁 Mystery Manito/Manita (Real name remains secret until Dec 24 party)</span>
              </div>

              {/* Event Reminder */}
              <p className="text-xs text-stone-500 mt-3">
                Christmas Eve · Dec 24, 2026 · Lohra-Kirchvers · Budget: Minimum €{minBudgetEur}
              </p>
            </div>

            {/* Recipient Interests */}
            {revealData?.recipient.interests && revealData.recipient.interests.length > 0 && (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 mb-6">
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider block mb-1.5">
                  Their Passions & Interests:
                </span>
                <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed">
                  {revealData.recipient.interests.join(' · ')}
                </p>
              </div>
            )}

            {/* Recipient's Complete Wishlist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  &ldquo;{revealData?.recipient.nickname}&rdquo;&rsquo;s Wishlist ({revealData?.recipient.wishlist.length || 0} Items)
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Min €{minBudgetEur} each
                </span>
              </div>

              <div className="space-y-2.5">
                {revealData?.recipient.wishlist.length === 0 ? (
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
                    No specific wishlist items registered yet. Use their interests above to pick a thoughtful gift of at least €{minBudgetEur}!
                  </div>
                ) : (
                  revealData?.recipient.wishlist.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 bg-stone-50 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-stone-400">({item.category})</span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                              {item.notes}
                            </p>
                          )}
                          {item.url && (
                            <a
                              href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors mt-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Item Store Link ↗</span>
                            </a>
                          )}
                        </div>

                        <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                          ~€{item.priceEur}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Christmas Blessing Footer */}
            <div className="mt-8 pt-4 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500">
              <p>Keep your Manito / Manita a secret until the unwrapping on Christmas Eve!</p>
              <p className="text-[11px] text-stone-400 mt-0.5 font-serif italic">
                Maligayang Pasko at Manigong Bagong Taon!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
