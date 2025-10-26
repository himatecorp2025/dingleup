import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface HexagonActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'play' | 'booster' | 'share' | 'leaderboard' | 'default';
  show3DLine?: boolean;
  active?: boolean;
  badge?: ReactNode;
}

export const HexagonActionButton = ({ 
  children, 
  variant = 'default',
  show3DLine = false,
  active = false,
  badge,
  className,
  disabled,
  ...props 
}: HexagonActionButtonProps) => {
  const borderWidth = 4;
  const clipPathId = `hexClip-button-${Math.random().toString(36).substr(2, 9)}`;
  
  // Variant colors
  const variantColors = {
    play: {
      border: '#10b981',
      gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
      inner: 'from-emerald-500/90 to-emerald-700/90',
      glow: 'rgba(16, 185, 129, 0.6)',
    },
    booster: active ? {
      border: '#fb923c',
      gradient: 'from-orange-400 via-orange-500 to-orange-600',
      inner: 'from-orange-500/90 to-orange-700/90',
      glow: 'rgba(251, 146, 60, 0.6)',
    } : {
      border: '#ea580c',
      gradient: 'from-orange-500 via-orange-600 to-orange-700',
      inner: 'from-slate-900/90 to-slate-950/90',
      glow: 'rgba(234, 88, 12, 0.6)',
    },
    share: {
      border: '#3b82f6',
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      inner: 'from-slate-900/90 to-slate-950/90',
      glow: 'rgba(59, 130, 246, 0.6)',
    },
    leaderboard: {
      border: '#a855f7',
      gradient: 'from-purple-400 via-purple-500 to-purple-600',
      inner: 'from-slate-900/90 to-slate-950/90',
      glow: 'rgba(168, 85, 247, 0.6)',
    },
    default: {
      border: '#fde047',
      gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
      inner: 'from-slate-900/90 to-slate-950/90',
      glow: 'rgba(250, 204, 21, 0.4)',
    }
  };

  const colors = variantColors[variant];

  return (
    <div className="w-full flex justify-center relative">
      {/* SVG clip-path definition - EXACT HEXAGON */}
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
        disabled={disabled}
        className={cn(
          "w-full touch-manipulation group relative overflow-visible",
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        {...props}
      >
        {/* 3D LINE BEHIND BUTTON - full viewport width */}
        {show3DLine && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0"
            style={{
              width: '100vw',
              zIndex: -1,
            }}
          >
            {/* Shadow layer */}
            <div 
              className="absolute inset-0"
              style={{
                borderTop: `${borderWidth + 2}px solid rgba(0,0,0,0.4)`,
                transform: 'translateY(4px)',
                filter: 'blur(8px)',
              }}
              aria-hidden
            />
            {/* Main gradient line */}
            <div 
              className="absolute inset-0"
              style={{
                borderTop: `${borderWidth + 2}px solid ${colors.border}`,
                boxShadow: `0 0 30px ${colors.glow}, 0 4px 15px ${colors.glow}, inset 0 -3px 6px rgba(0,0,0,0.7), inset 0 3px 6px rgba(255,255,255,0.4)`,
              }}
              aria-hidden
            />
          </div>
        )}

        {/* Badge (top-right corner) */}
        {badge && (
          <div className="absolute -top-1 -right-1 z-50">
            {badge}
          </div>
        )}

        {/* BASE SHADOW */}
        <div 
          className="absolute inset-0 bg-black/80" 
          style={{ 
            transform: 'translate(8px, 8px) translateZ(-10px)', 
            filter: 'blur(12px)',
            clipPath: `url(#${clipPathId})`
          }} 
          aria-hidden 
        />
        
        {/* OUTER FRAME */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} shadow-2xl opacity-95 transition-all duration-300`}
          style={{
            transform: 'translateZ(0px)',
            boxShadow: `0 0 30px ${colors.glow}, 0 15px 40px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,255,0.4)`,
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        {/* MIDDLE FRAME */}
        <div 
          className="absolute inset-[5px] bg-gradient-to-b from-black/60 via-transparent to-black/80"
          style={{
            boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.6)',
            transform: 'translateZ(15px)',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        {/* INNER LAYER */}
        <div 
          className={`absolute bg-gradient-to-br ${colors.inner} transition-all duration-300`}
          style={{
            top: '10px',
            left: '20px',
            right: '20px',
            bottom: '10px',
            boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.2), inset 0 -16px 32px rgba(0,0,0,0.5)',
            transform: 'translateZ(25px)',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        {/* SPECULAR HIGHLIGHT */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '10px',
            left: '20px',
            right: '20px',
            bottom: '10px',
            background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)',
            transform: 'translateZ(35px)',
            clipPath: `url(#${clipPathId})`
          }}
          aria-hidden
        />
        
        <div 
          className={`relative px-6 py-4 transition-all duration-300 ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
          }`}
          style={{
            transform: 'translateZ(40px)',
            clipPath: `url(#${clipPathId})`
          }}
        >
          <div className="flex items-center justify-center text-white font-bold">
            {children}
          </div>
        </div>
      </button>
    </div>
  );
};
