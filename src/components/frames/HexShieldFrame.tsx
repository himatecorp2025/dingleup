import React, { PropsWithChildren } from 'react';

/**
 * HexShieldFrame - POINTY-TOP hexagon pajzs (trapéz), 3D specular fém keret + kristály panel
 * Referencia: Daily Gift popup - arany fém + lila kristály
 * - POINTY-TOP geometria: 165° interior angles at top/bottom vertices
 * - Shield: Magasság -10% (5% fel, 5% le), szélesség +6% (3% bal, 3% jobb)
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
      
      {/* Shine sweep - 120° (reverse direction), fills shield diagonally */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: '46px',
          left: '34px',
          right: '34px', 
          bottom: '46px',
          clipPath: 'polygon(50% 0%, 92% 4.756%, 92% 95.244%, 50% 100%, 8% 95.244%, 8% 4.756%)',
          overflow: 'hidden',
          zIndex: 5
        }}
      >
        <div 
          className="absolute w-[300%] h-[300%]"
          style={{
            top: '-100%',
            left: '-100%',
            background: 'linear-gradient(120deg, transparent 30%, rgba(255,215,0,0.55) 46%, rgba(255,255,255,0.85) 50%, rgba(255,215,0,0.55) 54%, transparent 70%)',
            backgroundSize: '300% 300%',
            backgroundRepeat: 'no-repeat',
            animation: 'shine-120 3s linear infinite'
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

        {/* 3D Shadow Base - 165°, magasság -10%, szélesség +6% */}
        <path
          d="M 180 30 L 342 58.536 L 342 541.464 L 180 570 L 18 541.464 L 18 58.536 Z"
          fill="rgba(0,0,0,0.35)"
          transform="translate(6, 8)"
        />

        {/* Outer Gold Frame - 165°, adjusted proportions */}
        <path
          d="M 180 30 L 342 58.536 L 342 541.464 L 180 570 L 18 541.464 L 18 58.536 Z"
          fill="url(#goldOuter)"
          stroke="hsl(var(--dup-gold-800))"
          strokeWidth="2"
          filter="url(#depth-shadow)"
        />

        {/* Middle Gold Frame - 165° (inset 8px) */}
        <path
          d="M 180 38 L 334 66.536 L 334 533.464 L 180 562 L 26 533.464 L 26 66.536 Z"
          fill="url(#goldInner)"
          stroke="hsl(var(--dup-gold-400))"
          strokeWidth="3"
        />

        {/* Inner Crystal Panel - 165° (inset 16px) */}
        <path
          d="M 180 46 L 326 74.536 L 326 525.464 L 180 554 L 34 525.464 L 34 74.536 Z"
          fill="url(#crystalRadial)"
        />

        {/* Specular Highlight Overlay */}
        <path
          d="M 180 46 L 326 74.536 L 326 525.464 L 180 554 L 34 525.464 L 34 74.536 Z"
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
          d="M 180 46 L 326 74.536 L 326 525.464 L 180 554 L 34 525.464 L 34 74.536 Z"
          fill="url(#diagonalStripes)"
          opacity="0.7"
        />

        {/* Inner Glow (bottom shadow for 3D) */}
        <path
          d="M 180 46 L 326 74.536 L 326 525.464 L 180 554 L 34 525.464 L 34 74.536 Z"
          fill="none"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="8"
          style={{ filter: 'blur(6px)' }}
        />

        {/* Gold Inner Stroke (accent) */}
        <path
          d="M 180 46 L 326 74.536 L 326 525.464 L 180 554 L 34 525.464 L 34 74.536 Z"
          fill="none"
          stroke="url(#goldInner)"
          strokeWidth="2"
          opacity="0.8"
        />
      </svg>

      {/* Content Container (positioned over crystal panel) */}
      <div className="absolute inset-0 flex flex-col z-10" style={{ padding: '64px 52px 72px 52px' }}>
        {children}
      </div>
    </div>
  );
};

export default HexShieldFrame;
