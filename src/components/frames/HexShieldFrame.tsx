import React, { PropsWithChildren } from 'react';

/**
 * HexShieldFrame - POINTY-TOP hexagon pajzs (trapéz), 3D specular fém keret + kristály panel
 * Referencia: Daily Gift popup - arany fém + lila kristály
 * - POINTY-TOP geometria: bal/jobb élek EGYENES vertikális, felső/alsó élek TÖRTEK
 * - Kétlépcsős arany keret (külső sötét, belső világos highlight)
 * - Lila kristály belső panel diagonális fénycsíkokkal
 * - Specular conic highlight a tetején
 * - 3D árnyékok és vastagság
 */
const HexShieldFrame: React.FC<PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}
         style={{ 
           width: 'min(92vw, 500px)', 
           height: 'clamp(540px, 88vh, 680px)'
         }}>
      
      {/* Casino shine effect - csak a belső crystal panel területén, PONTOSAN 150° */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: 'polygon(50% 17.83%, 83.3% 26.33%, 83.3% 73.67%, 50% 82.17%, 16.7% 73.67%, 16.7% 26.33%)',
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
      
      {/* SVG POINTY-TOP Hexagon/Trapezoid Layers */}
      <svg viewBox="0 0 360 600" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          {/* Gold Metal Gradients */}
          <linearGradient id="goldOuter" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--dup-gold-700))" />
            <stop offset="50%" stopColor="hsl(var(--dup-gold-600))" />
            <stop offset="100%" stopColor="hsl(var(--dup-gold-800))" />
          </linearGradient>
          <linearGradient id="goldInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--dup-gold-400))" />
            <stop offset="40%" stopColor="hsl(var(--dup-gold-500))" />
            <stop offset="100%" stopColor="hsl(var(--dup-gold-700))" />
          </linearGradient>
          
          {/* Crystal Panel - radial + vertical gradient */}
          <radialGradient id="crystalRadial" cx="50%" cy="-10%">
            <stop offset="0%" stopColor="hsl(var(--dup-purple-300))" stopOpacity="0.9" />
            <stop offset="40%" stopColor="hsl(var(--dup-purple-400))" />
            <stop offset="100%" stopColor="hsl(var(--dup-purple-700))" />
          </radialGradient>
          
          {/* Specular Highlight (conic, top-left) */}
          <radialGradient id="specular" cx="30%" cy="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Shadow for 3D depth */}
          <filter id="depth-shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="4" dy="6" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 3D Shadow Base - PONTOSAN 150° felső/alsó csúcs */}
        <path
          d="M 186 97 L 318 157 L 318 457 L 186 517 L 54 457 L 54 157 Z"
          fill="rgba(0,0,0,0.35)"
          filter="blur(4px)"
        />

        {/* Outer Gold Frame - PONTOSAN 150° felső/alsó csúcs */}
        <path
          d="M 180 91 L 312 150 L 312 450 L 180 509 L 48 450 L 48 150 Z"
          fill="url(#goldOuter)"
          stroke="hsl(var(--dup-gold-800))"
          strokeWidth="2"
          filter="url(#depth-shadow)"
        />

        {/* Middle Gold Frame - PONTOSAN 150° felső/alsó csúcs (inset) */}
        <path
          d="M 180 99 L 306 154 L 306 446 L 180 501 L 54 446 L 54 154 Z"
          fill="url(#goldInner)"
          stroke="hsl(var(--dup-gold-400))"
          strokeWidth="3"
        />

        {/* Inner Crystal Panel - PONTOSAN 150° felső/alsó csúcs (inset) */}
        <path
          d="M 180 107 L 300 158 L 300 442 L 180 493 L 60 442 L 60 158 Z"
          fill="url(#crystalRadial)"
        />

        {/* Specular Highlight Overlay */}
        <path
          d="M 180 107 L 300 158 L 300 442 L 180 493 L 60 442 L 60 158 Z"
          fill="url(#specular)"
          opacity="0.4"
        />

        {/* Diagonal Light Streaks */}
        <defs>
          <pattern id="diagonalStripes" patternUnits="userSpaceOnUse" width="60" height="60" patternTransform="rotate(45)">
            <rect x="0" y="0" width="12" height="60" fill="rgba(255,255,255,0.08)" />
            <rect x="24" y="0" width="8" height="60" fill="rgba(255,255,255,0.06)" />
            <rect x="48" y="0" width="6" height="60" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>
        <path
          d="M 180 107 L 300 158 L 300 442 L 180 493 L 60 442 L 60 158 Z"
          fill="url(#diagonalStripes)"
          opacity="0.7"
        />

        {/* Inner Glow (bottom shadow for 3D) */}
        <path
          d="M 180 107 L 300 158 L 300 442 L 180 493 L 60 442 L 60 158 Z"
          fill="none"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="8"
          style={{ filter: 'blur(6px)' }}
        />

        {/* Gold Inner Stroke (accent) */}
        <path
          d="M 180 107 L 300 158 L 300 442 L 180 493 L 60 442 L 60 158 Z"
          fill="none"
          stroke="url(#goldInner)"
          strokeWidth="2"
          opacity="0.8"
        />
      </svg>

      {/* Content Container (positioned over crystal panel) */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: '64px 52px 72px 52px' }}>
        {children}
      </div>
    </div>
  );
};

export default HexShieldFrame;
