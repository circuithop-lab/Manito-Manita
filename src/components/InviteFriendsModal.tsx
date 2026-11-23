import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Trash2, RotateCcw, Share2, Sparkles, UserPlus } from 'lucide-react';
import { ParolStar } from './ParolStar.tsx';

interface InviteFriendsModalProps {
  onClose: () => void;
  onClearToBlank: () => Promise<void>;
  onRestoreSample: () => Promise<void>;
  currentParticipantCount: number;
  onOpenRegisterForm: () => void;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  onClose,
  onClearToBlank,
  onRestoreSample,
  currentParticipantCount,
  onOpenRegisterForm
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Preferred public shared URL from environment metadata
  const baseUrl = 'https://ais-pre-bp4ywoqvee62kxu7xebj3i-372651666197.europe-west1.run.app';
  const joinUrl = `${baseUrl}?join=true`;

  const inviteMessage = `🎄 Maligayang Pasko & Frohe Weihnachten! 🇵🇭 🇩🇪
You're invited to our "Lear Alumni Secret Santa: Manito-Manita in Germany" on Dec 24, 2026, in Lohra-Kirchvers!

🎁 Minimum gift budget is €30.
Please click this link to create your profile, set your password, hobbies, and wishlist:
${joinUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(inviteMessage).then(() => {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    });
  };

  const handleClear = async () => {
    if (confirm('Clear all sample participants to start with an EMPTY roster for your friends? You can restore the 12 sample participants at any time.')) {
      setIsClearing(true);
      await onClearToBlank();
      setIsClearing(false);
    }
  };

  const handleRestore = async () => {
    if (confirm('Restore the pre-loaded 12 participants (6 married couples)?')) {
      setIsRestoring(true);
      await onRestoreSample();
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-amber-300/40 dark:border-stone-800 p-6 sm:p-7 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ParolStar size={44} glow={false} />
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                Invite Friends & Test Blank Page
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Send a clean invitation link so friends can enter their details and wishlists.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Blank vs Sample Roster Toggle */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              Roster Status: {currentParticipantCount} {currentParticipantCount === 1 ? 'Person' : 'Participants'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleClear}
              disabled={isClearing || currentParticipantCount === 0}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 rounded-lg border border-red-200 dark:border-red-900 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? 'Clearing...' : 'Clear Roster to Blank (0)'}</span>
            </button>

            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-900 transition-colors disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRestoring ? 'Restoring...' : 'Restore 12 Sample Couples'}</span>
            </button>
          </div>
          <p className="text-[11px] text-stone-500">
            Tip: Click &ldquo;Clear Roster to Blank&rdquo; if you want only your friends&rsquo; real registrations to appear!
          </p>
        </div>

        {/* Step 2: Shareable Friend Link */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
            Friend Invitation Link (Opens Blank Registration Form)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="flex-1 px-3 py-2.5 text-xs font-mono bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 min-h-[44px] bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Step 3: Ready-to-Send WhatsApp / SMS message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pre-composed WhatsApp / SMS Invitation</span>
            </label>
            <button
              onClick={handleCopyMessage}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMessage ? 'Message Copied!' : 'Copy Message'}</span>
            </button>
          </div>

          <pre className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] font-sans text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed select-all">
            {inviteMessage}
          </pre>
        </div>

        {/* Action Button: Test form yourself right now */}
        <div className="pt-2 flex justify-between items-center border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => {
              onClose();
              onOpenRegisterForm();
            }}
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Test the Blank Registration Page yourself now</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 min-h-[44px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
