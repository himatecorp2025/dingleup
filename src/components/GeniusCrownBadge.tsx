import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface GeniusCrownBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  asHexagon?: boolean; // New prop for hexagon variant
}

export const GeniusCrownBadge = ({ size = 'md', showTooltip = true, asHexagon = false }: GeniusCrownBadgeProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Spectacular SVG "G" Letter for Genius - Perfectly centered
  const geniusSvg = (sizeClass?: string) => (
    <svg 
      className={sizeClass || sizeClasses[size]}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gold gradient definitions */}
      <defs>
        <linearGradient id="geniusGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="geniusShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.3" />
        </linearGradient>
        <filter id="geniusGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Glow effect */}
      <circle cx="12" cy="12" r="11" fill="url(#geniusGold)" opacity="0.3" filter="url(#geniusGlow)" />

      {/* Bold "G" Letter Path - Centered at 12,12 with sub-pixel X offset to correct visual shift */}
      <g transform="translate(12, 12) translate(-0.75, 0)">
        <path 
          d="M 2.5 -10 C -3 -10 -8 -5.5 -8 0 C -8 5.5 -3 10 2.5 10 C 5.5 10 8 8.8 9.2 6.8 L 9.2 0.5 L 2 0.5 L 2 3.5 L 6 3.5 L 6 5.5 C 5 6.8 3.8 7.5 2.5 7.5 C -1.5 7.5 -5 4.5 -5 0 C -5 -4.5 -1.5 -7.5 2.5 -7.5 C 4.5 -7.5 6.2 -6.7 7.5 -5.2 L 9.5 -7.2 C 7.5 -9.2 5.2 -10 2.5 -10 Z" 
          fill="url(#geniusGold)"
          stroke="#92400E"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dark shadow for depth */}
        <path 
          d="M 2.5 -10 C -3 -10 -8 -5.5 -8 0 C -8 5.5 -3 10 2.5 10 C 5.5 10 8 8.8 9.2 6.8 L 9.2 0.5 L 2 0.5 L 2 3.5 L 6 3.5 L 6 5.5 C 5 6.8 3.8 7.5 2.5 7.5 C -1.5 7.5 -5 4.5 -5 0 C -5 -4.5 -1.5 -7.5 2.5 -7.5 C 4.5 -7.5 6.2 -6.7 7.5 -5.2 L 9.5 -7.2 C 7.5 -9.2 5.2 -10 2.5 -10 Z" 
          fill="none"
          stroke="#654321"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />

        {/* Shine overlay on G */}
        <path 
          d="M 2.5 -10 C -3 -10 -8 -5.5 -8 0 C -8 5.5 -3 10 2.5 10 C 5.5 10 8 8.8 9.2 6.8 L 9.2 0.5 L 2 0.5 L 2 3.5 L 6 3.5 L 6 5.5 C 5 6.8 3.8 7.5 2.5 7.5 C -1.5 7.5 -5 4.5 -5 0 C -5 -4.5 -1.5 -7.5 2.5 -7.5 C 4.5 -7.5 6.2 -6.7 7.5 -5.2 L 9.5 -7.2 C 7.5 -9.2 5.2 -10 2.5 -10 Z" 
          fill="url(#geniusShine)"
          opacity="0.5"
        />
      </g>

      {/* Sparkle effects */}
      <circle cx="8" cy="8" r="1" fill="#FEF3C7" opacity="0.8" />
      <circle cx="17" cy="10" r="0.8" fill="#FEF3C7" opacity="0.8" />
      <circle cx="10" cy="17" r="0.7" fill="#FEF3C7" opacity="0.8" />
    </svg>
  );

  // Hexagon version for dashboard
  if (asHexagon) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="relative w-12 h-12 sm:w-16 sm:h-16 aspect-square hover:scale-105 transition-transform cursor-pointer"
              style={{ perspective: '500px' }}
            >
              {/* BASE SHADOW */}
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

              {/* OUTER FRAME with intense sparkle animation */}
              <div
                className="absolute inset-0 clip-hexagon bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 border-2 sm:border-4 border-yellow-400 shadow-lg shadow-yellow-500/50"
                style={{
                  animation: 'hexagonSparkle 1.2s ease-in-out infinite'
                }}
                aria-hidden
              />

              {/* MIDDLE FRAME */}
              <div
                className="absolute inset-[3px] clip-hexagon bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-600"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                aria-hidden
              />

              {/* INNER LAYER */}
              <div
                className="absolute clip-hexagon bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600"
                style={{
                  top: '5px',
                  left: '5px',
                  right: '5px',
                  bottom: '5px',
                  boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)',
                }}
                aria-hidden
              />

              {/* SPECULAR HIGHLIGHT */}
              <div
                className="absolute clip-hexagon pointer-events-none"
                style={{
                  top: '5px',
                  left: '5px',
                  right: '5px',
                  bottom: '5px',
                  background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)',
                }}
                aria-hidden
              />

              {/* Sparkle dots around hexagon */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-1 h-1 bg-yellow-200 rounded-full" style={{ top: '10%', left: '20%', animation: 'twinkle 1s ease-in-out infinite' }} />
                <div className="absolute w-1 h-1 bg-yellow-200 rounded-full" style={{ top: '20%', right: '15%', animation: 'twinkle 1.3s ease-in-out infinite 0.2s' }} />
                <div className="absolute w-1 h-1 bg-yellow-200 rounded-full" style={{ bottom: '25%', left: '15%', animation: 'twinkle 1.5s ease-in-out infinite 0.4s' }} />
                <div className="absolute w-1 h-1 bg-yellow-200 rounded-full" style={{ bottom: '20%', right: '20%', animation: 'twinkle 1.2s ease-in-out infinite 0.6s' }} />
              </div>

              {/* "G" Letter SVG centered - 75% size, perfectly centered horizontally AND vertically */}
              <div className="absolute inset-0 clip-hexagon flex items-center justify-center z-10">
                <div style={{ 
                  width: '75%', 
                  height: '75%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  animation: 'geniusShimmer 1s ease-in-out infinite'
                }}>
                  {geniusSvg('w-full h-full')}
                </div>
              </div>

              {/* Keyframe animations */}
              <style>{`
                @keyframes hexagonSparkle {
                  0%, 100% {
                    filter: brightness(1) drop-shadow(0 0 12px rgba(251, 191, 36, 0.8));
                    box-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
                  }
                  50% {
                    filter: brightness(1.5) drop-shadow(0 0 25px rgba(251, 191, 36, 1)) drop-shadow(0 0 35px rgba(251, 191, 36, 0.9));
                    box-shadow: 0 0 30px rgba(251, 191, 36, 1);
                  }
                }

                @keyframes geniusShimmer {
                  0%, 100% {
                    filter: brightness(1.1) drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
                  }
                  50% {
                    filter: brightness(1.4) drop-shadow(0 0 18px rgba(251, 191, 36, 1)) drop-shadow(0 0 25px rgba(251, 191, 36, 0.8));
                  }
                }

                @keyframes twinkle {
                  0%, 100% {
                    opacity: 0;
                    transform: scale(0.5);
                  }
                  50% {
                    opacity: 1;
                    transform: scale(1.2);
                  }
                }
              `}</style>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-bold text-yellow-400">Genius Tag</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Inline small version
  const geniusIcon = (
    <div className="inline-flex drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" style={{ animationDuration: '2s' }}>
      {geniusSvg()}
    </div>
  );

  if (!showTooltip) {
    return geniusIcon;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{geniusIcon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold text-yellow-400">Genius tag</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
