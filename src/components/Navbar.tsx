import React from 'react';
import { Share2, Lock, LogOut, User } from 'lucide-react';
import { ParolStar } from './ParolStar.tsx';
import { Participant } from '../types/index.ts';

interface NavbarProps {
  currentUser?: Participant | null;
  onLogout?: () => void;
  onOpenInvite?: () => void;
  onOpenOrganizer?: () => void;
  onRegisterNew?: () => void;
  onLoginClick?: () => void;
  isDrawFinalized: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenInvite,
  onOpenOrganizer,
  onRegisterNew,
  onLoginClick,
  isDrawFinalized
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-amber-200/50 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <ParolStar size={32} glow={false} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-emerald-950 dark:text-emerald-100 block leading-tight">
                Lear Alumni Secret Santa
              </span>
              <span className="text-xs tracking-tighter" aria-hidden="true">🇵🇭 🇩🇪</span>
            </div>
            <span className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-sans block">
              Manito-Manita in Germany · Lohra-Kirchvers
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {currentUser ? (
            <>
              {/* Active User Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs">
                <User className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {currentUser.name}
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-serif font-normal">
                  (&ldquo;{currentUser.nickname}&rdquo;)
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors whitespace-nowrap shrink-0"
                title="Log out of your personal dashboard"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Log Out</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </>
          ) : null}

          <button
            onClick={onOpenInvite}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors whitespace-nowrap shrink-0"
            title="Invite friends to register"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite Friends</span>
            <span className="sm:hidden">Invite</span>
          </button>

          <button
            onClick={onOpenOrganizer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors whitespace-nowrap shrink-0"
            title="Organizer draw controls (blind & zero spoilers)"
          >
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Organizer Tools</span>
            <span className="sm:hidden">Draw</span>
          </button>
        </div>
      </div>
    </header>
  );
};
