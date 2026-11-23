import React from 'react';

interface FlagsHintProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const FlagsHint: React.FC<FlagsHintProps> = ({
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const flagDimensions = {
    sm: { width: 22, height: 14 },
    md: { width: 28, height: 18 },
    lg: { width: 36, height: 24 }
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 dark:bg-black/30 backdrop-blur-md border border-amber-300/30 text-amber-100 shadow-sm ${className}`}>
      {/* Philippines Flag SVG */}
      <span className="flex items-center gap-1.5 shrink-0" title="Philippines">
        <svg
          width={flagDimensions.width}
          height={flagDimensions.height}
          viewBox="0 0 24 16"
          className="rounded shadow-xs overflow-hidden border border-white/20"
        >
          {/* Blue top bar */}
          <rect width="24" height="8" fill="#0038A8" />
          {/* Red bottom bar */}
          <rect y="8" width="24" height="8" fill="#CE1126" />
          {/* White triangle */}
          <polygon points="0,0 13.85,8 0,16" fill="#FFFFFF" />
          {/* Golden sun */}
          <circle cx="4.6" cy="8" r="2.2" fill="#FCD116" />
          {/* 3 golden stars */}
          <circle cx="1.6" cy="2.5" r="0.8" fill="#FCD116" />
          <circle cx="1.6" cy="13.5" r="0.8" fill="#FCD116" />
          <circle cx="10.8" cy="8" r="0.8" fill="#FCD116" />
        </svg>
        {showLabel && <span className="text-xs font-semibold tracking-wide text-amber-200">Philippines</span>}
      </span>

      {/* Decorative Connector */}
      <span className="text-amber-400/60 text-xs font-bold shrink-0">🤝</span>

      {/* Germany Flag SVG */}
      <span className="flex items-center gap-1.5 shrink-0" title="Germany">
        <svg
          width={flagDimensions.width}
          height={flagDimensions.height}
          viewBox="0 0 24 16"
          className="rounded shadow-xs overflow-hidden border border-white/20"
        >
          {/* Black top */}
          <rect width="24" height="5.33" fill="#1C1C1C" />
          {/* Red middle */}
          <rect y="5.33" width="24" height="5.34" fill="#DD0000" />
          {/* Gold bottom */}
          <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
        </svg>
        {showLabel && <span className="text-xs font-semibold tracking-wide text-amber-200">Germany</span>}
      </span>
    </div>
  );
};
