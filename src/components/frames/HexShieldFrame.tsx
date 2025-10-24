import React, { PropsWithChildren } from 'react';

/**
 * HexShieldFrame - Flat-top hexagon pajzs, 3D specular fém keret + kristály panel
 * Referencia: You Win! popup - arany fém + lila kristály
 * - Flat-top geometria (széles, nem hegyes)
 * - Kétlépcsős arany keret (külső sötét, belső világos highlight)
 * - Lila kristály belső panel diagonális fénycsíkokkal
 * - Specular conic highlight a tetején
 * - 3D árnyékok és vastagság
 */
const HexShieldFrame: React.FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  return (
    <div className={`relative ${className ?? ''}`} 
         style={{ 
           width: 'min(92vw, 500px)', 
           height: 'clamp(540px, 88vh, 680px)'
         }}>
      
      {/* SVG Flat-Top Hexagon Layers */}
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

        {/* 3D Shadow Base (bottom-right offset) */}
        <path
          d="M 58 16 L 302 16 L 356 244 L 302 584 L 58 584 L 4 244 Z"
          fill="rgba(0,0,0,0.35)"
          transform="translate(6, 8)"
        />

        {/* Outer Gold Frame (darker) */}
        <path
          d="M 54 8 L 306 8 L 360 240 L 306 580 L 54 580 L 0 240 Z"
          fill="url(#goldOuter)"
          stroke="hsl(var(--dup-gold-800))"
          strokeWidth="2"
          filter="url(#depth-shadow)"
        />

        {/* Middle Gold Frame (lighter highlight) */}
        <path
          d="M 66 24 L 294 24 L 344 240 L 294 568 L 66 568 L 16 240 Z"
          fill="url(#goldInner)"
          stroke="hsl(var(--dup-gold-400))"
          strokeWidth="3"
        />

        {/* Inner Crystal Panel */}
        <path
          d="M 78 38 L 282 38 L 328 240 L 282 554 L 78 554 L 32 240 Z"
          fill="url(#crystalRadial)"
        />

        {/* Specular Highlight Overlay */}
        <path
          d="M 78 38 L 282 38 L 328 240 L 282 554 L 78 554 L 32 240 Z"
          fill="url(#specular)"
          opacity="0.4"
        />

        {/* Diagonal Light Streaks (stripes) */}
        <defs>
          <pattern id="diagonalStripes" patternUnits="userSpaceOnUse" width="60" height="60" patternTransform="rotate(45)">
            <rect x="0" y="0" width="12" height="60" fill="rgba(255,255,255,0.08)" />
            <rect x="24" y="0" width="8" height="60" fill="rgba(255,255,255,0.06)" />
            <rect x="48" y="0" width="6" height="60" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>
        <path
          d="M 78 38 L 282 38 L 328 240 L 282 554 L 78 554 L 32 240 Z"
          fill="url(#diagonalStripes)"
          opacity="0.7"
        />

        {/* Inner Glow (bottom shadow for 3D) */}
        <path
          d="M 78 38 L 282 38 L 328 240 L 282 554 L 78 554 L 32 240 Z"
          fill="none"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="8"
          style={{ filter: 'blur(6px)' }}
        />

        {/* Gold Inner Stroke (accent) */}
        <path
          d="M 78 38 L 282 38 L 328 240 L 282 554 L 78 554 L 32 240 Z"
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
