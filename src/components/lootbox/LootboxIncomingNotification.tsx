import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';

interface LootboxIncomingNotificationProps {
  onComplete: () => void;
}

export const LootboxIncomingNotification = ({ onComplete }: LootboxIncomingNotificationProps) => {
  const { t } = useI18n();
  const [countdown, setCountdown] = useState(3);
  const [isVisible, setIsVisible] = useState(false);
  const [shake, setShake] = useState(false);

  // Slide in animation (0-2 sec)
  useEffect(() => {
    const slideInTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(slideInTimer);
  }, []);

  // Countdown logic (starts at 2 sec, changes every 1 sec)
  useEffect(() => {
    if (!isVisible) return;

    const countdownStart = setTimeout(() => {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Fade out and complete
            setTimeout(() => {
              onComplete();
            }, 300);
            return 0;
          }
          // Trigger shake animation
          setShake(true);
          setTimeout(() => setShake(false), 300);
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }, 2000); // Start countdown after 2 sec slide-in

    return () => clearTimeout(countdownStart);
  }, [isVisible, onComplete]);

  if (countdown === 0) return null;

  return (
    <div
      className="fixed z-[60] pointer-events-none"
      style={{
        right: 'clamp(12px, 4vw, 24px)',
        top: 'calc(env(safe-area-inset-top) + clamp(64px, 10vh, 90px))', // Header height, aligned with hexagons
        transform: isVisible ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        transition: 'transform 2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: countdown === 0 ? 0 : 1,
        transitionProperty: countdown === 0 ? 'opacity, transform' : 'transform',
      }}
    >
      <div
        className="relative px-2 py-1.5 rounded-lg backdrop-blur-md shadow-xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.95) 0%, rgba(202, 138, 4, 0.95) 100%)',
          borderColor: 'rgba(250, 204, 21, 0.8)',
          boxShadow: '0 0 15px rgba(234, 179, 8, 0.6), inset 0 1px 5px rgba(255, 255, 255, 0.3)',
          maxWidth: 'min(140px, calc(100vw - 24px))',
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-xl animate-pulse"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(250, 204, 21, 0.4) 0%, transparent 70%)',
            filter: 'blur(10px)',
            zIndex: -1,
          }}
        />

        {/* Content */}
        <div className="relative text-center">
          {/* Line 1 */}
          <p className="text-white font-black text-xs leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {t('lootbox.incoming.title')}
          </p>

          {/* Line 2 with countdown */}
          <p className="text-white/90 font-bold text-[10px] mt-0.5 leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {t('lootbox.incoming.subtitle')}:{' '}
            <span
              className="inline-block font-black text-xs text-yellow-100"
              style={{
                transform: shake ? 'scale(1.2) translateY(-1px)' : 'scale(1)',
                transition: 'transform 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                textShadow: '0 0 5px rgba(250, 204, 21, 0.8), 0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {countdown}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
