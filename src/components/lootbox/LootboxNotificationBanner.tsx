import React from 'react';
import notificationSvg from '@/assets/lootbox-notification-button.svg';

interface LootboxNotificationBannerProps {
  countdown: number;
  className?: string;
}

/**
 * Lootbox notification banner using the provided red SVG asset
 * Displays Hungarian text with countdown
 */
export const LootboxNotificationBanner: React.FC<LootboxNotificationBannerProps> = ({
  countdown,
  className = '',
}) => {
  return (
    <div
      className={`relative transition-all ${className}`}
      style={{
        width: 'clamp(180px, 45vw, 240px)',
        height: 'clamp(60px, 15vw, 80px)',
      }}
    >
      {/* Red SVG background */}
      <img 
        src={notificationSvg} 
        alt="" 
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.6))',
        }}
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
          <div>Ajándék érkezett, fogadd el,</div>
          <div className="mt-0.5">
            mielőtt elvész: <span className="font-extrabold">{countdown}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
