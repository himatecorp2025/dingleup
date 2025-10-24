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
        height: 'clamp(68px, 16vh, 84px)',
        padding: '4px 0'
      }}
      {...props}
    >
      {/* SVG POINTY-TOP Hexagon Layers - 150° felső/alsó szögek */}
      <svg viewBox="0 0 380 80" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
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
          
          {/* Green Crystal Panel - radial + vertical */}
          <radialGradient id="hex-green-crystal" cx="50%" cy="-10%">
            <stop offset="0%" stopColor="hsl(142 80% 75%)" stopOpacity="0.95" />
            <stop offset="30%" stopColor="hsl(142 75% 60%)" />
            <stop offset="60%" stopColor="hsl(142 70% 48%)" />
            <stop offset="100%" stopColor="hsl(142 65% 35%)" />
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

        {/* 3D Shadow Base - 150° felső/alsó csúcs */}
        <path
          d="M 190 2 L 366 18 L 366 62 L 190 78 L 14 62 L 14 18 Z"
          fill="rgba(0,0,0,0.4)"
          transform="translate(4, 5)"
        />

        {/* Outer Gold Frame - 150° csúcsok */}
        <path
          d="M 190 0 L 376 17 L 376 63 L 190 80 L 4 63 L 4 17 Z"
          fill="url(#hex-gold-outer)"
          stroke="hsl(var(--dup-gold-800))"
          strokeWidth="2"
          filter="url(#hex-btn-shadow)"
        />

        {/* Middle Gold Frame (inset) */}
        <path
          d="M 190 4 L 368 19 L 368 61 L 190 76 L 12 61 L 12 19 Z"
          fill="url(#hex-gold-inner)"
          stroke="hsl(var(--dup-gold-400))"
          strokeWidth="2.5"
        />

        {/* Inner Green Crystal Panel - 150° csúcsok */}
        <path
          d="M 190 8 L 360 22 L 360 58 L 190 72 L 20 58 L 20 22 Z"
          fill="url(#hex-green-crystal)"
        />

        {/* Specular Highlight Overlay - erős kristály hatás */}
        <path
          d="M 190 8 L 360 22 L 360 58 L 190 72 L 20 58 L 20 22 Z"
          fill="url(#hex-green-specular)"
          opacity="0.6"
        />

        {/* Diagonal Light Streaks - kristály fények */}
        <defs>
          <pattern id="hex-green-stripes" patternUnits="userSpaceOnUse" width="50" height="50" patternTransform="rotate(45)">
            <rect x="0" y="0" width="10" height="50" fill="rgba(255,255,255,0.12)" />
            <rect x="20" y="0" width="7" height="50" fill="rgba(255,255,255,0.08)" />
            <rect x="40" y="0" width="5" height="50" fill="rgba(255,255,255,0.06)" />
          </pattern>
        </defs>
        <path
          d="M 190 8 L 360 22 L 360 58 L 190 72 L 20 58 L 20 22 Z"
          fill="url(#hex-green-stripes)"
          opacity="0.75"
        />

        {/* Inner Glow (bottom shadow for 3D depth) */}
        <path
          d="M 190 8 L 360 22 L 360 58 L 190 72 L 20 58 L 20 22 Z"
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="6"
          style={{ filter: 'blur(5px)' }}
        />

        {/* Gold Inner Stroke (accent) */}
        <path
          d="M 190 8 L 360 22 L 360 58 L 190 72 L 20 58 L 20 22 Z"
          fill="none"
          stroke="url(#hex-gold-inner)"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* Additional crystal facet highlights */}
        <defs>
          <linearGradient id="facet-1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path
          d="M 190 8 L 360 22 L 360 58 L 190 72 L 20 58 L 20 22 Z"
          fill="url(#facet-1)"
          opacity="0.5"
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
