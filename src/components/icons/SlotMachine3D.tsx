interface SlotMachine3DProps {
  className?: string;
  size?: number;
}

export const SlotMachine3D = ({ className = "", size = 32 }: SlotMachine3DProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="slotBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="slotScreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="slotGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id="coinGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="slotShadow">
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
      
      {/* Machine base shadow */}
      <ellipse cx="32" cy="56" rx="20" ry="4" fill="#000000" opacity="0.4" />
      
      {/* Machine body */}
      <rect x="18" y="20" width="28" height="36" rx="2" fill="url(#slotBody)" filter="url(#slotShadow)" />
      <rect x="19" y="21" width="26" height="34" rx="1.5" fill="none" stroke="#dc2626" strokeWidth="0.5" opacity="0.5" />
      
      {/* Screen */}
      <rect x="21" y="24" width="22" height="16" rx="1" fill="url(#slotScreen)" />
      <rect x="21.5" y="24.5" width="21" height="15" rx="0.5" fill="none" stroke="#60a5fa" strokeWidth="0.3" opacity="0.6" />
      
      {/* Slot reels with gold symbols */}
      <g opacity="0.9">
        {/* Reel 1 - 7 */}
        <text x="25" y="36" fontSize="8" fontWeight="bold" fill="url(#slotGold)" textAnchor="middle">7</text>
        
        {/* Reel 2 - 7 */}
        <text x="32" y="36" fontSize="8" fontWeight="bold" fill="url(#slotGold)" textAnchor="middle">7</text>
        
        {/* Reel 3 - 7 */}
        <text x="39" y="36" fontSize="8" fontWeight="bold" fill="url(#slotGold)" textAnchor="middle">7</text>
      </g>
      
      {/* Decorative lights */}
      <circle cx="23" cy="22" r="0.8" fill="#fde047">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="32" cy="21" r="0.8" fill="#fde047">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="41" cy="22" r="0.8" fill="#fde047">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      
      {/* Control panel */}
      <rect x="22" y="42" width="20" height="8" rx="1" fill="#374151" />
      <rect x="22.5" y="42.5" width="19" height="7" rx="0.5" fill="none" stroke="#4b5563" strokeWidth="0.3" />
      
      {/* Buttons */}
      <circle cx="26" cy="46" r="1.5" fill="#ef4444" />
      <circle cx="32" cy="46" r="1.5" fill="#22c55e" />
      <circle cx="38" cy="46" r="1.5" fill="#3b82f6" />
      
      {/* Lever base */}
      <rect x="44" y="28" width="4" height="8" rx="2" fill="#4b5563" />
      
      {/* Lever arm */}
      <line x1="46" y1="28" x2="46" y2="18" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
      
      {/* Lever handle */}
      <circle cx="46" cy="16" r="3" fill="url(#slotGold)" />
      <circle cx="46" cy="16" r="2.5" fill="none" stroke="#d97706" strokeWidth="0.5" />
      <circle cx="45" cy="15" r="0.8" fill="#fef3c7" opacity="0.8" />
      
      {/* Coin tray */}
      <path d="M 20 52 Q 20 54 22 54 L 42 54 Q 44 54 44 52 L 44 50 L 20 50 Z" fill="#374151" />
      <ellipse cx="32" cy="50" rx="12" ry="1.5" fill="#4b5563" />
      
      {/* Coins in tray */}
      <circle cx="28" cy="52" r="2" fill="url(#slotGold)" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.6;0.9" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="34" cy="52.5" r="1.8" fill="url(#slotGold)" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2.3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="30" cy="53" r="1.5" fill="url(#slotGold)" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.4;0.7" dur="2.7s" repeatCount="indefinite"/>
      </circle>
      
      {/* Coin glow effect */}
      <circle cx="32" cy="52" r="8" fill="url(#coinGlow)" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>
      </circle>
      
      {/* Screen shine */}
      <rect x="21" y="24" width="10" height="8" rx="1" fill="#ffffff" opacity="0.1" />
    </svg>
  );
};
