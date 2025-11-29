import React from 'react';

interface RankHexagonProps {
  value: string | number;
  className?: string;
  onClick?: () => void;
}

/**
 * Dedicated Rank hexagon, teljesen megegyező 3D piros dizájnnal,
 * külön komponensként, hogy biztos távolság legyen ikon és szám között.
 */
export const RankHexagon: React.FC<RankHexagonProps> = ({ value, className = '', onClick }) => {
  const containerElement = onClick ? 'button' : 'div';
  const containerProps =
    onClick
      ? {
          onClick,
          type: 'button' as const,
          className: `relative ${className}`,
          style: {
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            display: 'block',
            verticalAlign: 'baseline',
            lineHeight: 0,
            cursor: 'pointer',
          },
        }
      : { className: `relative ${className}` };

  return React.createElement(
    containerElement,
    { ...containerProps, role: 'status', 'aria-label': `Rank: ${value}` },
    <>
      {/* Külső fényglow - pókerzöld */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse"
        style={{ background: 'rgba(34, 197, 94, 0.4)' }}
      />

      {/* 3D Hexagon konténer */}
      <div className="relative" style={{ width: 'clamp(48px, 8vh, 80px)', height: 'clamp(48px, 8vh, 80px)' }}>
        {/* Alap árnyék */}
        <div
          className="absolute clip-hexagon"
          style={{
            top: '3px',
            left: '3px',
            right: '-3px',
            bottom: '-3px',
            background: 'rgba(0,0,0,0.35)',
            filter: 'blur(3px)',
          }}
          aria-hidden
        />

        {/* Külső keret - pókerzöld */}
        <div
          className="absolute inset-0 clip-hexagon bg-gradient-to-br from-green-900 via-green-600 to-green-800 border-2 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.6),0_8px_25px_rgba(0,0,0,0.5)]"
          aria-hidden
        />

        {/* Középső keret - pókerzöld */}
        <div
          className="absolute inset-[3px] clip-hexagon bg-gradient-to-b from-green-600 via-green-400 to-green-700"
          style={{ boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15)' }}
          aria-hidden
        />

        {/* Belső réteg - pókerzöld */}
        <div
          className="absolute clip-hexagon bg-gradient-to-b from-green-400 via-green-500 to-green-700"
          style={{
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
            boxShadow:
              'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.15)',
          }}
          aria-hidden
        />

        {/* Fény kiemelés */}
        <div
          className="absolute clip-hexagon pointer-events-none"
          style={{
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
            background:
              'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)',
          }}
          aria-hidden
        />

        {/* Belső árnyék */}
        <div
          className="absolute clip-hexagon pointer-events-none"
          style={{
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.125)',
          }}
          aria-hidden
        />

        {/* Tartalom: serleg ikon + rang szám, együtt 4px-lel feljebb tolva */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ transform: 'translateY(-4px)', gap: 'clamp(2px, 0.5vh, 4px)' }}>
          <svg
            className="drop-shadow-lg"
            style={{ width: 'clamp(12px, 2vh, 20px)', height: 'clamp(12px, 2vh, 20px)' }}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Serleg/kupa ikon - fehér */}
            <path d="M6 9c0 3.866 2.686 7 6 7s6-3.134 6-7V4H6v5z" fill="white" stroke="white" strokeWidth="2"/>
            <path d="M6 9H4.5C3.67157 9 3 8.32843 3 7.5V6C3 5.17157 3.67157 4.5 4.5 4.5H6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18 9h1.5c.8284 0 1.5-.67157 1.5-1.5V6c0-.82843-.6716-1.5-1.5-1.5H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <rect x="9" y="16" width="6" height="4.5" rx="1" fill="white" stroke="white" strokeWidth="2"/>
            <line x1="7" y1="21" x2="17" y2="21" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ fontSize: 'clamp(0.625rem, 1.5vh, 1rem)', marginTop: 'clamp(4px, 1vh, 8px)' }}>
            {value}
          </span>
        </div>
      </div>
    </>
  );
};
