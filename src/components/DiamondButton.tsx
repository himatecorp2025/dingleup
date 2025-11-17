import React, { ReactNode } from 'react';

interface DiamondButtonProps {
  onClick?: () => void;
  variant: 'play' | 'share' | 'leaderboard';
  children: ReactNode;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  badge?: ReactNode;
  style?: React.CSSProperties;
}

/**
 * 3D Diamond Button with SVG icons
 * Hexagonal shape with diamond cross pattern
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
  style,
}) => {
  // Variant color schemes
  const variants = {
    play: {
      gradientOuter: 'from-green-700 via-green-600 to-green-900',
      gradientMiddle: 'from-green-600 via-green-500 to-green-800',
      gradientInner: 'from-green-500 via-green-600 to-green-700',
      borderColor: 'border-green-400',
      shadowColor: 'shadow-[0_0_20px_rgba(34,197,94,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.8),0_12px_30px_rgba(0,0,0,0.6)]',
      glowColor: 'rgba(34,197,94,0.4)',
      textColor: 'text-white',
      iconColor: '#ffffff',
    },
    share: {
      gradientOuter: 'from-blue-700 via-blue-600 to-blue-900',
      gradientMiddle: 'from-blue-600 via-blue-500 to-blue-800',
      gradientInner: 'from-blue-500 via-blue-600 to-blue-700',
      borderColor: 'border-blue-400',
      shadowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.5),0_6px_20px_rgba(0,0,0,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.7),0_10px_25px_rgba(0,0,0,0.6)]',
      glowColor: 'rgba(59,130,246,0.3)',
      textColor: 'text-white',
      iconColor: '#ffffff',
    },
    leaderboard: {
      gradientOuter: 'from-purple-700 via-purple-600 to-purple-900',
      gradientMiddle: 'from-purple-600 via-purple-500 to-purple-800',
      gradientInner: 'from-purple-500 via-purple-600 to-purple-700',
      borderColor: 'border-purple-600',
      shadowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.5),0_8px_25px_rgba(0,0,0,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.7),0_12px_30px_rgba(0,0,0,0.6)]',
      glowColor: 'rgba(168,85,247,0.3)',
      textColor: 'text-white',
      iconColor: '#ffffff',
    },
  };

  const colors = variants[variant];

  // Size classes
  const sizeClasses = {
    sm: 'py-2 px-2 text-xs',
    md: 'py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base',
    lg: 'py-2 sm:py-2.5 px-4 sm:px-5 text-base sm:text-lg',
  };

  const hexPath = size === 'sm' 
    ? 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' 
    : 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)';
  
  const hexInnerPath = size === 'sm'
    ? 'polygon(10% 0.6%, 90% 0%, 100% 50%, 90% 100%, 10% 99.4%, 0% 50%)'
    : 'polygon(8% 0.6%, 92% 0%, 100% 50%, 92% 100%, 8% 99.4%, 0% 50%)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full ${sizeClasses[size]} font-black transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
      } ${className}`}
      style={{
        clipPath: hexPath,
        ...style,
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
          top: '4px',
          left: '4px',
          right: '-4px',
          bottom: '-4px',
          clipPath: hexPath,
          background: 'rgba(0,0,0,0.35)',
          filter: 'blur(4px)',
        }}
        aria-hidden
      />

      {/* OUTER FRAME - gradient with border */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradientOuter} ${colors.shadowColor} ${!disabled && colors.hoverShadow}`}
        style={{
          clipPath: hexPath,
          boxShadow: `inset 0 0 0 2px ${colors.borderColor.replace('border-', 'hsl(var(--')})`,
        }}
        aria-hidden
      />

      {/* MIDDLE GOLD/COLOR FRAME (bright inner highlight) */}
      <div
        className={`absolute inset-[3px] bg-gradient-to-b ${colors.gradientMiddle}`}
        style={{
          clipPath: hexPath,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
        aria-hidden
      />

      {/* INNER CRYSTAL/COLOR LAYER */}
      <div
        className={`absolute bg-gradient-to-b ${colors.gradientInner}`}
        style={{
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          clipPath: hexInnerPath,
          boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)',
        }}
        aria-hidden
      />

      {/* SPECULAR HIGHLIGHT (top-left) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          clipPath: hexInnerPath,
          background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)',
        }}
        aria-hidden
      />

      {/* INNER GLOW (bottom shadow for 3D depth) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          clipPath: hexInnerPath,
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.25)',
        }}
        aria-hidden
      />

      {/* 45° SHINE (animated, clipped to hex) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5px',
          left: '5px',
          right: '5px',
          bottom: '5px',
          clipPath: hexInnerPath,
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          style={{
            background: 'linear-gradient(45deg, transparent 46%, rgba(255,215,0,0.6) 50%, transparent 54%)',
            animation: 'slot-shine 2s linear infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 flex items-center justify-center ${colors.textColor}`}>
        {children}
      </div>

      <style>{`
        @keyframes slot-shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
      `}</style>
    </button>
  );
};
