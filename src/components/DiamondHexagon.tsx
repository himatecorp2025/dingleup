import React from 'react';
import { useI18n } from '@/i18n/useI18n';

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
  const { t } = useI18n();
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
        // Crown SVG - gold color for rank
        return (
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mb-0.5 drop-shadow-lg"
              viewBox="0 0 24 24"
              fill="hsl(var(--accent))"
              xmlns="http://www.w3.org/2000/svg"
            >
            <path d="M2.5 16L3.5 5L7 7.5L12 2L17 7.5L20.5 5L21.5 16H2.5Z" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M3 16H21V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V16Z" stroke="hsl(var(--accent))" strokeWidth="2"/>
            <circle cx="12" cy="9" r="1.5" fill="hsl(var(--accent))"/>
            <circle cx="7" cy="11" r="1.5" fill="hsl(var(--accent))"/>
            <circle cx="17" cy="11" r="1.5" fill="hsl(var(--accent))"/>
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

  // Accessibility labels
  const getAriaLabel = () => {
    switch (type) {
      case 'rank':
        return `${t('hexagon.rank')}: ${value}`;
      case 'coins':
        return `${t('hexagon.coins')}: ${value}`;
      case 'lives':
        return `${t('hexagon.lives')}: ${value}`;
      default:
        return '';
    }
  };

  // Render blue hexagon SVG for rank type
  if (type === 'rank') {
    return (
      <div className={`relative ${className}`} role="status" aria-label={getAriaLabel()}>
        {/* Blue Hexagon SVG - sized to match other hexagons exactly */}
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24">
          <svg 
            viewBox="22.53058 -47.5814116 672.82399 167.3667432"
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            shapeRendering="geometricPrecision"
            colorInterpolationFilters="sRGB"
          >
            <defs>
              <path id="HEX" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>
              <linearGradient id="chromeGrad" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f8fbff"/>
                <stop offset="10%" stopColor="#c6ccd3"/>
                <stop offset="22%" stopColor="#ffffff"/>
                <stop offset="40%" stopColor="#9ea6b0"/>
                <stop offset="58%" stopColor="#e7ebf0"/>
                <stop offset="78%" stopColor="#bfc6cf"/>
                <stop offset="100%" stopColor="#ffffff"/>
              </linearGradient>
              <linearGradient id="band20" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#BFE0FF"/>
                <stop offset="35%" stopColor="#2196F3"/>
                <stop offset="100%" stopColor="#0B5DB8"/>
              </linearGradient>
              <linearGradient id="band5" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E6F2FF"/>
                <stop offset="50%" stopColor="#5AB6FF"/>
                <stop offset="100%" stopColor="#1E74D6"/>
              </linearGradient>
              <filter id="pro3d" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
                <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
              </filter>
              <mask id="maskOuterOnly" maskUnits="userSpaceOnUse">
                <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
                <use href="#HEX" stroke="white" strokeWidth="2" fill="none"/>
                <use href="#HEX" stroke="black" strokeWidth="22" fill="none"/>
              </mask>
            </defs>
            
            <use href="#HEX" fill="url(#band20)" stroke="url(#band20)" strokeWidth="20"/>
            <use href="#HEX" stroke="url(#band5)" strokeWidth="5" fill="none"/>
            <use href="#HEX" stroke="url(#chromeGrad)" strokeWidth="2" fill="none" mask="url(#maskOuterOnly)"/>
            <g filter="url(#pro3d)">
              <use href="#HEX" fill="none" stroke="none"/>
            </g>
          </svg>
          
          {/* Content (Crown + Rank number) - positioned on top of SVG */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            {renderIcon()}
            <span className="text-white text-[10px] sm:text-xs md:text-sm lg:text-base font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {value}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Original hexagon design for coins and lives
  return (
    <div className={`relative ${className}`} role="status" aria-label={getAriaLabel()}>
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
          style={{ boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15)' }}
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
            boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.15)',
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
            background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)',
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
            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.125)',
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
