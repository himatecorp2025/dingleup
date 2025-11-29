import React from 'react';

interface LootboxNotificationBannerProps {
  countdown: number;
  className?: string;
}

/**
 * Lootbox notification banner using Play Now button SVG shape
 * Red variant with white text, displays countdown
 */
export const LootboxNotificationBanner: React.FC<LootboxNotificationBannerProps> = ({
  countdown,
  className = '',
}) => {
  return (
    <div
      className={`relative transition-all animate-fade-in ${className}`}
      style={{
        width: '100%',
        maxWidth: 'clamp(180px, 45vw, 240px)', // Max width = Lives + Profile hexagons combined
        height: 'clamp(60px, 15vw, 80px)',
      }}
    >
      {/* Inline SVG Background - RED variant */}
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="22.53058 -47.5814116 672.82399 167.3667432"
        fill="none"
        shapeRendering="geometricPrecision"
        colorInterpolationFilters="sRGB"
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1.25, 1.5)',
          filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.6))',
        }}
        aria-hidden
      >
        <defs>
          <path id="HEX_RED" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>

          <linearGradient id="chromeGrad_red" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fbff"/>
            <stop offset="10%" stopColor="#c6ccd3"/>
            <stop offset="22%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#9ea6b0"/>
            <stop offset="58%" stopColor="#e7ebf0"/>
            <stop offset="78%" stopColor="#bfc6cf"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>

          <linearGradient id="band20_red" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fca5a5"/>
            <stop offset="35%" stopColor="#ef4444"/>
            <stop offset="100%" stopColor="#991b1b"/>
          </linearGradient>

          <linearGradient id="band5_red" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fee2e2"/>
            <stop offset="50%" stopColor="#f87171"/>
            <stop offset="100%" stopColor="#b91c1c"/>
          </linearGradient>

          <filter id="pro3d_red" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
            <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
          </filter>

          <mask id="maskOuterOnly_red" maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
            <use href="#HEX_RED" stroke="white" strokeWidth="2" fill="none"/>
            <use href="#HEX_RED" stroke="black" strokeWidth="25" fill="none"/>
          </mask>
        </defs>

        <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

        <g transform="scale(1,1.2)">
          <use href="#HEX_RED" fill="black" fillOpacity="0.5"/>

          <use href="#HEX_RED" fill="none" stroke="url(#band20_red)" strokeWidth="20"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_red)"
               vectorEffect="non-scaling-stroke"/>

          <use href="#HEX_RED" fill="none" stroke="url(#band5_red)" strokeWidth="5"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_red)"
               vectorEffect="non-scaling-stroke"/>

          <g mask="url(#maskOuterOnly_red)">
            <use href="#HEX_RED" fill="none" stroke="url(#chromeGrad_red)" strokeWidth="2"
                 strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          </g>
        </g>
      </svg>

      {/* Content - Two-line text + countdown */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-2">
        <div
          className="text-white font-black text-center leading-tight"
          style={{
            fontSize: 'clamp(0.65rem, 2.5vw, 0.875rem)',
            textShadow: '0 0 6px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)',
          }}
        >
          <div>Ajándékod érkezik, vedd át!</div>
          <div className="mt-0.5">
            mielőtt elvész: <span className="font-extrabold">{countdown}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
