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
    booster: {
      gradientOuter: active ? 'from-orange-600 via-orange-500 to-orange-800' : 'from-yellow-600 via-yellow-500 to-yellow-800',
      gradientMiddle: active ? 'from-orange-500 via-orange-400 to-orange-700' : 'from-yellow-500 via-yellow-400 to-yellow-700',
      gradientInner: active ? 'from-orange-400 via-orange-500 to-orange-600' : 'from-yellow-400 via-yellow-500 to-yellow-600',
      borderColor: active ? 'border-orange-500' : 'border-yellow-500',
      shadowColor: active
        ? 'shadow-[0_0_20px_rgba(249,115,22,0.6),0_8px_25px_rgba(0,0,0,0.5)]'
        : 'shadow-[0_0_20px_rgba(234,179,8,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      hoverShadow: active
        ? 'hover:shadow-[0_0_30px_rgba(249,115,22,0.8),0_12px_30px_rgba(0,0,0,0.6)]'
        : 'hover:shadow-[0_0_30px_rgba(234,179,8,0.8),0_12px_30px_rgba(0,0,0,0.6)]',
      glowColor: active ? 'rgba(249,115,22,0.4)' : 'rgba(234,179,8,0.4)',
      textColor: active ? 'text-white' : 'text-black',
      iconColor: active ? '#ffffff' : '#000000',
    },
    shop: {
      gradientOuter: 'from-yellow-600 via-yellow-500 to-yellow-800',
      gradientMiddle: 'from-yellow-500 via-yellow-400 to-yellow-700',
      gradientInner: 'from-yellow-400 via-yellow-500 to-yellow-600',
      borderColor: 'border-yellow-400',
      shadowColor: 'shadow-[0_0_15px_rgba(234,179,8,0.6),0_6px_20px_rgba(0,0,0,0.5)]',
      hoverShadow: 'hover:shadow-[0_0_25px_rgba(234,179,8,0.8),0_10px_25px_rgba(0,0,0,0.6)]',
      glowColor: 'rgba(234,179,8,0.3)',
      textColor: 'text-gray-100',
      iconColor: '#f3f4f6',
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

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full ${sizeClasses[size]} font-black rounded-2xl transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
      } ${className}`}
      style={{
        clipPath: size === 'sm' ? 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' : 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
      }}
    >
      {/* Badge indicator */}
      {badge && (
        <span className="absolute -top-1 -right-1 z-20">
          {badge}
        </span>
      )}

      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse -z-10"
        style={{ background: colors.glowColor }}
      />

      {/* 3D Shadow base */}
      <div
        className="absolute inset-0 bg-black/60 blur-md"
        style={{
          clipPath: size === 'sm' ? 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' : 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          transform: 'translate(2px, 3px)',
        }}
      />

      {/* Outer frame - darkest */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradientOuter} border-2 ${colors.borderColor} ${colors.shadowColor} ${!disabled && colors.hoverShadow}`}
        style={{
          clipPath: size === 'sm' ? 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' : 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
        }}
      />

      {/* Middle layer */}
      <div
        className={`absolute inset-[3px] bg-gradient-to-br ${colors.gradientMiddle}`}
        style={{
          clipPath: size === 'sm' ? 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' : 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.2)',
        }}
      />

      {/* Inner layer with diamond pattern */}
      <div
        className={`absolute inset-[5px] bg-gradient-to-b ${colors.gradientInner}`}
        style={{
          clipPath: size === 'sm' ? 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' : 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.5), inset 0 -3px 0 rgba(0,0,0,0.4)',
        }}
      />

      {/* Diamond cross pattern overlay */}
      <div
        className="absolute inset-[5px] pointer-events-none"
        style={{
          clipPath: size === 'sm' ? 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' : 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          background:
            'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
          opacity: 0.7,
        }}
      />

      {/* Specular highlight */}
      <div
        className="absolute inset-[5px] pointer-events-none"
        style={{
          clipPath: size === 'sm' ? 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' : 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4), transparent 60%)',
        }}
      />

      {/* Content */}
      <div className={`relative z-10 flex items-center justify-center ${colors.textColor} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
        {children}
      </div>
    </button>
  );
};
