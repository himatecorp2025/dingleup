import React, { PropsWithChildren } from 'react';

/**
 * HexShieldFrame
 * SVG alapú pajzs/hexagon keret a referencia képek pontos arányaihoz igazítva.
 * - Külső világos lila szegély
 * - Belső arany keret
 * - Lila panel finom facettákkal és 3D vastagság/shadow a jobb-alsó éleken
 * - Gyermek tartalom pozícionálása az inner panelen belül
 */
const HexShieldFrame: React.FC<PropsWithChildren<{ className?: string }>> = ({ children, className }) => {
  return (
    <div className={"relative " + (className ?? '')} style={{ width: 'clamp(320px, 75vw, 500px)', height: 'clamp(520px, 86vh, 680px)' }}>
      <svg viewBox="0 0 360 560" className="absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <linearGradient id="goldBevel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(var(--dup-gold-400))`} />
            <stop offset="50%" stopColor={`hsl(var(--dup-gold-500))`} />
            <stop offset="100%" stopColor={`hsl(var(--dup-gold-700))`} />
          </linearGradient>
          <linearGradient id="panelGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`hsl(var(--dup-purple-400))`} />
            <stop offset="60%" stopColor={`hsl(var(--dup-purple-600))`} />
            <stop offset="100%" stopColor={`hsl(var(--dup-purple-700))`} />
          </linearGradient>
          <linearGradient id="thicknessShade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(var(--dup-purple-300))`} stopOpacity={0.0} />
            <stop offset="70%" stopColor={`hsl(var(--dup-purple-800))`} stopOpacity={0.55} />
          </linearGradient>
        </defs>

        {/* 3D vastagság (jobb-alsó él) */}
        <polygon
          points="118,30 246,30 306,68 306,418 178,538 54,418 54,68"
          fill="url(#thicknessShade)"
        />

        {/* Külső világos keret */}
        <polygon
          points="110,20 250,20 310,60 310,420 180,540 50,420 50,60"
          fill={`hsl(var(--dup-purple-200))`}
        />

        {/* Arany középső keret (kitöltés) */}
        <polygon
          points="126,36 234,36 294,72 294,412 180,526 66,412 66,72"
          fill="url(#goldBevel)"
        />

        {/* Belső lila panel */}
        <polygon
          points="138,48 226,48 282,80 282,404 180,514 78,404 78,80"
          fill="url(#panelGradient)"
        />

        {/* Belső facetták (finom 3D) */}
        <g opacity="0.28">
          <polygon points="138,48 226,48 210,64 154,64" fill={`hsl(var(--dup-purple-300))`} />
          <polygon points="282,404 180,514 210,404" fill={`hsl(var(--dup-purple-800))`} />
          <polygon points="78,404 180,514 150,404" fill={`hsl(var(--dup-purple-900))`} />
        </g>

        {/* Belső arany stroke a panel körül – hangsúly */}
        <polygon
          points="138,48 226,48 282,80 282,404 180,514 78,404 78,80"
          fill="none"
          stroke="url(#goldBevel)"
          strokeWidth={6}
          strokeLinejoin="round"
        />

        {/* Oldalsó kiálló 3D bordák a referenciához */}
        <polygon points="38,98 50,60 50,420 38,402" fill={`hsl(var(--dup-purple-200))`} />
        <polygon points="322,98 310,60 310,420 322,402" fill={`hsl(var(--dup-purple-200))`} />
      </svg>

      {/* Tartalmi terület az inner panelen belül */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: '72px 64px 84px 64px' }}>
        {children}
      </div>
    </div>
  );
};

export default HexShieldFrame;
