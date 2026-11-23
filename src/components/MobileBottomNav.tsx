import React from 'react';
import { User, Share2, Lock, LogOut } from 'lucide-react';
import { Participant } from '../types/index.ts';

interface MobileBottomNavProps {
  currentUser?: Participant | null;
  onRegisterNew: () => void;
  onOpenInvite: () => void;
  onOpenOrganizer: () => void;
  onViewDashboard: () => void;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentUser,
  onRegisterNew,
  onOpenInvite,
  onOpenOrganizer,
  onViewDashboard,
  onLoginClick,
  onLogout
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-amber-200/60 dark:border-stone-800 shadow-lg">
      <nav className={`grid ${currentUser ? 'grid-cols-4' : 'grid-cols-2'} items-center h-16 max-w-md mx-auto px-2`}>
        {currentUser ? (
          <>
            <button
              onClick={onViewDashboard}
              className="flex flex-col items-center justify-center min-h-[44px] text-emerald-800 dark:text-emerald-400 font-semibold"
              aria-label="My Dashboard"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">My Portal</span>
            </button>

            <button
              onClick={onOpenInvite}
              className="flex flex-col items-center justify-center min-h-[44px] text-stone-600 dark:text-stone-300 hover:text-stone-900"
              aria-label="Invite Friends"
            >
              <Share2 className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Invite</span>
            </button>

            <button
              onClick={onLogout}
              className="flex flex-col items-center justify-center min-h-[44px] text-stone-600 dark:text-stone-300 hover:text-stone-900"
              aria-label="Log Out"
            >
              <LogOut className="w-5 h-5 text-stone-400" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Log Out</span>
            </button>

            <button
              onClick={onOpenOrganizer}
              className="flex flex-col items-center justify-center min-h-[44px] text-stone-600 dark:text-stone-300 hover:text-stone-900"
              aria-label="Organizer Draw Tools"
            >
              <Lock className="w-5 h-5 text-stone-400" />
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Organizer</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onOpenInvite}
              className="flex flex-col items-center justify-center min-h-[44px] text-emerald-800 dark:text-emerald-400 font-semibold"
              aria-label="Invite Friends"
            >
              <Share2 className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px] font-medium tracking-tight mt-1 whitespace-nowrap">Invite Friends</span>
            </button>

            <button
              onClick={onOpenOrganizer}
              className="flex flex-col items-center justify-center min-h-[44px] text-stone-600 dark:text-stone-300 hover:text-stone-900"
              aria-label="Organizer Draw Tools"
            >
              <Lock className="w-5 h-5 text-stone-400" />
              <span className="text-[11px] font-medium tracking-tight mt-1 whitespace-nowrap">Organizer Tools</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};
