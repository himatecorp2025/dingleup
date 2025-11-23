interface CoinIcon3DProps {
  className?: string;
  size?: number;
}

export const CoinIcon3D = ({ className = "", size = 32 }: CoinIcon3DProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="coinGradient" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </radialGradient>
        <radialGradient id="coinShine" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
          <stop offset="40%" stopColor="#fef3c7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="coinEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="50%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <filter id="coinShadow">
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
      </defs>
      
      {/* Shadow */}
      <ellipse
        cx="32"
        cy="34"
        rx="24"
        ry="24"
        fill="#854d0e"
        opacity="0.3"
        filter="blur(5px)"
      />
      
      {/* Coin edge (3D depth) */}
      <ellipse
        cx="32"
        cy="32"
        rx="25"
        ry="25"
        fill="url(#coinEdge)"
        filter="url(#coinShadow)"
      />
      
      {/* Main coin face */}
      <circle
        cx="32"
        cy="31"
        r="23"
        fill="url(#coinGradient)"
      />
      
      {/* Inner ring */}
      <circle
        cx="32"
        cy="31"
        r="20"
        fill="none"
        stroke="#ca8a04"
        strokeWidth="0.5"
        opacity="0.4"
      />
      
      {/* Currency symbol or decoration */}
      <text
        x="32"
        y="38"
        fontSize="28"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        fill="#a16207"
        textAnchor="middle"
        opacity="0.6"
      >
        G
      </text>
      
      {/* Shine overlay */}
      <ellipse
        cx="24"
        cy="23"
        rx="12"
        ry="14"
        fill="url(#coinShine)"
      />
      
      {/* Bright highlight */}
      <ellipse
        cx="26"
        cy="22"
        rx="6"
        ry="7"
        fill="#fffbeb"
        opacity="0.9"
      />
      
      {/* Edge highlights */}
      <path
        d="M 12 28 Q 12 20, 20 14"
        fill="none"
        stroke="#fef3c7"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M 52 28 Q 52 20, 44 14"
        fill="none"
        stroke="#854d0e"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
};
