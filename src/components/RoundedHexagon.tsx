import React from 'react';

interface RoundedHexagonProps {
  type: 'rank' | 'coins' | 'lives';
  value: string | number;
  className?: string;
  lineLength?: 'full' | 'short'; // full = teljes szélesség, short = 5%
}

/**
 * Lekerekített 3D hexagon vízszintes vonalakkal
 */
export const RoundedHexagon: React.FC<RoundedHexagonProps> = ({ 
  type, 
  value, 
  className = '',
  lineLength = 'short' 
}) => {
  // Color schemes per type
  const colorSchemes = {
    rank: {
      gradientOuter: 'from-purple-700 via-purple-600 to-purple-900',
      gradientMiddle: 'from-purple-600 via-purple-500 to-purple-800',
      gradientInner: 'from-purple-500 via-purple-600 to-purple-700',
      borderColor: '#fbbf24',
      shadowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'rgba(168,85,247,0.4)',
      iconColor: '#fbbf24', // yellow-400
    },
    coins: {
      gradientOuter: 'from-yellow-600 via-yellow-500 to-yellow-800',
      gradientMiddle: 'from-yellow-500 via-yellow-400 to-yellow-700',
      gradientInner: 'from-yellow-400 via-yellow-500 to-yellow-600',
      borderColor: '#fde047',
      shadowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.7),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'rgba(234,179,8,0.5)',
      iconColor: '#ffffff',
    },
    lives: {
      gradientOuter: 'from-red-700 via-red-600 to-red-900',
      gradientMiddle: 'from-red-600 via-red-500 to-red-800',
      gradientInner: 'from-red-500 via-red-600 to-red-700',
      borderColor: '#f87171',
      shadowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'rgba(239,68,68,0.4)',
      iconColor: '#ffffff',
    },
  };

  const colors = colorSchemes[type];
  const borderWidth = 2;
  const clipPathId = `hex-${type}-${Math.random().toString(36).substr(2, 9)}`;

  // SVG Icons
  const renderIcon = () => {
    const color = colors.iconColor;

    switch (type) {
      case 'rank':
        // Crown SVG
        return (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mb-0.5 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill={color}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2.5 16L3.5 5L7 7.5L12 2L17 7.5L20.5 5L21.5 16H2.5Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
            <path d="M3 16H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V16Z" stroke={color} strokeWidth="2"/>
            <circle cx="12" cy="9" r="1.5" fill={color}/>
            <circle cx="7" cy="11" r="1.5" fill={color}/>
            <circle cx="17" cy="11" r="1.5" fill={color}/>
          </svg>
        );
      case 'coins':
        // Coin SVG
        return (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mb-0.5 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="9" fill={color} stroke="#d97706" strokeWidth="2"/>
            <circle cx="12" cy="12" r="6" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
            <text x="12" y="16" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="bold">$</text>
          </svg>
        );
      case 'lives':
        // Heart SVG
        return (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mb-0.5 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill={color}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="#dc2626"
              strokeWidth="1.5"
            />
          </svg>
        );
    }
  };

  return (
    <div className={`relative overflow-visible ${className}`}>
      {/* SVG ClipPath Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            {/* Complete hexagon: sharp left/right points, curved top/bottom */}
            <path d="
              M 0.20,0 
              L 0.80,0 
              C 0.86,0 0.90,0.04 0.94,0.12
              L 1.00,0.50
              L 0.94,0.88
              C 0.90,0.96 0.86,1.00 0.80,1.00
              L 0.20,1.00
              C 0.14,1.00 0.10,0.96 0.06,0.88
              L 0.00,0.50
              L 0.06,0.12
              C 0.10,0.04 0.14,0.00 0.20,0.00
              Z
            " />
          </clipPath>
        </defs>
      </svg>

      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse"
        style={{ background: colors.glowColor }}
      />

      {/* 3D Hexagon Container */}
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24">
        {/* Single horizontal line in the middle - BEHIND */}
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
            top: '3px',
            left: '3px',
            right: '-3px',
            bottom: '-3px',
            background: 'rgba(0,0,0,0.35)',
            filter: 'blur(3px)',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />

        {/* OUTER FRAME - gradient with border */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradientOuter} ${colors.shadowColor}`}
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

        {/* MIDDLE FRAME (bright inner highlight) */}
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

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          {renderIcon()}
          <span className="text-white text-[10px] sm:text-xs md:text-sm lg:text-base font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
};
