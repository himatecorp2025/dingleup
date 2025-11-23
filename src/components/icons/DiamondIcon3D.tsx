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
        <linearGradient id="diamondFacet1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="diamondFacet2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="50%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="diamondFacet3" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        <radialGradient id="diamondCore" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#dbeafe" stopOpacity="0.7" />
          <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </radialGradient>
        <filter id="diamondGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="innerShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer glow effect */}
      <ellipse
        cx="32"
        cy="32"
        rx="28"
        ry="28"
        fill="#3b82f6"
        opacity="0.2"
        filter="blur(8px)"
      />
      
      {/* Bottom facets - darker sides */}
      <path
        d="M 32 12 L 18 28 L 32 52 Z"
        fill="url(#diamondFacet2)"
        opacity="0.85"
      />
      <path
        d="M 32 12 L 46 28 L 32 52 Z"
        fill="url(#diamondFacet1)"
        opacity="0.9"
      />
      
      {/* Middle belt facets */}
      <path
        d="M 18 28 L 12 32 L 32 52 Z"
        fill="#7dd3fc"
        opacity="0.75"
      />
      <path
        d="M 46 28 L 52 32 L 32 52 Z"
        fill="#38bdf8"
        opacity="0.8"
      />
      
      {/* Top crown facets */}
      <path
        d="M 32 12 L 18 28 L 26 28 Z"
        fill="url(#diamondFacet3)"
        opacity="0.95"
      />
      <path
        d="M 32 12 L 46 28 L 38 28 Z"
        fill="url(#diamondFacet3)"
        opacity="0.9"
      />
      <path
        d="M 32 12 L 26 28 L 38 28 Z"
        fill="#ffffff"
        opacity="0.95"
      />
      
      {/* Table facet (top flat surface) */}
      <polygon
        points="26,28 38,28 42,30 22,30"
        fill="#f0f9ff"
        opacity="0.95"
      />
      
      {/* Center refraction core */}
      <ellipse
        cx="32"
        cy="30"
        rx="12"
        ry="10"
        fill="url(#diamondCore)"
        filter="url(#diamondGlow)"
      />
      
      {/* Sparkle highlights */}
      <circle cx="28" cy="18" r="2.5" fill="#ffffff" opacity="0.95">
        <animate attributeName="opacity" values="0.95;0.6;0.95" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="36" cy="22" r="1.5" fill="#ffffff" opacity="0.85">
        <animate attributeName="opacity" values="0.85;0.5;0.85" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="30" cy="35" r="1.2" fill="#dbeafe" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3s" repeatCount="indefinite"/>
      </circle>
      
      {/* Edge highlights for definition */}
      <path
        d="M 32 12 L 18 28"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <path
        d="M 32 12 L 46 28"
        fill="none"
        stroke="#f0f9ff"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d="M 18 28 L 32 52"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="0.5"
        opacity="0.4"
      />
    </svg>
  );
};
