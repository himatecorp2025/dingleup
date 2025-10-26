import React, { ReactNode } from 'react';

interface RoundedHexagonButtonProps {
  onClick?: () => void;
  variant: 'play' | 'booster' | 'shop' | 'share' | 'leaderboard';
  children: ReactNode;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  badge?: ReactNode;
  style?: React.CSSProperties;
  lineLength?: 'full' | 'short'; // full = teljes szélesség, short = 5%
}

/**
 * Lekerekített hexagon gomb vízszintes vonalakkal
 */
export const RoundedHexagonButton: React.FC<RoundedHexagonButtonProps> = ({
  onClick,
  variant,
  children,
  className = '',
  active = false,
  disabled = false,
  size = 'lg',
  badge,
  style,
  lineLength = 'full',
}) => {
  // Variant color schemes
  const variants = {
    play: {
      gradientOuter: 'from-green-700 via-green-600 to-green-900',
      gradientMiddle: 'from-green-600 via-green-500 to-green-800',
      gradientInner: 'from-green-500 via-green-600 to-green-700',
      borderColor: '#22c55e',
      shadowColor: 'shadow-[0_0_20px_rgba(34,197,94,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.8),0_12px_30px_rgba(0,0,0,0.6)]',
      glowColor: 'rgba(34,197,94,0.4)',
      textColor: 'text-white',
      iconColor: '#ffffff',
    },
    booster: {
      gradientOuter: active ? 'from-orange-600 via-orange-500 to-orange-800' : 'from-yellow-600 via-yellow-500 to-yellow-800',
      gradientMiddle: active ? 'from-orange-500 via-orange-400 to-orange-700' : 'from-yellow-500 via-yellow-400 to-yellow-700',
      gradientInner: active ? 'from-orange-400 via-orange-500 to-orange-600' : 'from-yellow-400 via-yellow-500 to-yellow-600',
      borderColor: active ? '#f97316' : '#eab308',
      shadowColor: active
        ? 'shadow-[0_0_20px_rgba(249,115,22,0.6),0_8px_25px_rgba(0,0,0,0.5)]'
        : 'shadow-[0_0_20px_rgba(234,179,8,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      hoverShadow: active
        ? 'hover:shadow-[0_0_30px_rgba(249,115,22,0.8),0_12px_30px_rgba(0,0,0,0.6)]'
        : 'hover:shadow-[0_0_30px_rgba(234,179,8,0.8),0_12px_30px_rgba(0,0,0,0.6)]',
      glowColor: active ? 'rgba(249,115,22,0.4)' : 'rgba(234,179,8,0.4)',
      textColor: active ? 'text-white' : 'text-black',
      iconColor: active ? '#ffffff' : '#000000',
    },
    shop: {
      gradientOuter: 'from-yellow-600 via-yellow-500 to-yellow-800',
      gradientMiddle: 'from-yellow-500 via-yellow-400 to-yellow-700',
      gradientInner: 'from-yellow-400 via-yellow-500 to-yellow-600',
      borderColor: '#facc15',
      shadowColor: 'shadow-[0_0_15px_rgba(234,179,8,0.6),0_6px_20px_rgba(0,0,0,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_25px_rgba(234,179,8,0.8),0_10px_25px_rgba(0,0,0,0.6)]',
      glowColor: 'rgba(234,179,8,0.3)',
      textColor: 'text-gray-100',
      iconColor: '#f3f4f6',
    },
    share: {
      gradientOuter: 'from-blue-700 via-blue-600 to-blue-900',
      gradientMiddle: 'from-blue-600 via-blue-500 to-blue-800',
      gradientInner: 'from-blue-500 via-blue-600 to-blue-700',
      borderColor: '#60a5fa',
      shadowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.5),0_6px_20px_rgba(0,0,0,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.7),0_10px_25px_rgba(0,0,0,0.6)]',
      glowColor: 'rgba(59,130,246,0.3)',
      textColor: 'text-white',
      iconColor: '#ffffff',
    },
    leaderboard: {
      gradientOuter: 'from-purple-700 via-purple-600 to-purple-900',
      gradientMiddle: 'from-purple-600 via-purple-500 to-purple-800',
      gradientInner: 'from-purple-500 via-purple-600 to-purple-700',
      borderColor: '#a855f7',
      shadowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.5),0_8px_25px_rgba(0,0,0,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.7),0_12px_30px_rgba(0,0,0,0.6)]',
      glowColor: 'rgba(168,85,247,0.3)',
      textColor: 'text-white',
      iconColor: '#ffffff',
    },
  };

  const colors = variants[variant];
  const clipPathId = `hex-btn-${variant}-${Math.random().toString(36).substr(2, 9)}`;

  // Size classes
  const sizeClasses = {
    sm: 'py-2 px-2 text-xs',
    md: 'py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base',
    lg: 'py-2 sm:py-2.5 px-4 sm:px-5 text-base sm:text-lg',
  };

  // Border width - ezt használjuk a vonalak vastagságához is
  const borderWidth = 2;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full ${sizeClasses[size]} font-black transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
      } overflow-visible ${className}`}
      style={style}
    >
      {/* SVG ClipPath Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            {/* Complete hexagon: sharp left/right points, curved top/bottom */}
            <path d="
              M 0.20,0 
              L 0.80,0 
              C 0.84,0 0.87,0.02 0.89,0.05
              L 0.97,0.20
              C 0.985,0.23 0.995,0.27 1,0.30
              L 1,0.50
              L 1,0.70
              C 0.995,0.73 0.985,0.77 0.97,0.80
              L 0.89,0.95
              C 0.87,0.98 0.84,1 0.80,1
              L 0.20,1
              C 0.16,1 0.13,0.98 0.11,0.95
              L 0.03,0.80
              C 0.015,0.77 0.005,0.73 0,0.70
              L 0,0.50
              L 0,0.30
              C 0.005,0.27 0.015,0.23 0.03,0.20
              L 0.11,0.05
              C 0.13,0.02 0.16,0 0.20,0
              Z
            " />
          </clipPath>
        </defs>
      </svg>

      {/* Badge indicator */}
      {badge && (
        <span className="absolute -top-1 -right-1 z-20">
          {badge}
        </span>
      )}

      {/* Single horizontal line in the middle - BEHIND the button */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0"
        style={{
          width: lineLength === 'full' ? '100vw' : '5%',
          borderTop: `${borderWidth}px solid ${colors.borderColor}`,
          zIndex: -1,
        }}
      />

      {/* BASE SHADOW (3D depth) */}
      <div
        className="absolute"
        style={{
          top: '4px',
          left: '4px',
          right: '-4px',
          bottom: '-4px',
          background: 'rgba(0,0,0,0.35)',
          filter: 'blur(4px)',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />

      {/* OUTER FRAME - gradient with border */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradientOuter} ${colors.shadowColor} ${!disabled && colors.hoverShadow}`}
        style={{
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />

      {/* STROKE LAYER (inset) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 ${borderWidth}px ${colors.borderColor}`,
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />

      {/* MIDDLE GOLD/COLOR FRAME (bright inner highlight) */}
      <div
        className={`absolute inset-[3px] bg-gradient-to-b ${colors.gradientMiddle}`}
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />

      {/* INNER CRYSTAL/COLOR LAYER */}
      <div
        className={`absolute bg-gradient-to-b ${colors.gradientInner}`}
        style={{
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />

      {/* SPECULAR HIGHLIGHT (top-left) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />

      {/* INNER GLOW (bottom shadow for 3D depth) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.25)',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      />

      {/* 45° SHINE (animated) */}
      <div
        className="absolute pointer-events-none overflow-hidden"
        style={{
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          clipPath: `url(#${clipPathId})`
        }}
        aria-hidden
      >
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          style={{
            background: 'linear-gradient(45deg, transparent 46%, rgba(255,215,0,0.6) 50%, transparent 54%)',
            animation: 'slot-shine 2s linear infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 flex items-center justify-center ${colors.textColor}`}>
        {children}
      </div>

      <style>{`
        @keyframes slot-shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
      `}</style>
    </button>
  );
};
