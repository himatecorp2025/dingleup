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
      {/* Base/Podium - Enhanced */}
      <g>
        {/* Base shadow */}
        <ellipse cx="100" cy="225" rx="50" ry="8" fill="rgba(0,0,0,0.4)" />
        
        {/* Base with ornate details */}
        <rect x="60" y="200" width="80" height="25" fill="#8B4513" rx="3" />
        <rect x="60" y="200" width="80" height="8" fill="#A0522D" rx="3" />
        <rect x="65" y="205" width="70" height="3" fill="#CD853F" opacity="0.6" />
        
        {/* Decorative base patterns */}
        <circle cx="70" cy="212" r="2" fill="#FFD700" opacity="0.8" />
        <circle cx="85" cy="212" r="2" fill="#FFD700" opacity="0.8" />
        <circle cx="100" cy="212" r="2" fill="#FFD700" opacity="0.8" />
        <circle cx="115" cy="212" r="2" fill="#FFD700" opacity="0.8" />
        <circle cx="130" cy="212" r="2" fill="#FFD700" opacity="0.8" />
        
        {/* Base rim decoration */}
        <rect x="63" y="220" width="3" height="5" fill="#FFD700" opacity="0.6" />
        <rect x="73" y="220" width="3" height="5" fill="#FFD700" opacity="0.6" />
        <rect x="83" y="220" width="3" height="5" fill="#FFD700" opacity="0.6" />
        <rect x="93" y="220" width="3" height="5" fill="#FFD700" opacity="0.6" />
        <rect x="103" y="220" width="3" height="5" fill="#FFD700" opacity="0.6" />
        <rect x="113" y="220" width="3" height="5" fill="#FFD700" opacity="0.6" />
        <rect x="123" y="220" width="3" height="5" fill="#FFD700" opacity="0.6" />
        <rect x="133" y="220" width="3" height="5" fill="#FFD700" opacity="0.6" />
      </g>

      {/* Cup body with ornate decorations */}
      <g>
        {/* Gradients */}
        <defs>
          <linearGradient id="cupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
            <stop offset="30%" style={{ stopColor: '#FFC700', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: '#FF9500', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
          </linearGradient>
          
          <linearGradient id="cupGradientDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#C9A700', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
          </linearGradient>
          
          <radialGradient id="cupShine">
            <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.9 }} />
            <stop offset="40%" style={{ stopColor: '#FFFACD', stopOpacity: 0.5 }} />
            <stop offset="70%" style={{ stopColor: '#FFD700', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 0 }} />
          </radialGradient>
          
          <pattern id="diamondPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 0 4 L 4 0 L 8 4 L 4 8 Z" fill="#FFFFFF" opacity="0.15" />
          </pattern>
        </defs>

        {/* Cup stem with decorative bands */}
        <rect x="90" y="160" width="20" height="40" fill="url(#cupGradient)" rx="5" />
        <rect x="92" y="160" width="8" height="40" fill="rgba(255,255,255,0.4)" rx="2" />
        
        {/* Decorative bands on stem */}
        <rect x="88" y="165" width="24" height="4" fill="url(#cupGradientDark)" rx="2" />
        <rect x="88" y="180" width="24" height="4" fill="url(#cupGradientDark)" rx="2" />
        <rect x="88" y="195" width="24" height="4" fill="url(#cupGradientDark)" rx="2" />
        
        {/* Jewel accents on bands */}
        <circle cx="100" cy="167" r="1.5" fill="#FF0000" opacity="0.8" />
        <circle cx="100" cy="182" r="1.5" fill="#0000FF" opacity="0.8" />
        <circle cx="100" cy="197" r="1.5" fill="#00FF00" opacity="0.8" />

        {/* Cup base bowl with pattern */}
        <path 
          d="M 70 160 Q 70 140 100 140 Q 130 140 130 160 L 125 190 Q 125 195 100 195 Q 75 195 75 190 Z" 
          fill="url(#cupGradient)"
          stroke="#B8860B"
          strokeWidth="2.5"
        />
        
        {/* Diamond pattern overlay */}
        <path 
          d="M 70 160 Q 70 140 100 140 Q 130 140 130 160 L 125 190 Q 125 195 100 195 Q 75 195 75 190 Z" 
          fill="url(#diamondPattern)"
        />
        
        {/* Decorative horizontal bands on cup */}
        <ellipse cx="100" cy="150" rx="27" ry="2" fill="url(#cupGradientDark)" opacity="0.7" />
        <ellipse cx="100" cy="165" rx="28" ry="2" fill="url(#cupGradientDark)" opacity="0.7" />
        <ellipse cx="100" cy="180" rx="27" ry="2" fill="url(#cupGradientDark)" opacity="0.7" />
        
        {/* Jewels around the cup */}
        <circle cx="85" cy="150" r="2" fill="#FF0000" opacity="0.9" />
        <circle cx="115" cy="150" r="2" fill="#FF0000" opacity="0.9" />
        <circle cx="80" cy="165" r="2" fill="#0000FF" opacity="0.9" />
        <circle cx="120" cy="165" r="2" fill="#0000FF" opacity="0.9" />
        <circle cx="85" cy="180" r="2" fill="#00FF00" opacity="0.9" />
        <circle cx="115" cy="180" r="2" fill="#00FF00" opacity="0.9" />

        {/* Cup shine effect */}
        <ellipse 
          cx="85" 
          cy="155" 
          rx="18" 
          ry="30" 
          fill="url(#cupShine)"
          opacity="0.7"
        />

        {/* Cup rim with ornate details */}
        <ellipse cx="100" cy="140" rx="30" ry="8" fill="#FFD700" />
        <ellipse cx="100" cy="139" rx="28" ry="6" fill="#FFA500" />
        <ellipse cx="100" cy="138" rx="26" ry="5" fill="rgba(255,255,255,0.5)" />
        
        {/* Decorative dots on rim */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const x = 100 + Math.cos(angle) * 26;
          const y = 140 + Math.sin(angle) * 3;
          return <circle key={i} cx={x} cy={y} r="1" fill="#FFFFFF" opacity="0.8" />;
        })}

        {/* Left handle with ornate design */}
        <path 
          d="M 70 145 Q 50 145 50 165 Q 50 180 70 180" 
          fill="none"
          stroke="url(#cupGradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path 
          d="M 70 145 Q 52 145 52 165 Q 52 180 70 180" 
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Decorative bands on left handle */}
        <circle cx="55" cy="155" r="2" fill="#FF0000" opacity="0.9" />
        <circle cx="55" cy="165" r="2" fill="#0000FF" opacity="0.9" />
        <circle cx="55" cy="175" r="2" fill="#00FF00" opacity="0.9" />

        {/* Right handle with ornate design */}
        <path 
          d="M 130 145 Q 150 145 150 165 Q 150 180 130 180" 
          fill="none"
          stroke="url(#cupGradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path 
          d="M 130 145 Q 148 145 148 165 Q 148 180 130 180" 
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Decorative bands on right handle */}
        <circle cx="145" cy="155" r="2" fill="#FF0000" opacity="0.9" />
        <circle cx="145" cy="165" r="2" fill="#0000FF" opacity="0.9" />
        <circle cx="145" cy="175" r="2" fill="#00FF00" opacity="0.9" />
        
        {/* Winner's laurel wreath elements on cup */}
        <path d="M 90 155 Q 95 150 100 155" fill="none" stroke="#228B22" strokeWidth="2" opacity="0.6" />
        <path d="M 100 155 Q 105 150 110 155" fill="none" stroke="#228B22" strokeWidth="2" opacity="0.6" />
        <path d="M 88 170 Q 92 165 96 170" fill="none" stroke="#228B22" strokeWidth="2" opacity="0.6" />
        <path d="M 104 170 Q 108 165 112 170" fill="none" stroke="#228B22" strokeWidth="2" opacity="0.6" />
      </g>

      {/* Sparkles - Enhanced */}
      {animate && (
        <>
          <circle cx="35" cy="110" r="3.5" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '0s' }} />
          <circle cx="165" cy="120" r="3" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="100" cy="95" r="4" fill="#FFFFFF" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="60" cy="105" r="2.5" fill="#FFFFFF" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
          <circle cx="140" cy="110" r="3" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '2s' }} />
          <circle cx="180" cy="140" r="2.5" fill="#FFFFFF" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
          <circle cx="20" cy="130" r="3" fill="#FFD700" className="animate-pulse" style={{ animationDelay: '1.3s' }} />
          <circle cx="100" cy="120" r="2" fill="#FFFFFF" className="animate-pulse" style={{ animationDelay: '1.8s' }} />
          
          {/* Star sparkles */}
          <path d="M 45 125 L 47 130 L 52 130 L 48 133 L 50 138 L 45 135 L 40 138 L 42 133 L 38 130 L 43 130 Z" 
                fill="#FFD700" className="animate-pulse" opacity="0.8" style={{ animationDelay: '0.3s' }} />
          <path d="M 155 135 L 157 140 L 162 140 L 158 143 L 160 148 L 155 145 L 150 148 L 152 143 L 148 140 L 153 140 Z" 
                fill="#FFFFFF" className="animate-pulse" opacity="0.9" style={{ animationDelay: '1.1s' }} />
        </>
      )}
    </svg>
  );
};
