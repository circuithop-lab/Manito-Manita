import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { EventHero } from './components/EventHero.tsx';
import { AuthView } from './components/AuthView.tsx';
import { ParticipantDashboardView } from './components/ParticipantDashboardView.tsx';
import { InviteFriendsModal } from './components/InviteFriendsModal.tsx';
import { OrganizerModal } from './components/OrganizerModal.tsx';
import { EmailDispatchModal } from './components/EmailDispatchModal.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { Participant, EventConfig } from './types/index.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [totalWishes, setTotalWishes] = useState<number>(0);
  const [participantsList, setParticipantsList] = useState<Participant[]>([]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [config, setConfig] = useState<EventConfig>({
    eventName: 'Lear Alumni Secret Santa: Manito-Manita in Germany',
    date: '2026-12-24',
    location: 'Lohra-Kirchvers, Hessen',
    minBudgetEur: 30,
    targetParticipants: 12,
    isDrawFinalized: false,
    emailConfig: {
      serviceId: '',
      templateId: '',
      publicKey: '',
      autoSendOnDraw: false
    }
  });

  const [loading, setLoading] = useState(true);

  // Fetch public event data and verify existing session
  const fetchData = async () => {
    try {
      const storedToken = localStorage.getItem('monito_token');
      if (storedToken) {
        setAuthToken(storedToken);
      }

      // Fetch public event stats
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/event', { headers });
      const data = await res.json();

      if (data.config) setConfig(data.config);
      if (typeof data.totalParticipants === 'number') {
        setTotalParticipants(data.totalParticipants);
      }
      if (typeof data.totalWishes === 'number') {
        setTotalWishes(data.totalWishes);
      }

      // If user had an active session returned by the server
      if (data.currentUser) {
        setCurrentUser(data.currentUser);
      } else if (storedToken) {
        // Double check /api/auth/me
        try {
          const meRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          const meData = await meRes.json();
          if (meRes.ok && meData.success && meData.participant) {
            setCurrentUser(meData.participant);
          } else {
            localStorage.removeItem('monito_token');
            setAuthToken(null);
            setCurrentUser(null);
          }
        } catch {
          // Keep current state
        }
      }
    } catch (err) {
      console.error('Error loading event data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check URL parameters for direct action
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join') || params.get('register') || params.get('action') === 'register';
    if (joinParam) {
      setAuthMode('register');
    }
  }, []);

  const handleAuthSuccess = (token: string, participant: Participant, isOrganizer?: boolean) => {
    localStorage.setItem('monito_token', token);
    setAuthToken(token);
    setCurrentUser(participant);
    setTotalParticipants(prev => Math.max(prev, 1));
    fetchData();
    if (isOrganizer) {
      setShowOrganizerModal(true);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (err) {
        console.error('Error logging out:', err);
      }
    }
    localStorage.removeItem('monito_token');
    setAuthToken(null);
    setCurrentUser(null);
    fetchData();
  };

  const handleSaveParticipant = async (updated: Participant) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/participants/${updated.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success && data.participant) {
        setCurrentUser(data.participant);
        if (typeof data.totalWishes === 'number') {
          setTotalWishes(data.totalWishes);
        }
        if (data.isDrawFinalized !== undefined) {
          setConfig(prev => ({ ...prev, isDrawFinalized: data.isDrawFinalized }));
        }
        await fetchData();
      }
    } catch (err) {
      console.error('Error saving participant:', err);
      throw err;
    }
  };

  const handleResetSample = async () => {
    try {
      const res = await fetch('/api/participants/reset-sample', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error resetting sample:', err);
    }
  };

  const handleClearToBlank = async () => {
    try {
      const res = await fetch('/api/participants/clear-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('monito_token');
        setAuthToken(null);
        setCurrentUser(null);
        setTotalParticipants(0);
        await fetchData();
      }
    } catch (err) {
      console.error('Error clearing roster:', err);
    }
  };

  const handleExecuteDraw = async (lockNow: boolean) => {
    try {
      const res = await fetch('/api/draw/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockNow })
      });
      const data = await res.json();
      if (data.success) {
        setConfig(prev => ({
          ...prev,
          isDrawFinalized: data.isDrawFinalized,
          drawnAt: data.drawnAt
        }));
        await fetchData();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error executing draw.' };
    }
  };

  const handleResetDraw = async () => {
    try {
      const res = await fetch('/api/draw/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setConfig(prev => ({
          ...prev,
          isDrawFinalized: false,
          drawnAt: undefined
        }));
        await fetchData();
      }
    } catch (err) {
      console.error('Error resetting draw:', err);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<EventConfig>) => {
    try {
      const res = await fetch('/api/event/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Error updating config:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-red-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm text-stone-600">Loading Paskong Pinoy Manito Manita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-stone-900 pb-16 md:pb-0">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => setAuthMode('login')}
        onRegisterNew={() => setAuthMode('register')}
        onOpenInvite={() => setShowInviteModal(true)}
        onOpenOrganizer={() => setShowOrganizerModal(true)}
        isDrawFinalized={config.isDrawFinalized}
      />

      {/* Festive Hero Banner & Event Countdown (Live counter: X / 12) */}
      <EventHero
        config={config}
        totalCount={totalParticipants}
        totalWishes={totalWishes}
        onQuickAction={() => {
          if (!currentUser) setAuthMode('register');
        }}
        isDrawFinalized={config.isDrawFinalized}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {currentUser ? (
          /* Personalized Authenticated Dashboard */
          <ParticipantDashboardView
            key={currentUser.id}
            currentParticipant={currentUser}
            config={config}
            token={authToken || undefined}
            totalRegistered={totalParticipants}
            onSaveParticipant={handleSaveParticipant}
            onLogout={handleLogout}
          />
        ) : (
          /* Personalized Login / Registration Card */
          <AuthView
            config={config}
            totalRegistered={totalParticipants}
            targetParticipants={config.targetParticipants || 12}
            defaultMode={authMode}
            onAuthSuccess={handleAuthSuccess}
            onOpenOrganizer={() => setShowOrganizerModal(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileBottomNav
        currentUser={currentUser}
        onViewDashboard={() => {
          if (!currentUser) setAuthMode('login');
        }}
        onLoginClick={() => setAuthMode('login')}
        onRegisterNew={() => setAuthMode('register')}
        onLogout={handleLogout}
        onOpenInvite={() => setShowInviteModal(true)}
        onOpenOrganizer={() => setShowOrganizerModal(true)}
      />

      {/* Organizer Secret Draw Console Modal (Blind & Zero Spoilers) */}
      {showOrganizerModal && (
        <OrganizerModal
          onClose={() => setShowOrganizerModal(false)}
          config={config}
          currentUser={currentUser}
          onExecuteDraw={handleExecuteDraw}
          onResetDraw={handleResetDraw}
          onClearToBlank={handleClearToBlank}
          onRestoreSample={handleResetSample}
          onOpenEmailDispatch={() => setShowEmailModal(true)}
          onRefreshData={fetchData}
        />
      )}

      {/* EmailJS Dispatch Modal */}
      {showEmailModal && (
        <EmailDispatchModal
          config={config}
          participants={participantsList}
          isDrawFinalized={config.isDrawFinalized}
          onUpdateConfig={handleUpdateConfig}
          onNavigateToDraw={() => setShowOrganizerModal(true)}
        />
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal
          onClose={() => setShowInviteModal(false)}
          onClearToBlank={handleClearToBlank}
          onRestoreSample={handleResetSample}
          currentParticipantCount={totalParticipants}
          onOpenRegisterForm={() => {
            setShowInviteModal(false);
            if (!currentUser) setAuthMode('register');
          }}
        />
      )}

      {/* Festive Clean Footer */}
      <footer className="mt-auto border-t border-amber-200/50 dark:border-stone-800 bg-white/50 dark:bg-stone-900/40 py-6 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-800 dark:text-stone-200">
              Lear Alumni Secret Santa: Manito-Manita in Germany 🇵🇭 🇩🇪
            </span>
            <span aria-hidden="true">·</span>
            <span>Lohra-Kirchvers, Hessen</span>
          </div>

          <p className="font-serif italic text-stone-600 dark:text-stone-300">
            Frohe Weihnachten & Maligayang Pasko!
          </p>

          <span className="text-[11px] text-stone-400">
            Min. Gift Budget: €{config.minBudgetEur} · Dec 24, 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
