import React from 'react';
import notificationButtonSvg from '@/assets/lootbox-notification-button.svg';

interface LootboxNotificationBannerProps {
  countdown: number;
  className?: string;
}

/**
 * Lootbox notification banner using Play Now button SVG shape
 * Red variant with white text, displays countdown
 */
export const LootboxNotificationBanner: React.FC<LootboxNotificationBannerProps> = ({
  countdown,
  className = '',
}) => {
  return (
    <div
      className={`relative transition-all animate-fade-in ${className}`}
      style={{
        width: '100%',
        maxWidth: 'clamp(180px, 45vw, 240px)', // Max width = Lives + Profile hexagons combined
        height: 'clamp(60px, 15vw, 80px)',
      }}
    >
      {/* Red hex button SVG */}
      <img 
        src={notificationButtonSvg} 
        alt="" 
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1.25, 1.5)',
          filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.6))',
        }}
        aria-hidden
      />

      {/* Content - Two-line text + countdown */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-2">
        <div
          className="text-white font-black text-center leading-tight"
          style={{
            fontSize: 'clamp(0.65rem, 2.5vw, 0.875rem)',
            textShadow: '0 0 6px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9)',
          }}
        >
          <div>Ajándékod érkezik, vedd át!</div>
          <div className="mt-0.5">
            mielőtt elvész: <span className="font-extrabold">{countdown}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
