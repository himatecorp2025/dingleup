interface GoldRewardCoin3DProps {
  className?: string;
  size?: number;
}

export const GoldRewardCoin3D = ({ className = "", size = 32 }: GoldRewardCoin3DProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="goldCoinCenter" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#eab308" />
        </radialGradient>
        <linearGradient id="goldCoinEdge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id="goldShine" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#fef3c7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="coinShadow">
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
        <filter id="goldGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer shadow and glow */}
      <circle
        cx="32"
        cy="32"
        r="26"
        fill="#f59e0b"
        opacity="0.3"
        filter="blur(6px)"
      />
      
      {/* Coin base with edge shading */}
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="url(#goldCoinEdge)"
        filter="url(#coinShadow)"
      />
      
      {/* Inner coin surface */}
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="url(#goldCoinCenter)"
      />
      
      {/* Decorative inner ring */}
      <circle
        cx="32"
        cy="32"
        r="20"
        fill="none"
        stroke="#ca8a04"
        strokeWidth="1"
        opacity="0.4"
      />
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="0.8"
        opacity="0.6"
      />
      
      {/* Dollar sign embossing */}
      <path
        d="M 32 20 L 32 44 M 28 24 Q 28 20 32 20 Q 36 20 36 24 Q 36 28 32 28 M 32 28 Q 28 28 28 32 Q 28 36 32 36 Q 36 36 36 40 Q 36 44 32 44 Q 28 44 28 40"
        fill="none"
        stroke="#d97706"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <path
        d="M 32 20 L 32 44 M 28 24 Q 28 20 32 20 Q 36 20 36 24 Q 36 28 32 28 M 32 28 Q 28 28 28 32 Q 28 36 32 36 Q 36 36 36 40 Q 36 44 32 44 Q 28 44 28 40"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      
      {/* Top highlight shine */}
      <ellipse
        cx="28"
        cy="26"
        rx="10"
        ry="8"
        fill="url(#goldShine)"
        filter="url(#goldGlow)"
      />
      
      {/* Sparkle effects */}
      <circle
        cx="24"
        cy="22"
        r="2"
        fill="#ffffff"
        opacity="0.85"
      >
        <animate attributeName="opacity" values="0.85;0.4;0.85" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle
        cx="40"
        cy="28"
        r="1.5"
        fill="#fef3c7"
        opacity="0.75"
      >
        <animate attributeName="opacity" values="0.75;0.3;0.75" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle
        cx="36"
        cy="44"
        r="1.2"
        fill="#fde047"
        opacity="0.6"
      >
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite"/>
      </circle>
      
      {/* Edge highlights for 3D effect */}
      <path
        d="M 14 20 A 22 22 0 0 1 32 10"
        fill="none"
        stroke="#fef3c7"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M 50 44 A 22 22 0 0 1 32 54"
        fill="none"
        stroke="#92400e"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
};
