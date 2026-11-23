import React, { useState, useEffect } from 'react';
import { ParolStar } from './ParolStar.tsx';
import { FlagsHint } from './FlagsHint.tsx';
import { EventConfig, Participant } from '../types/index.ts';

interface EventHeroProps {
  config: EventConfig;
  participants?: Participant[];
  totalCount?: number;
  totalWishes?: number;
  onQuickAction?: () => void;
  isDrawFinalized: boolean;
}

export const EventHero: React.FC<EventHeroProps> = ({
  config,
  participants = [],
  totalCount,
  totalWishes,
  isDrawFinalized
}) => {
  const count = totalCount !== undefined ? totalCount : participants.length;
  const wishCount = totalWishes !== undefined 
    ? totalWishes 
    : participants.reduce((acc, p) => acc + (p.wishlist?.length || 0), 0);
  // Countdown to Dec 24, 2026, 18:00 CET
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2026-12-24T18:00:00+01:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalCouples = Math.floor(participants.length / 2);
  const totalWishlistItems = participants.reduce((acc, p) => acc + (p.wishlist?.length || 0), 0);

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-amber-50 p-6 sm:p-8 md:p-10 shadow-xl border border-amber-500/20 mb-8">
      {/* Decorative Dual-Heritage Flag Gradient Bar on top edge */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        {/* Philippines Flag colors: Blue & Red with Gold */}
        <div className="flex-1 bg-gradient-to-r from-[#0038A8] via-[#CE1126] to-[#FCD116]" />
        {/* Germany Flag colors: Black, Red, Gold */}
        <div className="flex-1 bg-gradient-to-r from-stone-900 via-[#DD0000] to-[#FFCE00]" />
      </div>

      {/* Background festive ambient circles */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-12 w-72 h-72 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Side: Editorial Typography & Event Metadata */}
        <div className="max-w-2xl text-center lg:text-left">
          {/* Flag Hint Badge */}
          <div className="mb-3.5 flex justify-center lg:justify-start">
            <FlagsHint size="md" showLabel={true} />
          </div>

          {/* Clean Unboxed Metadata with · separator */}
          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm font-medium text-amber-300/90 mb-3 tracking-wide">
            <span>Dec 24, 2026</span>
            <span aria-hidden="true">·</span>
            <span>{config.location}</span>
            <span aria-hidden="true">·</span>
            <span>Min. Budget: €{config.minBudgetEur}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3" style={{ textWrap: 'balance' }}>
            Lear Alumni Secret Santa: Manito-Manita in Germany
          </h1>



          {/* Quick Metrics Bar (Clean tabular numerals, zero pill enclosures) */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 border-t border-emerald-800/60 text-xs sm:text-sm">
            <div>
              <span className="block text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-400">
                {count} / 12
              </span>
              <span className="text-stone-300">
                {count >= 12 ? 'All 12 Joined (Complete)' : `${Math.max(0, 12 - count)} Still Missing`}
              </span>
            </div>

            <div className="w-px h-8 bg-emerald-800" />

            <div>
              <span className="block text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-400">
                €{config.minBudgetEur}
              </span>
              <span className="text-stone-300">Minimum Gift Budget</span>
            </div>

            <div className="w-px h-8 bg-emerald-800" />

            <div>
              <span className="block text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-400">
                {wishCount}
              </span>
              <span className="text-stone-300">Wishes Registered</span>
            </div>
          </div>
        </div>

        {/* Right Side: Glowing Parol & Countdown Timer */}
        <div className="flex flex-col items-center shrink-0 w-full lg:w-auto">
          <div className="relative mb-4">
            <ParolStar size={110} glow={true} />
          </div>

          {/* Countdown Clock */}
          <div className="bg-emerald-900/70 backdrop-blur-sm border border-amber-400/30 rounded-xl px-5 py-3 w-full max-w-xs text-center">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-300 block mb-1">
              Countdown to Christmas Eve
            </span>
            <div className="grid grid-cols-4 gap-2 font-mono tabular-nums text-stone-100">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-amber-400">{timeLeft.days}</span>
                <span className="text-[10px] text-stone-300">Days</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-amber-400">{timeLeft.hours}</span>
                <span className="text-[10px] text-stone-300">Hours</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-amber-400">{timeLeft.minutes}</span>
                <span className="text-[10px] text-stone-300">Mins</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-amber-400">{timeLeft.seconds}</span>
                <span className="text-[10px] text-stone-300">Secs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
