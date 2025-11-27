interface GoldLootboxIconProps {
  className?: string;
  size?: number;
}

export const GoldLootboxIcon = ({ className = "", size }: GoldLootboxIconProps) => {
  const sizeStyle = size ? { width: size, height: size } : {};
  
  return (
    <svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={sizeStyle}
    >
      <defs>
        <linearGradient id="goldGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#ffed4e" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
        <linearGradient id="goldGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffed4e" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
        <linearGradient id="darkGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        <radialGradient id="highlight" cx="40%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feOffset dx="0" dy="8" result="offsetblur" />
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
      <ellipse cx="250" cy="420" rx="180" ry="30" fill="rgba(0,0,0,0.3)" filter="url(#shadow)" />
      
      {/* Box base */}
      <path d="M150,150 L350,150 L350,350 L150,350 Z" fill="url(#goldGradient1)" />
      
      {/* Box top (lid) */}
      <path d="M130,120 L370,120 L350,150 L150,150 Z" fill="url(#goldGradient2)" />
      
      {/* Lid top surface */}
      <path d="M130,120 L370,120 L370,140 L130,140 Z" fill="url(#darkGold)" />
      
      {/* Box sides (3D effect) */}
      <path d="M350,150 L350,350 L380,370 L380,170 Z" fill="url(#darkGold)" opacity="0.8" />
      <path d="M150,350 L350,350 L380,370 L160,370 Z" fill="url(#darkGold)" opacity="0.6" />
      
      {/* Ribbon vertical */}
      <rect x="230" y="120" width="40" height="250" fill="#8b0000" />
      <rect x="235" y="120" width="30" height="250" fill="#c41e3a" />
      
      {/* Ribbon horizontal */}
      <rect x="130" y="230" width="240" height="40" fill="#8b0000" />
      <rect x="130" y="235" width="240" height="30" fill="#c41e3a" />
      
      {/* Ribbon bow */}
      <path d="M250,90 Q220,70 190,90 Q220,110 250,90" fill="#c41e3a" />
      <path d="M250,90 Q280,70 310,90 Q280,110 250,90" fill="#c41e3a" />
      <circle cx="250" cy="90" r="20" fill="#8b0000" />
      <circle cx="250" cy="90" r="15" fill="#c41e3a" />
      
      {/* Highlights */}
      <ellipse cx="200" cy="180" rx="50" ry="70" fill="url(#highlight)" />
      
      {/* Sparkles */}
      <circle cx="320" cy="180" r="4" fill="#ffffff">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="180" cy="300" r="3" fill="#ffffff">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="280" r="3.5" fill="#ffed4e">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};
