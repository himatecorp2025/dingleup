import React, { ReactNode } from 'react';

interface TimerButtonProps {
  children: ReactNode;
  className?: string;
}

/**
 * Timer Button with inline SVG background (golden hexagon)
 * 25% horizontal size, 50% vertical size compared to original
 */
export const TimerButton: React.FC<TimerButtonProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`relative ${className}`}
      style={{
        width: 'clamp(45px, 12vw, 65px)', // 25% of original (180-260px)
        height: 'clamp(22.5px, 6vw, 32.5px)', // 50% of original height
      }}
    >
      {/* Inline SVG Background - Golden Hexagon */}
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
          transform: 'translate(-50%, -50%)',
          filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.9)) drop-shadow(0 0 12px rgba(234, 179, 8, 0.6))',
        }}
        aria-hidden
      >
        <defs>
          <path id="HEX_TIMER" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>

          <linearGradient id="bg_timer" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#191534"/>
            <stop offset="100%" stopColor="#0e0b1c"/>
          </linearGradient>

          <linearGradient id="chromeGrad_timer" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fbff"/>
            <stop offset="10%" stopColor="#c6ccd3"/>
            <stop offset="22%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#9ea6b0"/>
            <stop offset="58%" stopColor="#e7ebf0"/>
            <stop offset="78%" stopColor="#bfc6cf"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>

          <linearGradient id="band20_timer" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF4CC"/>
            <stop offset="35%" stopColor="#F6C453"/>
            <stop offset="100%" stopColor="#B45309"/>
          </linearGradient>

          <linearGradient id="band5_timer" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFAE6"/>
            <stop offset="50%" stopColor="#F6D365"/>
            <stop offset="100%" stopColor="#CA8A04"/>
          </linearGradient>

          <filter id="pro3d_timer" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
            <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
          </filter>

          <mask id="maskOuterOnly_timer" maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
            <use href="#HEX_TIMER" stroke="white" strokeWidth="2" fill="none"/>
            <use href="#HEX_TIMER" stroke="black" strokeWidth="25" fill="none"/>
          </mask>
        </defs>

        <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

        <g transform="scale(1,1.2)">
          <use href="#HEX_TIMER" fill="black" fillOpacity="0.5"/>

          <use href="#HEX_TIMER" fill="none" stroke="url(#band20_timer)" strokeWidth="20"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_timer)"
               vectorEffect="non-scaling-stroke"/>

          <use href="#HEX_TIMER" fill="none" stroke="url(#band5_timer)" strokeWidth="5"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_timer)"
               vectorEffect="non-scaling-stroke"/>

          <g mask="url(#maskOuterOnly_timer)">
            <use href="#HEX_TIMER" fill="none" stroke="url(#chromeGrad_timer)" strokeWidth="2"
                 strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          </g>
        </g>
      </svg>

      {/* Content - Absolutely centered */}
      <div className="absolute inset-0 z-10 flex items-center justify-center m-0 p-0 bg-transparent">
        <div className="flex items-center justify-center m-0 p-0 gap-0 leading-none [background:transparent]">
          {children}
        </div>
      </div>
    </div>
  );
};
