import React from 'react';

interface LootboxNotificationBannerProps {
  countdown: number;
  className?: string;
}

/**
 * Lootbox notification banner using inline SVG (red hex button)
 * Displays Hungarian text with countdown
 */
export const LootboxNotificationBanner: React.FC<LootboxNotificationBannerProps> = ({
  countdown,
  className = '',
}) => {
  return (
    <div
      className={`relative transition-all ${className}`}
      style={{
        width: 'clamp(180px, 45vw, 240px)',
        height: 'clamp(60px, 15vw, 80px)',
      }}
    >
      {/* Red hex button SVG - inline for maximum quality */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="22.53058 -47.5814116 672.82399 167.3667432"
        fill="none"
        shapeRendering="geometricPrecision"
        colorInterpolationFilters="sRGB"
        className="absolute w-full h-full"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter:
            'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.6))',
        }}
        aria-hidden
      >
        <defs>
          <path
            id="HEX"
            d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"
          />

          <linearGradient
            id="chromeGrad"
            x1="0"
            y1="-47.58"
            x2="0"
            y2="119.78"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#f8fbff" />
            <stop offset="10%" stopColor="#c6ccd3" />
            <stop offset="22%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#9ea6b0" />
            <stop offset="58%" stopColor="#e7ebf0" />
            <stop offset="78%" stopColor="#bfc6cf" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <linearGradient
            id="band20"
            x1="0"
            y1="-47.58"
            x2="0"
            y2="119.78"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFD6D6" />
            <stop offset="35%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          <linearGradient
            id="band5"
            x1="0"
            y1="-47.58"
            x2="0"
            y2="119.78"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFE5E5" />
            <stop offset="50%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <filter id="pro3d" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="1.2"
              stdDeviation="1.2"
              floodColor="rgba(0,0,0,0.35)"
            />
            <feDropShadow
              dx="0"
              dy="-0.6"
              stdDeviation="0.7"
              floodColor="rgba(255,255,255,0.35)"
            />
          </filter>

          <mask id="maskOuterOnly" maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black" />
            <use href="#HEX" stroke="white" strokeWidth="2" fill="none" />
            <use href="#HEX" stroke="black" strokeWidth="25" fill="none" />
          </mask>
        </defs>

        <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

        <g transform="scale(1,1.2)">
          <use href="#HEX" fill="black" fillOpacity="0.5" />

          <use
            href="#HEX"
            fill="none"
            stroke="url(#band20)"
            strokeWidth="20"
            strokeLinejoin="miter"
            strokeMiterlimit="200"
            strokeLinecap="butt"
            filter="url(#pro3d)"
            vectorEffect="non-scaling-stroke"
          />

          <use
            href="#HEX"
            fill="none"
            stroke="url(#band5)"
            strokeWidth="5"
            strokeLinejoin="miter"
            strokeMiterlimit="200"
            strokeLinecap="butt"
            filter="url(#pro3d)"
            vectorEffect="non-scaling-stroke"
          />

          <g mask="url(#maskOuterOnly)">
            <use
              href="#HEX"
              fill="none"
              stroke="url(#chromeGrad)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </g>
      </svg>

      {/* Content - Two-line text + countdown */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-2">
        <div
          className="text-white font-black text-center leading-tight"
          style={{
            fontSize: 'clamp(0.65rem, 2.5vw, 0.875rem)',
            textShadow:
              '0 0 6px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)',
          }}
        >
          <div>Ajándék érkezett, fogadd el,</div>
          <div className="mt-0.5">
            mielőtt elvész: <span className="font-extrabold">{countdown}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
