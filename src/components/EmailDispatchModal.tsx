import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Send, CheckCircle2, AlertCircle, Eye, Settings, FileText, Sparkles } from 'lucide-react';
import { EventConfig, Participant, WishlistItem } from '../types/index.ts';

interface EmailDispatchModalProps {
  config: EventConfig;
  participants: Participant[];
  isDrawFinalized: boolean;
  onUpdateConfig: (newConfig: Partial<EventConfig>) => Promise<void>;
  onNavigateToDraw: () => void;
}

interface EmailLog {
  id: string;
  toName: string;
  toEmail: string;
  recipientName: string;
  recipientNickname: string;
  wishlistCount: number;
  status: 'sent' | 'simulated' | 'failed';
  timestamp: string;
  bodyPreview: string;
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  config,
  participants,
  isDrawFinalized,
  onUpdateConfig,
  onNavigateToDraw
}) => {
  const [serviceId, setServiceId] = useState(config.emailConfig?.serviceId || '');
  const [templateId, setTemplateId] = useState(config.emailConfig?.templateId || '');
  const [publicKey, setPublicKey] = useState(config.emailConfig?.publicKey || '');
  const [testEmail, setTestEmail] = useState('fgainsanjr@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewParticipant, setPreviewParticipant] = useState<Participant | null>(participants[0] || null);

  // Format wishlist into readable text
  const formatWishlistText = (wishlist: WishlistItem[]): string => {
    if (!wishlist || wishlist.length === 0) {
      return '• Surprise gift based on their interests (Minimum budget: €30)';
    }
    return wishlist
      .map((w, idx) => `${idx + 1}. ${w.title} (~€${w.priceEur})${w.notes ? ` - Note: ${w.notes}` : ''}${w.url ? ` - Link: ${w.url}` : ''}`)
      .join('\n');
  };

  const handleSaveConfig = async () => {
    try {
      await onUpdateConfig({
        emailConfig: {
          serviceId: serviceId.trim(),
          templateId: templateId.trim(),
          publicKey: publicKey.trim(),
          autoSendOnDraw: false
        }
      });
      setStatusMessage('EmailJS configuration saved successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Error saving email config:', err);
      setErrorMessage('Could not save configuration.');
    }
  };

  // Build the email parameters payload for a specific giver
  const buildEmailParams = (giver: Participant) => {
    const recipient = participants.find(p => p.id === giver.assignedToId);
    const wishlistText = formatWishlistText(recipient?.wishlist || []);

    return {
      to_name: giver.name,
      to_email: giver.email,
      giver_nickname: giver.nickname,
      assigned_name: recipient?.name || 'Your Manito/Manita',
      assigned_nickname: recipient?.nickname || 'Secret Partner',
      recipient_interests: (recipient?.interests || []).join(', '),
      wishlist_details: wishlistText,
      event_date: 'December 24, 2026',
      event_location: 'Lohra-Kirchvers, Hessen',
      min_budget: `€${config.minBudgetEur}`,
      reveal_link: `${window.location.origin}?participant=${giver.id}`
    };
  };

  // Send a test email for one participant
  const handleSendTestEmail = async () => {
    if (!isDrawFinalized) {
      setErrorMessage('Please finalize the draw first in "The Draw (Admin)" before sending emails.');
      return;
    }

    const giver = previewParticipant || participants[0];
    if (!giver) return;

    setIsSending(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const params = buildEmailParams(giver);
    // Overwrite recipient with test email if entered
    if (testEmail.trim()) {
      params.to_email = testEmail.trim();
    }

    // Check if real keys are provided
    const hasRealKeys = serviceId.trim() && templateId.trim() && publicKey.trim();

    if (hasRealKeys) {
      try {
        await emailjs.send(serviceId.trim(), templateId.trim(), params, publicKey.trim());
        const log: EmailLog = {
          id: 'log_' + Date.now(),
          toName: giver.name,
          toEmail: params.to_email,
          recipientName: params.assigned_name,
          recipientNickname: params.assigned_nickname,
          wishlistCount: (participants.find(p => p.id === giver.assignedToId)?.wishlist || []).length,
          status: 'sent',
          timestamp: new Date().toLocaleTimeString(),
          bodyPreview: `To: ${params.to_email}\nAssigned: ${params.assigned_name} ("${params.assigned_nickname}")\nWishlist:\n${params.wishlist_details}`
        };
        setEmailLogs(prev => [log, ...prev]);
        setStatusMessage(`Test email successfully sent to ${params.to_email} via EmailJS!`);
      } catch (err: unknown) {
        console.error('EmailJS error:', err);
        setErrorMessage(`EmailJS returned: ${err instanceof Error ? err.message : String(err)}. Check your Service ID, Template ID, and Public Key.`);
      } finally {
        setIsSending(false);
      }
    } else {
      // Demo / simulated mode with real preview
      setTimeout(() => {
        const log: EmailLog = {
          id: 'log_' + Date.now(),
          toName: giver.name,
          toEmail: params.to_email,
          recipientName: params.assigned_name,
          recipientNickname: params.assigned_nickname,
          wishlistCount: (participants.find(p => p.id === giver.assignedToId)?.wishlist || []).length,
          status: 'simulated',
          timestamp: new Date().toLocaleTimeString(),
          bodyPreview: `[Simulated Preview] To: ${params.to_email}\nSubject: 🎄 Your Manito Manita Secret Draw - Lohra-Kirchvers 2026\n\nDear ${params.to_name} (Manito/Manita: "${params.giver_nickname}"),\nYour assigned recipient is: ${params.assigned_name} ("${params.assigned_nickname}").\n\nTheir Wishlist (Min. Budget: €${config.minBudgetEur}):\n${params.wishlist_details}\n\nEvent: December 24, 2026 in Lohra-Kirchvers.`
        };
        setEmailLogs(prev => [log, ...prev]);
        setStatusMessage(`Simulated email generated for ${params.to_email}. You can configure live EmailJS keys anytime below.`);
        setIsSending(false);
      }, 700);
    }
  };

  // Dispatch to all 12 participants
  const handleDispatchAll = async (simulate = false) => {
    if (!isDrawFinalized) {
      setErrorMessage('Please finalize the draw first in "The Draw (Admin)" before dispatching.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setDispatchProgress({ current: 0, total: participants.length });

    const hasRealKeys = !simulate && serviceId.trim() && templateId.trim() && publicKey.trim();
    const newLogs: EmailLog[] = [];

    for (let i = 0; i < participants.length; i++) {
      const giver = participants[i];
      const params = buildEmailParams(giver);
      setDispatchProgress({ current: i + 1, total: participants.length });

      if (hasRealKeys) {
        try {
          await emailjs.send(serviceId.trim(), templateId.trim(), params, publicKey.trim());
          newLogs.push({
            id: 'log_' + Date.now() + '_' + i,
            toName: giver.name,
            toEmail: giver.email,
            recipientName: params.assigned_name,
            recipientNickname: params.assigned_nickname,
            wishlistCount: (participants.find(p => p.id === giver.assignedToId)?.wishlist || []).length,
            status: 'sent',
            timestamp: new Date().toLocaleTimeString(),
            bodyPreview: `Sent live via EmailJS to ${giver.email}. Assigned: ${params.assigned_name}`
          });
        } catch (err) {
          console.error(`Failed to send to ${giver.email}:`, err);
          newLogs.push({
            id: 'log_' + Date.now() + '_' + i,
            toName: giver.name,
            toEmail: giver.email,
            recipientName: params.assigned_name,
            recipientNickname: params.assigned_nickname,
            wishlistCount: 0,
            status: 'failed',
            timestamp: new Date().toLocaleTimeString(),
            bodyPreview: `Failed: ${err instanceof Error ? err.message : String(err)}`
          });
        }
      } else {
        // Simulated delivery with real formatted text
        newLogs.push({
          id: 'log_' + Date.now() + '_' + i,
          toName: giver.name,
          toEmail: giver.email,
          recipientName: params.assigned_name,
          recipientNickname: params.assigned_nickname,
          wishlistCount: (participants.find(p => p.id === giver.assignedToId)?.wishlist || []).length,
          status: 'simulated',
          timestamp: new Date().toLocaleTimeString(),
          bodyPreview: `To: ${giver.email}\nRecipient: ${params.assigned_name} ("${params.assigned_nickname}")\nWishlist Items:\n${params.wishlist_details}`
        });
      }

      // Small throttle between dispatches
      await new Promise(r => setTimeout(r, hasRealKeys ? 400 : 80));
    }

    setEmailLogs(prev => [...newLogs, ...prev]);
    setIsSending(false);
    setDispatchProgress(null);
    setStatusMessage(
      hasRealKeys
        ? `Successfully sent ${newLogs.filter(l => l.status === 'sent').length}/${participants.length} emails through EmailJS!`
        : `Successfully simulated dispatch of all ${participants.length} personalized emails! Check logs below.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-700 dark:text-red-400" />
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                Automated Email Dispatcher
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-1">
              <span>EmailJS Integration</span>
              <span aria-hidden="true">·</span>
              <span>Personalized Recipient & Wishlist</span>
              <span aria-hidden="true">·</span>
              <span>Dec 24, 2026 Lohra-Kirchvers</span>
            </div>
          </div>

          {!isDrawFinalized && (
            <button
              onClick={onNavigateToDraw}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-800"
            >
              Draw Pending: Go to The Draw
            </button>
          )}
        </div>

        {/* Dispatch Controls */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-600 dark:text-stone-300">
            Send each of the {participants.length} family members an email containing their assigned Manito/Manita and their complete wishlist.
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={handleSendTestEmail}
              disabled={isSending || !isDrawFinalized}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Single Test</span>
            </button>

            <button
              onClick={() => handleDispatchAll(false)}
              disabled={isSending || !isDrawFinalized}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 min-h-[44px] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-semibold rounded-lg shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSending && dispatchProgress ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching {dispatchProgress.current}/{dispatchProgress.total}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dispatch to All 12</span>
                </>
              )}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* EmailJS Credentials & Template Variables Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: EmailJS Service Keys */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <Settings className="w-4 h-4 text-stone-500" />
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
              EmailJS Service Settings
            </h3>
          </div>

          <p className="text-xs text-stone-500">
            Enter your EmailJS keys from your dashboard at <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-red-700 underline">emailjs.com</a>. If left blank, the app runs in live preview simulation mode.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                EmailJS Service ID
              </label>
              <input
                type="text"
                placeholder="e.g. service_xxxxxxx"
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                EmailJS Template ID
              </label>
              <input
                type="text"
                placeholder="e.g. template_xxxxxxx"
                value={templateId}
                onChange={e => setTemplateId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                EmailJS Public Key
              </label>
              <input
                type="text"
                placeholder="e.g. user_xxxxxxx or public key"
                value={publicKey}
                onChange={e => setPublicKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                Test Recipient Email
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full py-2 min-h-[44px] bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Save EmailJS Keys
            </button>
          </div>
        </div>

        {/* Right: Template Variables & Preview */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-500" />
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                Email Template Preview
              </h3>
            </div>

            <select
              value={previewParticipant?.id || ''}
              onChange={e => setPreviewParticipant(participants.find(p => p.id === e.target.value) || null)}
              className="text-[11px] px-2 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md"
            >
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  Preview for {p.name}
                </option>
              ))}
            </select>
          </div>

          {previewParticipant ? (
            <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-mono text-stone-700 dark:text-stone-300 space-y-2 overflow-y-auto max-h-72">
              <div className="pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-500">
                <div>To: {previewParticipant.email}</div>
                <div>Subject: 🎄 Your Manito Manita Secret Draw - Lohra-Kirchvers 2026</div>
              </div>
              <p>Dear {previewParticipant.name} (Manito/Manita: &ldquo;{previewParticipant.nickname}&rdquo;),</p>
              <p>
                Maligayang Pasko! The secret draw for our Christmas gathering on Dec 24, 2026 in Lohra-Kirchvers is ready.
              </p>
              <div className="p-2 bg-amber-50 dark:bg-stone-900/60 rounded border border-amber-200 dark:border-stone-700">
                <span className="font-bold text-red-700 dark:text-red-400 block">
                  Your Assigned Recipient: {isDrawFinalized ? (participants.find(p => p.id === previewParticipant.assignedToId)?.name || 'Pending') : '[Draw Pending]'}
                </span>
                <span className="text-stone-600 dark:text-stone-400 text-[11px]">
                  Mystery Nickname: &ldquo;{isDrawFinalized ? (participants.find(p => p.id === previewParticipant.assignedToId)?.nickname || 'Pending') : '•••'}&rdquo;
                </span>
              </div>
              <div>
                <span className="font-semibold block mb-1">Their Wishlist (Min. €{config.minBudgetEur}):</span>
                <pre className="text-[11px] whitespace-pre-wrap font-sans bg-white dark:bg-stone-900 p-2 rounded border border-stone-200 dark:border-stone-700">
                  {isDrawFinalized ? formatWishlistText(participants.find(p => p.id === previewParticipant.assignedToId)?.wishlist || []) : '1. [Draw has not been conducted yet]'}
                </pre>
              </div>
            </div>
          ) : (
            <span className="text-xs text-stone-400">Select a participant to view their rendered email template.</span>
          )}
        </div>
      </div>

      {/* Dispatch Activity Logs */}
      {emailLogs.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
              Recent Email Dispatch Activity Logs ({emailLogs.length})
            </h3>
            <button
              onClick={() => setEmailLogs([])}
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              Clear Logs
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {emailLogs.map(log => (
              <div
                key={log.id}
                className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {log.toName} ({log.toEmail})
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        log.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : log.status === 'simulated'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Assigned: {log.recipientName} (&ldquo;{log.recipientNickname}&rdquo;) · {log.wishlistCount} wishes
                  </div>
                </div>

                <span className="text-[11px] font-mono text-stone-400 tabular-nums shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
