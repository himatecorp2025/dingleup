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
    <div className={`relative ${className}`} style={{ minWidth: '320px', minHeight: '100px' }}>
      {/* Blue Info SVG Background Container - Inline SVG */}
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="22.53058 -47.5814116 1000 300"
        fill="none"
        shapeRendering="geometricPrecision"
        colorInterpolationFilters="sRGB"
        className="absolute pointer-events-none"
        style={{
          width: '100%',
          height: '385%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -54%)',
          zIndex: 0
        }}
        aria-hidden
      >
        <defs>
          <path id="HEX" d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"/>

          <linearGradient id="bg_5" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#191534"/>
            <stop offset="100%" stopColor="#0e0b1c"/>
          </linearGradient>

          <linearGradient id="chromeGrad_5" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fbff"/>
            <stop offset="10%" stopColor="#c6ccd3"/>
            <stop offset="22%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#9ea6b0"/>
            <stop offset="58%" stopColor="#e7ebf0"/>
            <stop offset="78%" stopColor="#bfc6cf"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>

          <linearGradient id="band20_5" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BFE0FF"/>
            <stop offset="35%" stopColor="#2196F3"/>
            <stop offset="100%" stopColor="#0B5DB8"/>
          </linearGradient>

          <linearGradient id="band5_5" x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E6F2FF"/>
            <stop offset="50%" stopColor="#5AB6FF"/>
            <stop offset="100%" stopColor="#1E74D6"/>
          </linearGradient>

          <filter id="pro3d_5" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
            <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
          </filter>

          <mask id="maskOuterOnly_5" maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
            <use href="#HEX" stroke="white" strokeWidth="2" fill="none"/>
            <use href="#HEX" stroke="black" strokeWidth="25" fill="none"/>
          </mask>
        </defs>

        <rect x="-10000" y="-10000" width="30000" height="30000" fill="none" />

        <g transform="scale(1.5,3)">
          <use href="#HEX" fill="black" fillOpacity="0.5"/>

          <use href="#HEX" fill="none" stroke="url(#band20_5)" strokeWidth="20"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_5)"
               vectorEffect="non-scaling-stroke"/>

          <use href="#HEX" fill="none" stroke="url(#band5_5)" strokeWidth="5"
               strokeLinejoin="miter" strokeMiterlimit="200" strokeLinecap="butt" filter="url(#pro3d_5)"
               vectorEffect="non-scaling-stroke"/>

          <g mask="url(#maskOuterOnly_5)">
            <use href="#HEX" fill="none" stroke="url(#chromeGrad_5)" strokeWidth="2"
                 strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          </g>
        </g>
      </svg>

      {/* Rank Hexagon - Blue */}
      <div className="absolute z-10" style={{ left: '21%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon type="rank" value={rank !== null ? rank : '...'} />
      </div>

      {/* Coins Hexagon - Gold */}
      <div className="absolute z-10" style={{ left: '41%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon type="coins" value={coins} />
      </div>

      {/* Lives Hexagon - Red */}
      <div className="absolute z-10" style={{ left: '61%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon type="lives" value={lives} />
      </div>

      {/* Avatar Hexagon - Purple */}
      <div className="absolute z-10" style={{ left: '81%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <DiamondHexagon 
          type="avatar" 
          value={username} 
          avatarUrl={avatarUrl}
          onClick={() => navigate('/profile')}
        />
      </div>
    </div>
  );
};
