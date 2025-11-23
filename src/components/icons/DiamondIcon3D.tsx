interface DiamondIcon3DProps {
  className?: string;
  size?: number;
}

export const DiamondIcon3D = ({ className = "", size = 32 }: DiamondIcon3DProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="diamondGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="30%" stopColor="#fbcfe8" />
          <stop offset="70%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="diamondGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="50%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <radialGradient id="diamondShine" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="50%" stopColor="#fce7f3" stopOpacity="0.7" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="diamondShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="3" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="diamondGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer glow */}
      <path
        d="M 32 8 L 48 24 L 32 56 L 16 24 Z"
        fill="#ec4899"
        opacity="0.3"
        filter="blur(6px)"
      />
      
      {/* Left facet */}
      <path
        d="M 32 10 L 18 26 L 32 54 Z"
        fill="url(#diamondGradient1)"
        filter="url(#diamondShadow)"
      />
      
      {/* Right facet */}
      <path
        d="M 32 10 L 46 26 L 32 54 Z"
        fill="url(#diamondGradient2)"
        filter="url(#diamondShadow)"
      />
      
      {/* Top facet */}
      <path
        d="M 32 10 L 46 26 L 32 32 L 18 26 Z"
        fill="#fce7f3"
        opacity="0.9"
      />
      
      {/* Inner facets for depth */}
      <path
        d="M 32 10 L 25 22 L 32 32 Z"
        fill="#fbcfe8"
        opacity="0.6"
      />
      <path
        d="M 32 10 L 39 22 L 32 32 Z"
        fill="#f9a8d4"
        opacity="0.7"
      />
      
      {/* Shine overlay */}
      <ellipse
        cx="32"
        cy="18"
        rx="10"
        ry="8"
        fill="url(#diamondShine)"
        filter="url(#diamondGlow)"
      />
      
      {/* Bright sparkle */}
      <circle
        cx="28"
        cy="16"
        r="3"
        fill="#ffffff"
        opacity="0.9"
      />
      <circle
        cx="36"
        cy="20"
        r="2"
        fill="#ffffff"
        opacity="0.7"
      />
      
      {/* Edge highlights */}
      <path
        d="M 32 10 L 18 26"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M 32 10 L 46 26"
        fill="none"
        stroke="#fce7f3"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
};
