interface CoinIcon3DProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const CoinIcon3D = ({ className = "", size = 32, style }: CoinIcon3DProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Ultra realistic gold gradient */}
        <radialGradient id="ultraGoldGradient" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="15%" stopColor="#fef3c7" />
          <stop offset="35%" stopColor="#fde047" />
          <stop offset="55%" stopColor="#facc15" />
          <stop offset="75%" stopColor="#eab308" />
          <stop offset="90%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#a16207" />
        </radialGradient>
        
        {/* Ultra shine overlay */}
        <radialGradient id="ultraCoinShine" cx="30%" cy="25%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="20%" stopColor="#fffbeb" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#fef3c7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        
        {/* Edge depth gradient */}
        <linearGradient id="ultraCoinEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        
        {/* Multiple shadow layers */}
        <filter id="ultraCoinShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="4" result="offsetblur1" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.6" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="innerGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer shadow (drop shadow) */}
      <ellipse
        cx="32"
        cy="36"
        rx="26"
        ry="26"
        fill="#854d0e"
        opacity="0.5"
        filter="blur(8px)"
      />
      
      {/* 3D Edge depth layers */}
      <ellipse cx="32" cy="33" rx="27" ry="27" fill="#92400e" opacity="0.8" />
      <ellipse cx="32" cy="32.5" rx="26.5" ry="26.5" fill="#b45309" opacity="0.9" />
      <ellipse cx="32" cy="32" rx="26" ry="26" fill="url(#ultraCoinEdge)" filter="url(#ultraCoinShadow)" />
      
      {/* Main coin face with ultra gradient */}
      <circle
        cx="32"
        cy="31"
        r="24"
        fill="url(#ultraGoldGradient)"
        filter="url(#innerGlow)"
      />
      
      {/* Multiple concentric rings for depth */}
      <circle cx="32" cy="31" r="22" fill="none" stroke="#ca8a04" strokeWidth="0.5" opacity="0.4" />
      <circle cx="32" cy="31" r="20" fill="none" stroke="#a16207" strokeWidth="0.3" opacity="0.3" />
      <circle cx="32" cy="31" r="18" fill="none" stroke="#92400e" strokeWidth="0.2" opacity="0.2" />
      
      {/* Inner decoration circle */}
      <circle
        cx="32"
        cy="31"
        r="16"
        fill="none"
        stroke="#ca8a04"
        strokeWidth="1.5"
        opacity="0.5"
      />
      
      {/* Currency symbol or decoration with depth */}
      <text
        x="32"
        y="39"
        fontSize="32"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        fill="#92400e"
        textAnchor="middle"
        opacity="0.7"
        filter="url(#innerGlow)"
      >
        G
      </text>
      
      {/* Highlight text overlay */}
      <text
        x="32"
        y="38"
        fontSize="32"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        fill="#fef3c7"
        textAnchor="middle"
        opacity="0.3"
      >
        G
      </text>
      
      {/* Ultra bright shine overlay (main) */}
      <ellipse
        cx="22"
        cy="21"
        rx="14"
        ry="16"
        fill="url(#ultraCoinShine)"
        filter="url(#innerGlow)"
      />
      
      {/* Specular highlight spots */}
      <ellipse cx="24" cy="20" rx="7" ry="8" fill="#ffffff" opacity="0.95" filter="blur(1px)" />
      <ellipse cx="26" cy="22" rx="4" ry="5" fill="#fffbeb" opacity="0.8" />
      <circle cx="28" cy="24" r="2" fill="#ffffff" opacity="0.7" />
      
      {/* Secondary shine spot */}
      <ellipse cx="40" cy="28" rx="3" ry="4" fill="#fef3c7" opacity="0.5" />
      <ellipse cx="38" cy="38" rx="2" ry="3" fill="#fde047" opacity="0.3" />
      
      {/* Edge highlights and shadows for 3D effect */}
      <path
        d="M 10 28 Q 10 18, 18 12"
        fill="none"
        stroke="#fef3c7"
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
      />
      <path
        d="M 54 28 Q 54 18, 46 12"
        fill="none"
        stroke="#78350f"
        strokeWidth="1.5"
        opacity="0.5"
        strokeLinecap="round"
      />
      
      {/* Bottom shadow curve */}
      <path
        d="M 14 40 Q 32 46, 50 40"
        fill="none"
        stroke="#92400e"
        strokeWidth="2"
        opacity="0.4"
        strokeLinecap="round"
      />
    </svg>
  );
};
