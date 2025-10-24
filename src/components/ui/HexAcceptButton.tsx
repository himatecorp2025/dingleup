import React, { ButtonHTMLAttributes } from 'react';

/**
 * HexAcceptButton - 150° szögű hexagon gomb zöld gyémánt hatással
 * - POINTY-TOP hexagon geometria: felső/alsó csúcsok 150°
 * - Arany keret + zöld kristály belső
 * - 3D specular highlight + árnyékok
 * - Hover animáció
 */
interface HexAcceptButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const HexAcceptButton: React.FC<HexAcceptButtonProps> = ({ 
  children = "Elfogadom a napi jutalmat!",
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`
        relative
        transition-all duration-200
        hover:-translate-y-1
        hover:scale-[1.02]
        active:translate-y-0
        active:scale-100
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        width: 'min(82vw, 380px)',
        height: 'clamp(56px, 14vh, 72px)'
      }}
      {...props}
    >
      {/* SVG Hexagon Layers */}
      <svg viewBox="0 0 380 72" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          {/* Green Gradients */}
          <linearGradient id="greenOuter" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(142 70% 55%)" />
            <stop offset="50%" stopColor="hsl(142 70% 45%)" />
            <stop offset="100%" stopColor="hsl(142 70% 35%)" />
          </linearGradient>
          
          <radialGradient id="greenCrystal" cx="50%" cy="-10%">
            <stop offset="0%" stopColor="hsl(142 70% 70%)" stopOpacity="0.95" />
            <stop offset="40%" stopColor="hsl(142 70% 55%)" />
            <stop offset="100%" stopColor="hsl(142 70% 38%)" />
          </radialGradient>
          
          <radialGradient id="greenSpecular" cx="30%" cy="20%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Depth Shadow */}
          <filter id="hex-shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="2" dy="3" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow Base */}
        <path
          d="M 190 2 L 370 2 L 370 70 L 190 70 L 10 70 L 10 2 Z"
          fill="rgba(0,0,0,0.3)"
          transform="translate(2, 3)"
        />

        {/* Outer Gold Frame */}
        <path
          d="M 190 1 L 376 1 L 376 71 L 190 71 L 4 71 L 4 1 Z"
          fill="url(#goldOuter)"
          stroke="hsl(var(--dup-gold-800))"
          strokeWidth="1.5"
          filter="url(#hex-shadow)"
        />

        {/* Inner Green Crystal */}
        <path
          d="M 190 4 L 372 4 L 372 68 L 190 68 L 8 68 L 8 4 Z"
          fill="url(#greenCrystal)"
        />

        {/* Specular Highlight */}
        <path
          d="M 190 4 L 372 4 L 372 68 L 190 68 L 8 68 L 8 4 Z"
          fill="url(#greenSpecular)"
          opacity="0.5"
        />

        {/* Diagonal Streaks */}
        <defs>
          <pattern id="greenStripes" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
            <rect x="0" y="0" width="8" height="40" fill="rgba(255,255,255,0.08)" />
            <rect x="16" y="0" width="5" height="40" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>
        <path
          d="M 190 4 L 372 4 L 372 68 L 190 68 L 8 68 L 8 4 Z"
          fill="url(#greenStripes)"
          opacity="0.6"
        />

        {/* Gold Accent Stroke */}
        <path
          d="M 190 4 L 372 4 L 372 68 L 190 68 L 8 68 L 8 4 Z"
          fill="none"
          stroke="hsl(var(--dup-gold-500))"
          strokeWidth="2"
          opacity="0.7"
        />
      </svg>

      {/* Text Content */}
      <span className="relative z-10 text-white font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" 
            style={{ 
              fontSize: 'clamp(0.95rem, 4.2vw, 1.35rem)',
              letterSpacing: '0.02em'
            }}>
        {children}
      </span>
    </button>
  );
};

export default HexAcceptButton;
