import React, { ReactNode } from 'react';

interface PlayNowButtonProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Play Now Button with inline SVG background
 * Maintains text and icon content while displaying SVG button background
 */
export const PlayNowButton: React.FC<PlayNowButtonProps> = ({
  onClick,
  children,
  className = '',
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={`relative w-full transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
      } ${className}`}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        height: '80px',
        animation: 'pulse-button 3s ease-in-out infinite',
      }}
    >
      {/* Inline SVG Background */}
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="22.53058 -47.5814116 672.82399 167.3667432"
        fill="none"
        shapeRendering="geometricPrecision"
        colorInterpolationFilters="sRGB"
        className="absolute pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1.25, 1.5)',
          filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.9)) drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))',
        }}
        aria-hidden
      >
        <defs>
          <path id="HEX" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>

          <linearGradient id="bg" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#191534"/>
            <stop offset="100%" stopColor="#0e0b1c"/>
          </linearGradient>

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
            <stop offset="0%" stopColor="#D5FFD6"/>
            <stop offset="35%" stopColor="#22C55E"/>
            <stop offset="100%" stopColor="#065F46"/>
          </linearGradient>

          <linearGradient id="band5" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E9FFEA"/>
            <stop offset="50%" stopColor="#4ADE80"/>
            <stop offset="100%" stopColor="#047857"/>
          </linearGradient>

          <filter id="pro3d" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
            <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
          </filter>

          <mask id="maskOuterOnly" maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
            <use href="#HEX" stroke="white" strokeWidth="2" fill="none"/>
            <use href="#HEX" stroke="black" strokeWidth="25" fill="none"/>
          </mask>
        </defs>

        <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

        <g transform="scale(1,1.2)">
          <use href="#HEX" fill="black" fillOpacity="0.5"/>

          <use href="#HEX" fill="none" stroke="url(#band20)" strokeWidth="20"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d)"
               vectorEffect="non-scaling-stroke"/>

          <use href="#HEX" fill="none" stroke="url(#band5)" strokeWidth="5"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d)"
               vectorEffect="non-scaling-stroke"/>

          <g mask="url(#maskOuterOnly)">
            <use href="#HEX" fill="none" stroke="url(#chromeGrad)" strokeWidth="2"
                 strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          </g>
        </g>
      </svg>

      {/* Content (Text + Icon) - Absolutely centered */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-foreground font-black text-base sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes pulse-button {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }
      `}</style>
    </button>
  );
};
