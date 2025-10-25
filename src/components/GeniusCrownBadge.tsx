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

  // Spectacular SVG Gold Crown
  const crownSvg = (
    <svg 
      className={`${sizeClasses[size]}`}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crown base - deep gold gradient */}
      <defs>
        <linearGradient id="crownGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="crownShine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.2" />
        </linearGradient>
        <filter id="crownGlow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Glow effect */}
      <circle cx="12" cy="12" r="10" fill="url(#crownGold)" opacity="0.3" filter="url(#crownGlow)" />

      {/* Crown body */}
      <path 
        d="M3 18h18v2H3v-2zm0-7l3 3 3-6 3 6 3-3 3 6 3-6v10H3V11z" 
        fill="url(#crownGold)"
        stroke="#92400E"
        strokeWidth="0.5"
      />

      {/* Shine overlay */}
      <path 
        d="M3 18h18v1H3v-1z" 
        fill="url(#crownShine)"
        opacity="0.6"
      />

      {/* Crown points highlights */}
      <circle cx="6" cy="14" r="1.5" fill="#FEF3C7" opacity="0.9" />
      <circle cx="12" cy="8" r="1.5" fill="#FEF3C7" opacity="0.9" />
      <circle cx="18" cy="14" r="1.5" fill="#FEF3C7" opacity="0.9" />

      {/* Gemstones */}
      <circle cx="6" cy="14" r="0.8" fill="#DC2626" opacity="0.8" />
      <circle cx="12" cy="8" r="0.8" fill="#3B82F6" opacity="0.8" />
      <circle cx="18" cy="14" r="0.8" fill="#10B981" opacity="0.8" />
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

              {/* OUTER FRAME */}
              <div
                className="absolute inset-0 clip-hexagon bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 border-2 sm:border-4 border-yellow-400 shadow-lg shadow-yellow-500/50"
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

              {/* Crown SVG centered */}
              <div className="absolute inset-0 clip-hexagon flex items-center justify-center z-10">
                <div className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" style={{ animationDuration: '2s' }}>
                  {crownSvg}
                </div>
              </div>
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
  const crownIcon = (
    <div className="inline-flex drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" style={{ animationDuration: '2s' }}>
      {crownSvg}
    </div>
  );

  if (!showTooltip) {
    return crownIcon;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{crownIcon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold text-yellow-400">Genius tag</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
