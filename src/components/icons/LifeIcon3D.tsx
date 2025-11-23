interface LifeIcon3DProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const LifeIcon3D = ({ className = "", size = 32, style }: LifeIcon3DProps) => {
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
        {/* Ultra realistic heart gradient */}
        <linearGradient id="ultraHeartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="20%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="80%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        
        {/* Ultra shine with multiple layers */}
        <radialGradient id="ultraHeartShine" cx="28%" cy="25%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="25%" stopColor="#dcfce7" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#bbf7d0" stopOpacity="0.6" />
          <stop offset="75%" stopColor="#86efac" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        
        {/* Deep shadow filter */}
        <filter id="ultraHeartShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="3" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="ultraGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer glow layers */}
      <path
        d="M32 56 C16 45, 6 34, 6 21 C6 10, 14 6, 21 8 C26 9.5, 29 13, 32 18 C35 13, 38 9.5, 43 8 C50 6, 58 10, 58 21 C58 34, 48 45, 32 56 Z"
        fill="#22c55e"
        opacity="0.4"
        filter="blur(8px)"
      />
      <path
        d="M32 55 C17 44.5, 7 33.5, 7 21.5 C7 11, 14.5 7, 21.5 9 C26 10, 29.5 13.5, 32 18.5 C34.5 13.5, 38 10, 42.5 9 C49.5 7, 57 11, 57 21.5 C57 33.5, 47 44.5, 32 55 Z"
        fill="#16a34a"
        opacity="0.3"
        filter="blur(6px)"
      />
      
      {/* 3D depth layer (bottom shadow) */}
      <path
        d="M32 53 C19 42.5, 9 32, 9 22 C9 13, 16 9.5, 22 11 C26.5 12, 30 15, 32 20 C34 15, 37.5 12, 42 11 C48 9.5, 55 13, 55 22 C55 32, 45 42.5, 32 53 Z"
        fill="#15803d"
        opacity="0.8"
      />
      
      {/* Main heart with ultra gradient */}
      <path
        d="M32 52 C20 43, 10 34, 10 23 C10 14, 17 10, 23 12 C27 13, 30 16, 32 20 C34 16, 37 13, 41 12 C47 10, 54 14, 54 23 C54 34, 44 43, 32 52 Z"
        fill="url(#ultraHeartGradient)"
        filter="url(#ultraHeartShadow)"
      />
      
      {/* Inner highlight layer */}
      <path
        d="M32 50 C21 42, 12 33, 12 24 C12 16, 18 12, 24 13.5 C27.5 14.5, 30.5 17, 32 20.5 C33.5 17, 36.5 14.5, 40 13.5 C46 12, 52 16, 52 24 C52 33, 43 42, 32 50 Z"
        fill="url(#ultraHeartGradient)"
        opacity="0.6"
        filter="url(#ultraGlow)"
      />
      
      {/* Ultra bright shine overlay (main) */}
      <ellipse
        cx="21"
        cy="17"
        rx="10"
        ry="12"
        fill="url(#ultraHeartShine)"
        filter="url(#ultraGlow)"
      />
      
      {/* Multiple highlight spots for depth */}
      <ellipse cx="23" cy="15" rx="6" ry="7" fill="#ffffff" opacity="0.9" filter="blur(1px)" />
      <ellipse cx="25" cy="17" rx="4" ry="5" fill="#dcfce7" opacity="0.85" />
      <circle cx="27" cy="19" r="2.5" fill="#ffffff" opacity="0.75" />
      
      {/* Secondary shine areas */}
      <ellipse cx="38" cy="20" rx="3" ry="4" fill="#bbf7d0" opacity="0.5" />
      <ellipse cx="35" cy="28" rx="2" ry="3" fill="#86efac" opacity="0.4" />
      
      {/* Edge highlights for 3D effect */}
      <path
        d="M 18 15 Q 15 18, 13 22"
        fill="none"
        stroke="#dcfce7"
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
      />
      <path
        d="M 46 15 Q 49 18, 51 22"
        fill="none"
        stroke="#15803d"
        strokeWidth="1.5"
        opacity="0.5"
        strokeLinecap="round"
      />
      
      {/* Inner contour for depth */}
      <path
        d="M32 22 C34 18, 36.5 15, 40 14"
        fill="none"
        stroke="#22c55e"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d="M32 22 C30 18, 27.5 15, 24 14"
        fill="none"
        stroke="#4ade80"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
};
