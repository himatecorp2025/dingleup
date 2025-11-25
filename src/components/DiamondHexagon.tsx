import React from 'react';
import { useI18n } from '@/i18n/useI18n';

interface DiamondHexagonProps {
  type: 'rank' | 'coins' | 'lives' | 'avatar';
  value: string | number;
  className?: string;
  avatarUrl?: string | null;
  onClick?: () => void;
}

/**
 * 3D Diamond Hexagon with SVG icons
 * Responsive design with diamond cross pattern
 */
export const DiamondHexagon: React.FC<DiamondHexagonProps> = ({ type, value, className = '', avatarUrl, onClick }) => {
  const { t } = useI18n();
  // Color schemes per type
  const colorSchemes = {
    rank: {
      gradientOuter: 'from-primary-dark via-primary to-primary-darker',
      gradientMiddle: 'from-primary via-primary-glow to-primary-dark',
      gradientInner: 'from-primary-glow via-primary to-primary-dark',
      borderColor: 'border-primary',
      shadowColor: 'shadow-[0_0_20px_hsl(var(--primary)/0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'hsl(var(--primary) / 0.4)',
      iconColor: 'hsl(var(--foreground))',
    },
    coins: {
      gradientOuter: 'from-yellow-900 via-yellow-600 to-yellow-800',
      gradientMiddle: 'from-yellow-600 via-yellow-400 to-yellow-700',
      gradientInner: 'from-yellow-400 via-yellow-500 to-yellow-700',
      borderColor: 'border-yellow-400',
      shadowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'rgba(234, 179, 8, 0.4)',
      iconColor: 'hsl(var(--foreground))',
    },
    lives: {
      gradientOuter: 'from-red-900 via-red-600 to-red-800',
      gradientMiddle: 'from-red-600 via-red-400 to-red-700',
      gradientInner: 'from-red-400 via-red-500 to-red-700',
      borderColor: 'border-red-400',
      shadowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'rgba(239, 68, 68, 0.4)',
      iconColor: 'hsl(var(--foreground))',
    },
    avatar: {
      gradientOuter: 'from-purple-900 via-purple-600 to-purple-800',
      gradientMiddle: 'from-purple-600 via-purple-400 to-purple-700',
      gradientInner: 'from-purple-400 via-purple-500 to-purple-700',
      borderColor: 'border-purple-400',
      shadowColor: 'shadow-[0_0_20px_rgba(168,85,247,0.6),0_8px_25px_rgba(0,0,0,0.5)]',
      glowColor: 'rgba(168, 85, 247, 0.4)',
      iconColor: 'hsl(var(--foreground))',
    },
  };

  const colors = colorSchemes[type];

  // SVG Icons
  const renderIcon = () => {
    const iconSize = 16; // Base size for mobile
    const color = colors.iconColor;

    switch (type) {
      case 'rank':
        // Crown SVG - simple 3-prong line crown, same class as coin/heart
        return (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* bottom oval */}
            <ellipse cx="12" cy="17" rx="5" ry="1.5" stroke={color} strokeWidth="1.5" />
            {/* crown arc */}
            <path
              d="M5 15C6.5 11 9 9 12 9C15 9 17.5 11 19 15"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* three prongs */}
            <path d="M8 11L7 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 10L12 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 11L17 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            {/* circles on top */}
            <circle cx="7" cy="6" r="1" fill={color} />
            <circle cx="12" cy="5" r="1" fill={color} />
            <circle cx="17" cy="6" r="1" fill={color} />
          </svg>
        );
      case 'coins':
        // Coin SVG
        return (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="9" fill={color} stroke="hsl(var(--accent-dark))" strokeWidth="2"/>
            <circle cx="12" cy="12" r="6" fill="none" stroke="hsl(var(--accent-dark))" strokeWidth="1.5" opacity="0.5"/>
            <text x="12" y="16" textAnchor="middle" fill="hsl(var(--accent-dark))" fontSize="10" fontWeight="bold">$</text>
          </svg>
        );
      case 'lives':
        // Heart SVG
        return (
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill={color}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke="hsl(var(--destructive))"
              strokeWidth="1.5"
            />
          </svg>
        );
    }
  };

  // Accessibility labels
  const getAriaLabel = () => {
    switch (type) {
      case 'rank':
        return `${t('hexagon.rank')}: ${value}`;
      case 'coins':
        return `${t('hexagon.coins')}: ${value}`;
      case 'lives':
        return `${t('hexagon.lives')}: ${value}`;
      case 'avatar':
        return `${t('profile.title')}`;
      default:
        return '';
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Original hexagon design for all types (rank, coins, lives, avatar)
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
            cursor: 'pointer'
          }
        }
      : { className: `relative ${className}` };

  return React.createElement(
    containerElement,
    { ...containerProps, role: "status", "aria-label": getAriaLabel() },
    <>
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse"
        style={{ background: colors.glowColor }}
      />

      {/* 3D Hexagon Container */}
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-21 md:h-21 lg:w-25 lg:h-25">
        {/* BASE SHADOW (3D depth) */}
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

        {/* OUTER FRAME - gradient with border */}
        <div
          className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${colors.gradientOuter} border-2 ${colors.borderColor} ${colors.shadowColor}`}
          aria-hidden
        />

        {/* MIDDLE FRAME (bright inner highlight) */}
        <div
          className={`absolute inset-[3px] clip-hexagon bg-gradient-to-b ${colors.gradientMiddle}`}
          style={{ boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15)' }}
          aria-hidden
        />

        {/* INNER CRYSTAL/COLOR LAYER */}
        <div
          className={`absolute clip-hexagon bg-gradient-to-b ${colors.gradientInner}`}
          style={{
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
            boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.15)',
          }}
          aria-hidden
        />

        {/* SPECULAR HIGHLIGHT (top-left) */}
        <div
          className="absolute clip-hexagon pointer-events-none"
          style={{
            top: '5px',
            left: '5px',
            right: '5px',
            bottom: '5px',
            background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)',
          }}
          aria-hidden
        />


        {/* INNER GLOW (bottom shadow for 3D depth) */}
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

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 z-10">
          {type === 'avatar' ? (
            avatarUrl ? (
              <img
                src={avatarUrl}
                alt={String(value)}
                className="w-9 h-9 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {getInitials(String(value))}
              </span>
            )
          ) : (
            <>
              {renderIcon()}
              <span className="text-white text-[10px] sm:text-xs md:text-sm lg:text-base font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {value}
              </span>
            </>
          )}
        </div>
      </div>
    </>
  );
};

