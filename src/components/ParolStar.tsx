import React from 'react';

interface ParolStarProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const ParolStar: React.FC<ParolStarProps> = ({
  className = '',
  size = 64,
  glow = true
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${glow ? 'animate-twinkle' : ''} ${className}`}
      style={{ width: size, height: size * 1.3 }}
      role="img"
      aria-label="Filipino Christmas Parol star lantern"
    >
      <svg
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <radialGradient id="parolCore" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>
          <linearGradient id="rubyPetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <linearGradient id="emeraldRay" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="goldTassel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Halo */}
        <circle cx="50" cy="45" r="38" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

        {/* 5 Outer Triangular Star Points */}
        {/* Top point */}
        <polygon points="50,6 42,35 58,35" fill="url(#rubyPetal)" stroke="#FDE68A" strokeWidth="1" />
        {/* Top-Right point */}
        <polygon points="87,33 58,40 68,54" fill="url(#emeraldRay)" stroke="#FDE68A" strokeWidth="1" />
        {/* Bottom-Right point */}
        <polygon points="73,78 54,54 46,65" fill="url(#rubyPetal)" stroke="#FDE68A" strokeWidth="1" />
        {/* Bottom-Left point */}
        <polygon points="27,78 54,65 46,54" fill="url(#emeraldRay)" stroke="#FDE68A" strokeWidth="1" />
        {/* Top-Left point */}
        <polygon points="13,33 32,54 42,40" fill="url(#rubyPetal)" stroke="#FDE68A" strokeWidth="1" />

        {/* Central 5-Point Star Body */}
        <polygon
          points="50,15 58,36 80,36 62,50 69,72 50,58 31,72 38,50 20,36 42,36"
          fill="url(#parolCore)"
          stroke="#FFFBEB"
          strokeWidth="1.5"
          filter="url(#softGlow)"
        />

        {/* Central Core Rosette / Capiz Jewel */}
        <circle cx="50" cy="45" r="9" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="50" cy="45" r="4.5" fill="#DC2626" />
        <circle cx="50" cy="45" r="2" fill="#FFFFFF" />

        {/* Left Streamer Tassel */}
        <g className="animate-sway">
          <line x1="33" y1="75" x2="31" y2="84" stroke="#D97706" strokeWidth="1.5" />
          <polygon points="31,84 25,124 37,124" fill="url(#goldTassel)" stroke="#FDE68A" strokeWidth="0.8" opacity="0.95" />
          <circle cx="31" cy="84" r="2.5" fill="#DC2626" />
          <line x1="28" y1="124" x2="28" y2="128" stroke="#F59E0B" strokeWidth="1" />
          <line x1="31" y1="124" x2="31" y2="129" stroke="#F59E0B" strokeWidth="1" />
          <line x1="34" y1="124" x2="34" y2="128" stroke="#F59E0B" strokeWidth="1" />
        </g>

        {/* Right Streamer Tassel */}
        <g className="animate-sway" style={{ animationDelay: '0.8s' }}>
          <line x1="67" y1="75" x2="69" y2="84" stroke="#D97706" strokeWidth="1.5" />
          <polygon points="69,84 63,124 75,124" fill="url(#goldTassel)" stroke="#FDE68A" strokeWidth="0.8" opacity="0.95" />
          <circle cx="69" cy="84" r="2.5" fill="#DC2626" />
          <line x1="66" y1="124" x2="66" y2="128" stroke="#F59E0B" strokeWidth="1" />
          <line x1="69" y1="124" x2="69" y2="129" stroke="#F59E0B" strokeWidth="1" />
          <line x1="72" y1="124" x2="72" y2="128" stroke="#F59E0B" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
};
