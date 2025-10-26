interface Trophy3DProps {
  className?: string;
  animate?: boolean;
}

export const Trophy3D = ({ className = "", animate = true }: Trophy3DProps) => {
  return (
    <svg 
      viewBox="0 0 200 240" 
      className={`${className} ${animate ? 'animate-[bounce_2s_ease-in-out_infinite]' : ''}`}
      style={{ 
        filter: 'drop-shadow(0 30px 60px rgba(255,215,0,0.8)) drop-shadow(0 0 40px rgba(255,215,0,0.6))',
      }}
    >
      {/* Base/Podium */}
      <g>
        {/* Base shadow */}
        <ellipse cx="100" cy="225" rx="50" ry="8" fill="rgba(0,0,0,0.4)" />
        
        {/* Base front */}
        <rect x="60" y="200" width="80" height="25" fill="#8B4513" rx="2" />
        <rect x="60" y="200" width="80" height="8" fill="#A0522D" rx="2" />
        <rect x="65" y="205" width="70" height="3" fill="#CD853F" opacity="0.6" />
      </g>

      {/* Cup body */}
      <g>
        {/* Main cup gradient */}
        <defs>
          <linearGradient id="cupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
          </linearGradient>
          
          <radialGradient id="cupShine">
            <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#FFD700', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* Cup stem */}
        <rect x="90" y="160" width="20" height="40" fill="url(#cupGradient)" rx="4" />
        <rect x="92" y="160" width="7" height="40" fill="rgba(255,255,255,0.3)" />

        {/* Cup base bowl */}
        <path 
          d="M 70 160 Q 70 140 100 140 Q 130 140 130 160 L 125 190 Q 125 195 100 195 Q 75 195 75 190 Z" 
          fill="url(#cupGradient)"
          stroke="#B8860B"
          strokeWidth="2"
        />

        {/* Cup shine effect */}
        <ellipse 
          cx="85" 
          cy="150" 
          rx="15" 
          ry="25" 
          fill="url(#cupShine)"
          opacity="0.6"
        />

        {/* Cup rim */}
        <ellipse cx="100" cy="140" rx="30" ry="8" fill="#FFD700" />
        <ellipse cx="100" cy="138" rx="28" ry="6" fill="#FFA500" />
        <ellipse cx="100" cy="137" rx="26" ry="5" fill="rgba(255,255,255,0.4)" />

        {/* Left handle */}
        <path 
          d="M 70 145 Q 50 145 50 165 Q 50 180 70 180" 
          fill="none"
          stroke="url(#cupGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path 
          d="M 70 145 Q 52 145 52 165 Q 52 180 70 180" 
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Right handle */}
        <path 
          d="M 130 145 Q 150 145 150 165 Q 150 180 130 180" 
          fill="none"
          stroke="url(#cupGradient)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path 
          d="M 130 145 Q 148 145 148 165 Q 148 180 130 180" 
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Sparkles */}
      {animate && (
        <>
          <circle cx="40" cy="120" r="3" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '0s' }} />
          <circle cx="160" cy="130" r="2" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="100" cy="100" r="2.5" fill="#FFFFFF" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="70" cy="110" r="2" fill="#FFFFFF" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
          <circle cx="130" cy="115" r="2" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '2s' }} />
        </>
      )}
    </svg>
  );
};
