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
        overflow-hidden
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
        width: '100%',
        maxWidth: '92%',
        height: 'clamp(68px, 16vh, 84px)',
        padding: '6px 0',
        animation: 'casino-pulse 3s ease-in-out infinite',
        margin: '0 auto'
      }}
      {...props}
    >
      {/* Casino shine effect - csak hexagonon belül */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
          overflow: 'hidden'
        }}
      >
        <div 
          className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%]"
          style={{
            background: 'linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.3), transparent)',
            animation: 'slot-shine 3s linear infinite'
          }}
        />
      </div>
      {/* SVG POINTY-TOP Hexagon Layers - 150° felső/alsó szögek */}
      <svg viewBox="0 0 560 80" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Gold Metal Gradients */}
          <linearGradient id="hex-gold-outer" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--dup-gold-700))" />
            <stop offset="50%" stopColor="hsl(var(--dup-gold-600))" />
            <stop offset="100%" stopColor="hsl(var(--dup-gold-800))" />
          </linearGradient>
          
          <linearGradient id="hex-gold-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--dup-gold-400))" />
            <stop offset="40%" stopColor="hsl(var(--dup-gold-500))" />
            <stop offset="100%" stopColor="hsl(var(--dup-gold-700))" />
          </linearGradient>
          
          {/* Smaragdzöld Crystal Panel - élénkebb, gyémánt zöld */}
          <radialGradient id="hex-green-crystal" cx="50%" cy="-10%">
            <stop offset="0%" stopColor="hsl(155 85% 80%)" stopOpacity="0.98" />
            <stop offset="30%" stopColor="hsl(155 80% 65%)" />
            <stop offset="60%" stopColor="hsl(155 75% 52%)" />
            <stop offset="100%" stopColor="hsl(155 70% 38%)" />
          </radialGradient>
          
          {/* Specular Highlight (conic, top-left) */}
          <radialGradient id="hex-green-specular" cx="25%" cy="15%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* 3D Shadow Filter */}
          <filter id="hex-btn-shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="3" dy="4" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 3D Shadow Base - pontos 150° belső szög felső/alsó csúcsnál */}
        <path
          d="M 280 4 L 338 20 L 338 60 L 280 76 L 222 60 L 222 20 Z"
          fill="rgba(0,0,0,0.4)"
          transform="translate(4, 5)"
        />

        {/* Outer Gold Frame - pontos 150° felső/alsó csúcs */}
        <path
          d="M 280 2 L 346 19 L 346 61 L 280 78 L 214 61 L 214 19 Z"
          fill="url(#hex-gold-outer)"
          stroke="hsl(var(--dup-gold-800))"
          strokeWidth="2"
          filter="url(#hex-btn-shadow)"
        />

        {/* Middle Gold Frame (inset) - pontos 150° */}
        <path
          d="M 280 5 L 340 21 L 340 59 L 280 75 L 220 59 L 220 21 Z"
          fill="url(#hex-gold-inner)"
          stroke="hsl(var(--dup-gold-400))"
          strokeWidth="2.5"
        />

        {/* Inner Smaragdzöld Crystal Panel - pontos 150° belső szög + animáció */}
        <path
          d="M 280 9 L 334 23 L 334 57 L 280 71 L 226 57 L 226 23 Z"
          fill="url(#hex-green-crystal)"
        >
          <animate
            attributeName="opacity"
            values="1;0.85;1"
            dur="3s"
            repeatCount="indefinite"
          />
        </path>

        {/* Casino Shine Animation Layer */}
        <path
          d="M 280 9 L 334 23 L 334 57 L 280 71 L 226 57 L 226 23 Z"
          fill="url(#shine-sweep)"
        >
          <animate
            attributeName="opacity"
            values="0;0.6;0"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
        
        <defs>
          <linearGradient id="shine-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Specular Highlight Overlay - erős kristály hatás */}
        <path
          d="M 280 9 L 334 23 L 334 57 L 280 71 L 226 57 L 226 23 Z"
          fill="url(#hex-green-specular)"
          opacity="0.6"
        />

        {/* Diagonal Light Streaks - kristály fények */}
        <defs>
          <pattern id="hex-green-stripes" patternUnits="userSpaceOnUse" width="50" height="50" patternTransform="rotate(45)">
            <rect x="0" y="0" width="10" height="50" fill="rgba(255,255,255,0.15)" />
            <rect x="20" y="0" width="7" height="50" fill="rgba(255,255,255,0.1)" />
            <rect x="40" y="0" width="5" height="50" fill="rgba(255,255,255,0.08)" />
          </pattern>
        </defs>
        <path
          d="M 280 9 L 334 23 L 334 57 L 280 71 L 226 57 L 226 23 Z"
          fill="url(#hex-green-stripes)"
          opacity="0.8"
        />

        {/* Inner Glow (bottom shadow for 3D depth) */}
        <path
          d="M 280 9 L 334 23 L 334 57 L 280 71 L 226 57 L 226 23 Z"
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="6"
          style={{ filter: 'blur(5px)' }}
        />

        {/* Gold Inner Stroke (accent) */}
        <path
          d="M 280 9 L 334 23 L 334 57 L 280 71 L 226 57 L 226 23 Z"
          fill="none"
          stroke="url(#hex-gold-inner)"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* Additional crystal facet highlights */}
        <defs>
          <linearGradient id="facet-1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path
          d="M 280 9 L 334 23 L 334 57 L 280 71 L 226 57 L 226 23 Z"
          fill="url(#facet-1)"
          opacity="0.5"
        />
      </svg>

      {/* Text Content */}
      <span className="relative z-10 text-white font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" 
            style={{ 
              fontSize: 'clamp(1.1rem, 4.8vw, 1.5rem)',
              letterSpacing: '0.08em'
            }}>
        ELFOGADOM
      </span>
    </button>
  );
};

export default HexAcceptButton;
