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
      {/* Külső fényglow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse"
        style={{ background: 'rgba(239, 68, 68, 0.4)' }}
      />

      {/* 3D Hexagon konténer */}
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-21 md:h-21 lg:w-25 lg:h-25">
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

        {/* Külső keret */}
        <div
          className="absolute inset-0 clip-hexagon bg-gradient-to-br from-red-900 via-red-600 to-red-800 border-2 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6),0_8px_25px_rgba(0,0,0,0.5)]"
          aria-hidden
        />

        {/* Középső keret */}
        <div
          className="absolute inset-[3px] clip-hexagon bg-gradient-to-b from-red-600 via-red-400 to-red-700"
          style={{ boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15)' }}
          aria-hidden
        />

        {/* Belső réteg */}
        <div
          className="absolute clip-hexagon bg-gradient-to-b from-red-400 via-red-500 to-red-700"
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

        {/* Tartalom: szív ikon + rang szám, ugyanazzal az elrendezéssel mint a többi hexagon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-10">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill="hsl(var(--foreground))"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="hsl(var(--destructive))"
              strokeWidth="1.5"
            />
          </svg>
          <span className="text-white text-[10px] sm:text-xs md:text-sm lg:text-base font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {value}
          </span>
        </div>
      </div>
    </>
  );
};
