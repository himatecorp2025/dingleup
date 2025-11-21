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
        height: '80px',
      }}
    >
      {/* SVG Background */}
      <img
        src={playNowButtonSvg}
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{
          transform: 'scale(2, 1.5)',
        }}
        aria-hidden
      />

      {/* Content (Text + Icon) - Centered both horizontally and vertically */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-foreground font-black text-base sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {children}
        </div>
      </div>
    </button>
  );
};
