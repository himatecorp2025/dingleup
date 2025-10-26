import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HelpButtonProps {
  onClick: () => void;
  disabled?: boolean;
  color: 'blue' | 'green' | 'purple' | 'orange';
  children: ReactNode;
  className?: string;
}

export const HelpButton = ({ onClick, disabled, color, children, className }: HelpButtonProps) => {
  const clipPathId = `hexClip-help-${color}-${Math.random().toString(36).substr(2, 9)}`;
  
  const colorSchemes = {
    blue: {
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      border: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.6)',
      inner: 'from-blue-500/80 to-blue-700/80'
    },
    green: {
      gradient: 'from-green-400 via-green-500 to-green-600',
      border: '#22c55e',
      glow: 'rgba(34, 197, 94, 0.6)',
      inner: 'from-green-500/80 to-green-700/80'
    },
    purple: {
      gradient: 'from-purple-400 via-purple-500 to-purple-600',
      border: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.6)',
      inner: 'from-purple-500/80 to-purple-700/80'
    },
    orange: {
      gradient: 'from-orange-400 via-orange-500 to-orange-600',
      border: '#f97316',
      glow: 'rgba(249, 115, 22, 0.6)',
      inner: 'from-orange-500/80 to-orange-700/80'
    }
  };

  const colors = colorSchemes[color];

  return (
    <div className="relative" style={{ perspective: '600px' }}>
      {/* SVG clip-path definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id={clipPathId} clipPathUnits="objectBoundingBox">
            <path 
              shapeRendering="geometricPrecision"
              d="M 0.00000,0.50000 L 0.15287,0.04128 A 0.04667,0.13333 0 0 1 0.18667,0.00000 L 0.81333,0.00000 A 0.04667,0.13333 0 0 1 0.84713,0.04128 L 1.00000,0.50000 L 0.84713,0.95872 A 0.04667,0.13333 0 0 1 0.81333,1.00000 L 0.18667,1.00000 A 0.04667,0.13333 0 0 1 0.15287,0.95872 L 0.00000,0.50000 Z"
            />
          </clipPath>
        </defs>
      </svg>

      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "relative w-full text-white font-bold text-[10px] sm:text-xs md:text-sm flex flex-col items-center justify-center gap-0.5 transition-all",
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105',
          className
        )}
      >
        {/* BASE SHADOW */}
        <div 
          className="absolute inset-0 bg-black/60" 
          style={{ 
            transform: 'translate(3px, 3px)', 
            filter: 'blur(4px)', 
            clipPath: `url(#${clipPathId})` 
          }} 
          aria-hidden 
        />
        
        {/* OUTER FRAME */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} shadow-lg`} 
          style={{ 
            clipPath: `url(#${clipPathId})`, 
            transform: 'translateZ(0px)',
            boxShadow: `0 0 20px ${colors.glow}, 0 8px 25px rgba(0,0,0,0.5)`
          }} 
          aria-hidden 
        />
        
        {/* STROKE LAYER - egyenletes border */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 2px ${colors.border}`,
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        {/* MIDDLE FRAME */}
        <div 
          className="absolute inset-[3px] bg-gradient-to-b from-black/40 via-transparent to-black/60" 
          style={{ 
            clipPath: `url(#${clipPathId})`, 
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4)', 
            transform: 'translateZ(8px)' 
          }} 
          aria-hidden 
        />
        
        {/* INNER LAYER */}
        <div 
          className={`absolute bg-gradient-to-br ${colors.inner}`}
          style={{ 
            top: '6px',
            left: '10px',
            right: '10px',
            bottom: '6px',
            clipPath: `url(#${clipPathId})`, 
            boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.3)', 
            transform: 'translateZ(15px)' 
          }} 
          aria-hidden 
        />
        
        {/* SPECULAR HIGHLIGHT */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            top: '6px',
            left: '10px',
            right: '10px',
            bottom: '6px',
            clipPath: `url(#${clipPathId})`, 
            background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', 
            transform: 'translateZ(20px)' 
          }} 
          aria-hidden 
        />
        
        <div 
          className="relative z-10 font-poppins" 
          style={{ 
            transform: 'translateZ(25px)', 
            textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
            clipPath: `url(#${clipPathId})`
          }}
        >
          {children}
        </div>
      </button>
    </div>
  );
};
