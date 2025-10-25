import React, { PropsWithChildren } from 'react';

/**
 * HexShieldFrame - POINTY-TOP hexagon pajzs (trapéz), 3D specular fém keret + kristály panel
 * Referencia: Daily Gift popup - arany fém + lila kristály
 * - POINTY-TOP geometria: 165° interior angles at top/bottom vertices
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
      
      {/* Casino shine effect - csak a belső crystal panel területén */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)',
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

        {/* 3D Shadow Base - 165° felső/alsó csúcs */}
        <path
          d="M 180 0 L 306 0 L 360 300 L 306 600 L 54 600 L 0 300 Z"
          fill="rgba(0,0,0,0.35)"
          transform="translate(6, 8)"
        />

        {/* Outer Gold Frame - 165° felső/alsó csúcs */}
        <path
          d="M 180 0 L 306 0 L 360 300 L 306 600 L 54 600 L 0 300 Z"
          fill="url(#goldOuter)"
          stroke="hsl(var(--dup-gold-800))"
          strokeWidth="2"
          filter="url(#depth-shadow)"
        />

        {/* Middle Gold Frame - 165° felső/alsó csúcs (inset 8px) */}
        <path
          d="M 180 8 L 298 8 L 352 300 L 298 592 L 62 592 L 8 300 Z"
          fill="url(#goldInner)"
          stroke="hsl(var(--dup-gold-400))"
          strokeWidth="3"
        />

        {/* Inner Crystal Panel - 165° felső/alsó csúcs (inset 16px) */}
        <path
          d="M 180 16 L 290 16 L 344 300 L 290 584 L 70 584 L 16 300 Z"
          fill="url(#crystalRadial)"
        />

        {/* Specular Highlight Overlay */}
        <path
          d="M 180 16 L 290 16 L 344 300 L 290 584 L 70 584 L 16 300 Z"
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
          d="M 180 16 L 290 16 L 344 300 L 290 584 L 70 584 L 16 300 Z"
          fill="url(#diagonalStripes)"
          opacity="0.7"
        />

        {/* Inner Glow (bottom shadow for 3D) */}
        <path
          d="M 180 16 L 290 16 L 344 300 L 290 584 L 70 584 L 16 300 Z"
          fill="none"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="8"
          style={{ filter: 'blur(6px)' }}
        />

        {/* Gold Inner Stroke (accent) */}
        <path
          d="M 180 16 L 290 16 L 344 300 L 290 584 L 70 584 L 16 300 Z"
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
