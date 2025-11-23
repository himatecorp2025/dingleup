interface BellIcon3DProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const BellIcon3D = ({ className = "", size = 32, style }: BellIcon3DProps) => {
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
        {/* Ultra realistic bell gradient */}
        <radialGradient id="ultraBellGradient" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="15%" stopColor="#fde047" />
          <stop offset="35%" stopColor="#facc15" />
          <stop offset="55%" stopColor="#eab308" />
          <stop offset="75%" stopColor="#ca8a04" />
          <stop offset="90%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#854d0e" />
        </radialGradient>
        
        {/* Ultra shine overlay */}
        <radialGradient id="ultraBellShine" cx="30%" cy="25%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="20%" stopColor="#fffbeb" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#fef3c7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        
        {/* Edge depth gradient */}
        <linearGradient id="ultraBellEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        
        {/* Multiple shadow layers */}
        <filter id="ultraBellShadow">
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
        
        <filter id="innerBellGlow">
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
        rx="24"
        ry="24"
        fill="#854d0e"
        opacity="0.5"
        filter="blur(8px)"
      />
      
      {/* 3D Edge depth layers */}
      <path
        d="M 32 12 Q 20 12, 16 20 L 16 38 Q 16 46, 20 48 L 44 48 Q 48 46, 48 38 L 48 20 Q 44 12, 32 12 Z"
        fill="#92400e"
        opacity="0.8"
      />
      
      {/* Main bell body with ultra gradient */}
      <path
        d="M 32 10 Q 19 10, 14 18 L 14 36 Q 14 44, 18 46 L 46 46 Q 50 44, 50 36 L 50 18 Q 45 10, 32 10 Z"
        fill="url(#ultraBellGradient)"
        filter="url(#ultraBellShadow)"
      />
      
      {/* Bell opening (bottom) - darker */}
      <ellipse
        cx="32"
        cy="46"
        rx="16"
        ry="4"
        fill="#78350f"
        opacity="0.8"
      />
      
      {/* Inner bell rim highlight */}
      <ellipse
        cx="32"
        cy="45"
        rx="14"
        ry="3"
        fill="url(#ultraBellEdge)"
        opacity="0.6"
      />
      
      {/* Bell top (crown) */}
      <ellipse
        cx="32"
        cy="10"
        rx="6"
        ry="4"
        fill="url(#ultraBellGradient)"
        filter="url(#innerBellGlow)"
      />
      
      {/* Ultra bright shine overlay (main) */}
      <ellipse
        cx="26"
        cy="18"
        rx="12"
        ry="14"
        fill="url(#ultraBellShine)"
        filter="url(#innerBellGlow)"
      />
      
      {/* Specular highlight spots */}
      <ellipse cx="28" cy="16" rx="6" ry="7" fill="#ffffff" opacity="0.95" filter="blur(1px)" />
      <ellipse cx="30" cy="18" rx="4" ry="5" fill="#fffbeb" opacity="0.8" />
      <circle cx="32" cy="20" r="2" fill="#ffffff" opacity="0.7" />
      
      {/* Secondary shine spot */}
      <ellipse cx="40" cy="24" rx="3" ry="4" fill="#fef3c7" opacity="0.5" />
      <ellipse cx="38" cy="32" rx="2" ry="3" fill="#fde047" opacity="0.3" />
      
      {/* Bell clapper (internal) */}
      <line
        x1="32"
        y1="10"
        x2="32"
        y2="38"
        stroke="#ca8a04"
        strokeWidth="1.5"
        opacity="0.4"
      />
      
      <ellipse
        cx="32"
        cy="40"
        rx="3"
        ry="4"
        fill="#92400e"
        opacity="0.7"
      />
      
      {/* Edge highlights for 3D effect */}
      <path
        d="M 18 20 Q 16 24, 16 32"
        fill="none"
        stroke="#fef3c7"
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
      />
      <path
        d="M 46 20 Q 48 24, 48 32"
        fill="none"
        stroke="#78350f"
        strokeWidth="1.5"
        opacity="0.5"
        strokeLinecap="round"
      />
      
      {/* Contour lines for depth */}
      <path
        d="M 22 14 Q 28 12, 32 12 Q 36 12, 42 14"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
};
