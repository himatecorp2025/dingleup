import React, { ReactNode } from 'react';
import playNowButtonSvg from '@/assets/play-now-button.svg';

interface PlayNowButtonProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Play Now Button with custom SVG background
 * Maintains text and icon content while replacing button background
 */
export const PlayNowButton: React.FC<PlayNowButtonProps> = ({
  onClick,
  children,
  className = '',
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={`relative w-full transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
      } ${className}`}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      {/* SVG Background */}
      <div 
        className="absolute pointer-events-none"
        style={{
          backgroundImage: `url(${playNowButtonSvg})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '400%',
          height: '150%',
          top: '-25%',
          left: '-150%',
        }}
        aria-hidden
      />

      {/* Content (Text + Icon) */}
      <div className="relative z-10 flex items-center justify-center py-4 px-6 text-foreground font-black text-base sm:text-lg">
        {children}
      </div>
    </button>
  );
};
