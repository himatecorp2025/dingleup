import React, { ReactNode } from 'react';

interface DiamondButtonProps {
  onClick?: () => void;
  variant: 'play' | 'booster' | 'shop' | 'share' | 'leaderboard';
  children: ReactNode;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  badge?: ReactNode;
}

// POINTY-TOP hexagon paths (same as HexAcceptButton)
const HEX_PATH = "polygon(50% 0%, 92% 22.114%, 92% 77.886%, 50% 100%, 8% 77.886%, 8% 22.114%)";
const HEX_INNER_PATH = "polygon(50% 0.6%, 92% 22.114%, 92% 77.886%, 50% 99.4%, 8% 77.886%, 8% 22.114%)";

/**
 * 3D Diamond Button with hexagon shape - MEGSZERZEM MOST style
 * Uses layered hexagon approach with variant-specific crystal colors
 */
export const DiamondButton: React.FC<DiamondButtonProps> = ({
  onClick,
  variant,
  children,
  className = '',
  active = false,
  disabled = false,
  size = 'lg',
  badge,
}) => {
  // Variant-specific crystal gradients (inner fill)
  const crystalColors = {
    play: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(155 90% 82%) 0%, hsl(155 85% 68%) 30%, hsl(155 78% 58%) 60%, hsl(155 70% 45%) 100%)',
    booster: active 
      ? 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(25 95% 75%) 0%, hsl(25 90% 65%) 30%, hsl(25 85% 55%) 60%, hsl(25 78% 48%) 100%)'
      : 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(45 95% 75%) 0%, hsl(45 90% 65%) 30%, hsl(45 85% 55%) 60%, hsl(45 78% 48%) 100%)',
    shop: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(45 95% 75%) 0%, hsl(45 90% 65%) 30%, hsl(45 85% 55%) 60%, hsl(45 78% 48%) 100%)',
    share: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(215 90% 82%) 0%, hsl(215 85% 68%) 30%, hsl(215 78% 58%) 60%, hsl(215 70% 45%) 100%)',
    leaderboard: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(280 90% 82%) 0%, hsl(280 85% 68%) 30%, hsl(280 78% 58%) 60%, hsl(280 70% 45%) 100%)',
  };

  const crystal = crystalColors[variant];

  // Size configuration
  const sizeConfig = {
    sm: { width: '80px', height: '50px', iconSize: '18px', fontSize: '9px' },
    md: { width: '100px', height: '60px', iconSize: '22px', fontSize: '11px' },
    lg: { width: '120px', height: '70px', iconSize: '26px', fontSize: '12px' },
  };

  const config = sizeConfig[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative grid place-items-center select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        width: config.width,
        height: config.height,
        boxSizing: 'border-box',
        outline: 'none',
        border: 0,
        animation: 'diamond-button-pulse 2s ease-in-out infinite',
      }}
    >
      {/* Badge indicator */}
      {badge && (
        <span className="absolute -top-1 -right-1 z-20">
          {badge}
        </span>
      )}

      {/* BASE SHADOW (3D depth) */}
      <div
        className="absolute"
        style={{
          top: '3px',
          left: '3px',
          right: '-3px',
          bottom: '-3px',
          clipPath: HEX_PATH,
          background: 'rgba(0,0,0,0.35)',
          filter: 'blur(3px)',
        }}
        aria-hidden
      />

      {/* OUTER GOLD FRAME (dark diagonal gradient) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: HEX_PATH,
          background:
            'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
          boxShadow:
            'inset 0 0 0 1.5px hsl(var(--dup-gold-900)), 0 4px 12px rgba(0,0,0,0.35)',
        }}
        aria-hidden
      />

      {/* MIDDLE GOLD FRAME (bright inner highlight) */}
      <div
        className="absolute inset-[2px]"
        style={{
          clipPath: HEX_PATH,
          background:
            'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
          boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))',
        }}
        aria-hidden
      />

      {/* INNER CRYSTAL (variant color) */}
      <div
        className="absolute"
        style={{
          top: '4px',
          left: '4px', 
          right: '4px',
          bottom: '4px',
          clipPath: HEX_INNER_PATH,
          background: crystal,
          boxShadow:
            'inset 0 8px 16px rgba(255,255,255,0.25), inset 0 -8px 16px rgba(0,0,0,0.4)',
        }}
        aria-hidden
      />

      {/* SPECULAR HIGHLIGHT */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '4px',
          left: '4px',
          right: '4px', 
          bottom: '4px',
          clipPath: HEX_INNER_PATH,
          background:
            'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)',
        }}
        aria-hidden
      />

      {/* DIAGONAL LIGHT STREAKS */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '4px',
          left: '4px',
          right: '4px',
          bottom: '4px',
          clipPath: HEX_INNER_PATH,
          background:
            'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 9px, transparent 9px, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 18px)',
          opacity: 0.7,
        }}
        aria-hidden
      />

      {/* GOLD INNER ACCENT STROKE */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '4px',
          left: '4px',
          right: '4px',
          bottom: '4px',
          clipPath: HEX_INNER_PATH,
          boxShadow:
            'inset 0 0 0 0.8px hsla(var(--dup-gold-400) / 0.6)',
        }}
        aria-hidden
      />

      {/* 45° SHINE (animated) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '4px',
          left: '4px',
          right: '4px',
          bottom: '4px',
          clipPath: HEX_INNER_PATH,
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          style={{
            background:
              'linear-gradient(45deg, transparent 46%, rgba(255,215,0,0.4) 50%, transparent 54%)',
            animation: 'slot-shine 2.5s linear infinite',
          }}
        />
      </div>

      {/* CONTENT (icon + text) */}
      <div 
        className="relative z-[1] text-white"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
          fontSize: config.iconSize,
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes diamond-button-pulse {
          0%, 100% { 
            transform: scale(1);
            filter: brightness(1) drop-shadow(0 0 4px rgba(255,215,0,0.3));
          }
          50% { 
            transform: scale(1.02);
            filter: brightness(1.08) drop-shadow(0 0 10px rgba(255,215,0,0.5));
          }
        }
        
        @keyframes slot-shine {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(100%) translateY(100%); }
        }
      `}</style>
    </button>
  );
};