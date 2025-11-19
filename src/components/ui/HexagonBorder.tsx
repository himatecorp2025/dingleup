import React from 'react';

interface HexagonBorderProps {
  width?: number;
  height?: number;
  className?: string;
  children?: React.ReactNode;
}

export const HexagonBorder: React.FC<HexagonBorderProps> = ({ 
  width = 673, 
  height = 167,
  className = "",
  children 
}) => {
  // Unique ID prefix for this instance to avoid conflicts
  const id = React.useId();
  
  return (
    <div className={`relative inline-block ${className}`} style={{ width, height }}>
      <svg 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="22.53058 -47.5814116 672.82399 167.3667432"
        fill="none"
        shapeRendering="geometricPrecision"
        colorInterpolationFilters="sRGB"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <path 
            id={`${id}-HEX`} 
            d="M 592.82399,0 h -467.76283 c -23.80302,0 -36.4576,36.10205 -62.53058,36.10196 26.07298,-9e-5 38.72756,36.10196 62.53058,36.10196 h 467.76283 c 23.80302,0 36.4576,-36.10205 62.53058,-36.10196 -26.07298,9e-5 -38.72756,-36.10196 -62.53058,-36.10196 z"
          />

          {/* Chrome gradient for outer border */}
          <linearGradient id={`${id}-chromeGrad`} x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fbff"/>
            <stop offset="10%" stopColor="#c6ccd3"/>
            <stop offset="22%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#9ea6b0"/>
            <stop offset="58%" stopColor="#e7ebf0"/>
            <stop offset="78%" stopColor="#bfc6cf"/>
            <stop offset="100%" stopColor="#ffffff"/>
          </linearGradient>

          {/* Main band gradient - gold colors */}
          <linearGradient id={`${id}-band20`} x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF4CC"/>
            <stop offset="35%" stopColor="#F6C453"/>
            <stop offset="100%" stopColor="#B45309"/>
          </linearGradient>

          {/* Middle band gradient - lighter gold */}
          <linearGradient id={`${id}-band5`} x1="0" y1="-47.58" x2="0" y2="119.78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFAE6"/>
            <stop offset="50%" stopColor="#F6D365"/>
            <stop offset="100%" stopColor="#CA8A04"/>
          </linearGradient>

          {/* 3D depth effect */}
          <filter id={`${id}-pro3d`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="rgba(0,0,0,0.35)"/>
            <feDropShadow dx="0" dy="-0.6" stdDeviation="0.7" floodColor="rgba(255,255,255,0.35)"/>
          </filter>

          {/* Mask for outer chrome border */}
          <mask id={`${id}-maskOuterOnly`} maskUnits="userSpaceOnUse">
            <rect x="-9999" y="-9999" width="20000" height="20000" fill="black"/>
            <use href={`#${id}-HEX`} stroke="white" strokeWidth="2" fill="none"/>
            <use href={`#${id}-HEX`} stroke="black" strokeWidth="25" fill="none"/>
          </mask>
        </defs>

        {/* 20px colored band */}
        <use 
          href={`#${id}-HEX`} 
          fill="none" 
          stroke={`url(#${id}-band20)`} 
          strokeWidth="20"
          strokeLinejoin="miter" 
          strokeMiterlimit="200" 
          strokeLinecap="butt" 
          filter={`url(#${id}-pro3d)`}
          vectorEffect="non-scaling-stroke"
        />

        {/* 5px colored band */}
        <use 
          href={`#${id}-HEX`} 
          fill="none" 
          stroke={`url(#${id}-band5)`} 
          strokeWidth="5"
          strokeLinejoin="miter" 
          strokeMiterlimit="200" 
          strokeLinecap="butt" 
          filter={`url(#${id}-pro3d)`}
          vectorEffect="non-scaling-stroke"
        />

        {/* 2px chrome outer border */}
        <g mask={`url(#${id}-maskOuterOnly)`}>
          <use 
            href={`#${id}-HEX`} 
            fill="none" 
            stroke={`url(#${id}-chromeGrad)`} 
            strokeWidth="2"
            strokeLinejoin="round" 
            strokeLinecap="round" 
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
      
      {/* Content overlay */}
      {children && (
        <div className="relative z-10 flex items-center justify-center h-full px-8">
          {children}
        </div>
      )}
    </div>
  );
};
