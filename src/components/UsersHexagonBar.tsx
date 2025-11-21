import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DiamondHexagon } from './DiamondHexagon';

interface UsersHexagonBarProps {
  username: string;
  rank: number | null;
  coins: number;
  lives: number;
  avatarUrl?: string | null;
  className?: string;
}

/**
 * Users hexagon bar component
 * Purple SVG background container with 4 hexagons positioned inside:
 * - Blue hexagon (rank)
 * - Gold hexagon (coins)
 * - Red hexagon (lives)
 * - Purple hexagon (avatar)
 */
export const UsersHexagonBar: React.FC<UsersHexagonBarProps> = ({
  username,
  rank,
  coins,
  lives,
  avatarUrl,
  className = ''
}) => {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`relative flex items-center gap-1.5 sm:gap-2 ${className}`} style={{ minWidth: '280px', minHeight: '80px' }}>
      {/* Blue SVG Background Container - Inline SVG */}
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="22.53058 -47.5814116 672.82399 167.3667432"
        fill="none"
        shapeRendering="geometricPrecision"
        colorInterpolationFilters="sRGB"
        className="absolute pointer-events-none"
        style={{
          width: '100%',
          height: '200%',
          top: '50%',
          left: '50%',
          transform: 'translate(-55%, -65%)',
          zIndex: 0
        }}
        aria-hidden
      >
        <defs>
          <path id="HEX_INFO" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>

          <linearGradient id="bg_info" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#191534"/>
            <stop offset="100%" stopColor="#0e0b1c"/>
          </linearGradient>

          <linearGradient id="chromeGrad_info" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fbff"/>
            <stop offset="10%" stopColor="#c6ccd3"/>
            <stop offset="22%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#9ea6b0"/>
            <stop offset="58%" stopColor="#e7ebf0"/>
            <stop offset="78%" stopColor="#bfc6cf"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>

          <linearGradient id="band20_info" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BFE0FF"/>
            <stop offset="35%" stopColor="#2196F3"/>
            <stop offset="100%" stopColor="#0B5DB8"/>
          </linearGradient>

          <linearGradient id="band5_info" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E6F2FF"/>
            <stop offset="50%" stopColor="#5AB6FF"/>
            <stop offset="100%" stopColor="#1E74D6"/>
          </linearGradient>

          <filter id="pro3d_info" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
            <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
          </filter>

          <mask id="maskOuterOnly_info" maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
            <use href="#HEX_INFO" stroke="white" strokeWidth="2" fill="none"/>
            <use href="#HEX_INFO" stroke="black" strokeWidth="25" fill="none"/>
          </mask>
        </defs>

        <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

        <g transform="scale(1,1.2)">
          <use href="#HEX_INFO" fill="black" fillOpacity="0.5"/>

          <use href="#HEX_INFO" fill="none" stroke="url(#band20_info)" strokeWidth="20"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_info)"
               vectorEffect="non-scaling-stroke"/>

          <use href="#HEX_INFO" fill="none" stroke="url(#band5_info)" strokeWidth="5"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_info)"
               vectorEffect="non-scaling-stroke"/>

          <g mask="url(#maskOuterOnly_info)">
            <use href="#HEX_INFO" fill="none" stroke="url(#chromeGrad_info)" strokeWidth="2"
                 strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          </g>
        </g>
      </svg>

      {/* Rank Hexagon - Blue */}
      <div className="relative z-10">
        <DiamondHexagon type="rank" value={rank !== null ? rank : '...'} />
      </div>

      {/* Coins Hexagon - Gold */}
      <div className="relative z-10">
        <DiamondHexagon type="coins" value={coins} />
      </div>

      {/* Lives Hexagon - Red */}
      <div className="relative z-10">
        <DiamondHexagon type="lives" value={lives} />
      </div>

      {/* Avatar Hexagon - Purple */}
      <button
        onClick={() => navigate('/profile')}
        className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square hover:scale-105 transition-transform z-10"
      >
        {/* Purple SVG Frame */}
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          viewBox="22.53058 -47.5814116 672.82399 167.3667432"
          fill="none"
          shapeRendering="geometricPrecision"
          colorInterpolationFilters="sRGB"
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 0 }}
          aria-hidden
        >
          <defs>
            <path id="HEX_AVATAR_1" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>
            <linearGradient id="band20_avatar_1" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E8D9FF"/>
              <stop offset="35%" stopColor="#A855F7"/>
              <stop offset="100%" stopColor="#5B21B6"/>
            </linearGradient>
            <linearGradient id="band5_avatar_1" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F3E9FF"/>
              <stop offset="50%" stopColor="#C084FC"/>
              <stop offset="100%" stopColor="#7C3AED"/>
            </linearGradient>
            <linearGradient id="chromeGrad_avatar_1" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f8fbff"/>
              <stop offset="10%" stopColor="#c6ccd3"/>
              <stop offset="22%" stopColor="#ffffff"/>
              <stop offset="40%" stopColor="#9ea6b0"/>
              <stop offset="58%" stopColor="#e7ebf0"/>
              <stop offset="78%" stopColor="#bfc6cf"/>
              <stop offset="100%" stopColor="#ffffff"/>
            </linearGradient>
            <filter id="pro3d_avatar_1" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
              <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
            </filter>
            <mask id="maskOuterOnly_avatar_1" maskUnits="userSpaceOnUse">
              <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
              <use href="#HEX_AVATAR_1" stroke="white" strokeWidth="2" fill="none"/>
              <use href="#HEX_AVATAR_1" stroke="black" strokeWidth="25" fill="none"/>
            </mask>
          </defs>

          <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

          <g transform="scale(1,1.44)">
            <use href="#HEX_AVATAR_1" fill="black" fillOpacity="0.5"/>

            <use href="#HEX_AVATAR_1" fill="none" stroke="url(#band20_avatar_1)" strokeWidth="20"
                 strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_avatar_1)"
                 vectorEffect="non-scaling-stroke"/>

            <use href="#HEX_AVATAR_1" fill="none" stroke="url(#band5_avatar_1)" strokeWidth="5"
                 strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_avatar_1)"
                 vectorEffect="non-scaling-stroke"/>

            <g mask="url(#maskOuterOnly_avatar_1)">
              <use href="#HEX_AVATAR_1" fill="none" stroke="url(#chromeGrad_avatar_1)" strokeWidth="2"
                   strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
            </g>
          </g>
        </svg>

        {/* Avatar Content */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover z-10"
          />
        ) : (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl sm:text-2xl md:text-3xl font-bold text-white z-10">
            {getInitials(username)}
          </span>
        )}
      </button>
    </div>
  );
};
