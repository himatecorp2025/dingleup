import React from 'react';

interface DiamondHexagonProps {
  type: 'rank' | 'coins' | 'lives';
  value: string | number;
  className?: string;
}

/**
 * 3D Diamond Hexagon with SVG icons
 * Responsive design with diamond cross pattern
 */
export const DiamondHexagon: React.FC<DiamondHexagonProps> = ({ type, value, className = '' }) => {
  // Color schemes per type
  const colorSchemes = {
    rank: {
      gradientOuter: 'from-primary-dark via-primary to-primary-darker',
      gradientMiddle: 'from-primary via-primary-glow to-primary-dark',
      gradientInner: 'from-primary-glow via-primary to-primary-dark',
      borderColor: 'border-accent',
      shadowColor: 'shadow-[0_0_20px_hsl(var(--primary)/0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'hsl(var(--primary) / 0.4)',
      iconColor: 'hsl(var(--accent))',
    },
    coins: {
      gradientOuter: 'from-accent-dark via-accent to-accent-darker',
      gradientMiddle: 'from-accent via-accent-glow to-accent-dark',
      gradientInner: 'from-accent-glow via-accent to-accent-dark',
      borderColor: 'border-accent-glow',
      shadowColor: 'shadow-[0_0_20px_hsl(var(--accent)/0.7),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'hsl(var(--accent) / 0.5)',
      iconColor: 'hsl(var(--foreground))',
    },
    lives: {
      gradientOuter: 'from-destructive-dark via-destructive to-destructive-darker',
      gradientMiddle: 'from-destructive via-destructive-glow to-destructive-dark',
      gradientInner: 'from-destructive-glow via-destructive to-destructive-dark',
      borderColor: 'border-destructive-glow',
      shadowColor: 'shadow-[0_0_20px_hsl(var(--destructive)/0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'hsl(var(--destructive) / 0.4)',
      iconColor: 'hsl(var(--foreground))',
    },
  };

  const colors = colorSchemes[type];

  // SVG Icons
  const renderIcon = () => {
    const iconSize = 16; // Base size for mobile
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
            <circle cx="12" cy="12" r="9" fill={color} stroke="hsl(var(--accent-dark))" strokeWidth="2"/>
            <circle cx="12" cy="12" r="6" fill="none" stroke="hsl(var(--accent-dark))" strokeWidth="1.5" opacity="0.5"/>
            <text x="12" y="16" textAnchor="middle" fill="hsl(var(--accent-dark))" fontSize="10" fontWeight="bold">$</text>
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
              stroke="hsl(var(--destructive))"
              strokeWidth="1.5"
            />
          </svg>
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse"
        style={{ background: colors.glowColor }}
      />

      {/* 3D Hexagon Container */}
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24">
        {/* BASE SHADOW (3D depth) */}
        <div
          className="absolute clip-hexagon"
          style={{
            top: '3px',
            left: '3px',
            right: '-3px',
            bottom: '-3px',
            background: 'rgba(0,0,0,0.35)',
            filter: 'blur(3px)',
          }}
          aria-hidden
        />

        {/* OUTER FRAME - gradient with border */}
        <div
          className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${colors.gradientOuter} border-2 ${colors.borderColor} ${colors.shadowColor}`}
          aria-hidden
        />

        {/* MIDDLE FRAME (bright inner highlight) */}
        <div
          className={`absolute inset-[3px] clip-hexagon bg-gradient-to-b ${colors.gradientMiddle}`}
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
          aria-hidden
        />

        {/* INNER CRYSTAL/COLOR LAYER */}
        <div
          className={`absolute clip-hexagon bg-gradient-to-b ${colors.gradientInner}`}
          style={{
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
            boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)',
          }}
          aria-hidden
        />

        {/* SPECULAR HIGHLIGHT (top-left) */}
        <div
          className="absolute clip-hexagon pointer-events-none"
          style={{
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
            background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)',
          }}
          aria-hidden
        />


        {/* INNER GLOW (bottom shadow for 3D depth) */}
        <div
          className="absolute clip-hexagon pointer-events-none"
          style={{
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.25)',
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
