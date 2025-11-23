interface DiamondIcon3DProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const DiamondIcon3D = ({ className = "", size = 32, style }: DiamondIcon3DProps) => {
  return (
    <svg 
      width={size * 2} 
      height={size} 
      viewBox="0 0 64 64" 
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Ultra realistic diamond gradients */}
        <linearGradient id="ultraDiamondLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fdf2f8" />
          <stop offset="20%" stopColor="#fce7f3" />
          <stop offset="40%" stopColor="#fbcfe8" />
          <stop offset="60%" stopColor="#f9a8d4" />
          <stop offset="80%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        
        <linearGradient id="ultraDiamondRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fdf2f8" />
          <stop offset="25%" stopColor="#fce7f3" />
          <stop offset="50%" stopColor="#f9a8d4" />
          <stop offset="75%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        
        <linearGradient id="ultraDiamondCenter" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="50%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </linearGradient>
        
        {/* Ultra shine with layers */}
        <radialGradient id="ultraDiamondShine" cx="50%" cy="25%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="30%" stopColor="#fdf2f8" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#fce7f3" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        
        {/* Multiple filters for depth */}
        <filter id="ultraDiamondShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="ultraDiamondGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="innerDiamondGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer glow layers */}
      <path
        d="M 32 7 L 49 25 L 32 57 L 15 25 Z"
        fill="#ec4899"
        opacity="0.5"
        filter="blur(10px)"
      />
      <path
        d="M 32 8 L 48 24 L 32 56 L 16 24 Z"
        fill="#f472b6"
        opacity="0.4"
        filter="blur(8px)"
      />
      
      {/* 3D depth shadow layer */}
      <path
        d="M 32 11 L 45 27 L 32 55 L 19 27 Z"
        fill="#be185d"
        opacity="0.7"
      />
      
      {/* Main left facet with ultra gradient */}
      <path
        d="M 32 10 L 18 26 L 32 54 Z"
        fill="url(#ultraDiamondLeft)"
        filter="url(#ultraDiamondShadow)"
      />
      
      {/* Main right facet with ultra gradient */}
      <path
        d="M 32 10 L 46 26 L 32 54 Z"
        fill="url(#ultraDiamondRight)"
        filter="url(#ultraDiamondShadow)"
      />
      
      {/* Top facet (table) with ultra detail */}
      <path
        d="M 32 10 L 46 26 L 32 32 L 18 26 Z"
        fill="url(#ultraDiamondCenter)"
        opacity="0.95"
        filter="url(#innerDiamondGlow)"
      />
      
      {/* Multiple inner facets for extreme depth */}
      <path d="M 32 10 L 24 20 L 32 32 Z" fill="#fce7f3" opacity="0.7" />
      <path d="M 32 10 L 40 20 L 32 32 Z" fill="#f9a8d4" opacity="0.75" />
      <path d="M 32 32 L 24 20 L 18 26 Z" fill="#ec4899" opacity="0.6" />
      <path d="M 32 32 L 40 20 L 46 26 Z" fill="#f472b6" opacity="0.65" />
      
      {/* Bottom inner facets */}
      <path d="M 32 32 L 18 26 L 25 40 Z" fill="#be185d" opacity="0.5" />
      <path d="M 32 32 L 46 26 L 39 40 Z" fill="#db2777" opacity="0.55" />
      <path d="M 32 54 L 25 40 L 32 32 Z" fill="#9f1239" opacity="0.6" />
      <path d="M 32 54 L 39 40 L 32 32 Z" fill="#be185d" opacity="0.65" />
      
      {/* Ultra bright shine overlay (main) */}
      <ellipse
        cx="32"
        cy="16"
        rx="12"
        ry="10"
        fill="url(#ultraDiamondShine)"
        filter="url(#ultraDiamondGlow)"
      />
      
      {/* Multiple sparkle spots */}
      <circle cx="27" cy="14" r="4" fill="#ffffff" opacity="0.95" filter="blur(1px)" />
      <circle cx="30" cy="16" r="3" fill="#fdf2f8" opacity="0.9" />
      <circle cx="33" cy="18" r="2" fill="#ffffff" opacity="0.85" />
      <circle cx="37" cy="20" r="2.5" fill="#fce7f3" opacity="0.75" />
      
      {/* Secondary sparkles */}
      <circle cx="25" cy="28" r="1.5" fill="#fce7f3" opacity="0.6" />
      <circle cx="39" cy="28" r="1.5" fill="#ffffff" opacity="0.65" />
      <circle cx="32" cy="40" r="2" fill="#fbcfe8" opacity="0.5" />
      
      {/* Edge highlights for 3D crystal effect */}
      <path
        d="M 32 10 L 18 26"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        opacity="0.7"
        strokeLinecap="round"
      />
      <path
        d="M 32 10 L 46 26"
        fill="none"
        stroke="#fdf2f8"
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
      />
      <path
        d="M 32 32 L 32 54"
        fill="none"
        stroke="#db2777"
        strokeWidth="1"
        opacity="0.5"
        strokeLinecap="round"
      />
      
      {/* Refraction lines inside */}
      <path d="M 25 20 L 32 32" fill="none" stroke="#fce7f3" strokeWidth="0.5" opacity="0.4" />
      <path d="M 39 20 L 32 32" fill="none" stroke="#f9a8d4" strokeWidth="0.5" opacity="0.4" />
      <path d="M 25 40 L 32 32" fill="none" stroke="#be185d" strokeWidth="0.5" opacity="0.3" />
      <path d="M 39 40 L 32 32" fill="none" stroke="#db2777" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
};
