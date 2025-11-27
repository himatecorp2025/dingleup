import { useState, useEffect } from 'react';
import { GoldLootboxIcon } from './GoldLootboxIcon';

interface ActiveLootboxDisplayProps {
  expiresAt: string | null;
  onClick: () => void;
}

export const ActiveLootboxDisplay = ({ expiresAt, onClick }: ActiveLootboxDisplayProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      // No expiration set - show 60s countdown from now
      setRemainingSeconds(60);
      const countdownInterval = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    } else {
      // Calculate remaining time from expires_at
      const calculateRemaining = () => {
        const now = new Date().getTime();
        const expires = new Date(expiresAt).getTime();
        const diffMs = expires - now;
        return Math.max(0, Math.floor(diffMs / 1000));
      };

      setRemainingSeconds(calculateRemaining());

      const countdownInterval = setInterval(() => {
        const remaining = calculateRemaining();
        setRemainingSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [expiresAt]);

  // Fade out animation when expired
  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;

  return (
    <div
      className={`relative cursor-pointer transition-all duration-500 ${
        isExpired ? 'opacity-0 scale-90' : 'opacity-100 scale-100 hover:scale-105'
      }`}
      onClick={!isExpired ? onClick : undefined}
      style={{
        animation: !isExpired ? 'lootboxDrop 1.5s ease-out' : undefined
      }}
    >
      {/* Lootbox icon */}
      <GoldLootboxIcon className="w-16 md:w-20 lg:w-24" />

      {/* Countdown badge */}
      {remainingSeconds !== null && remainingSeconds > 0 && (
        <div
          className="absolute top-1 right-1 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-semibold"
          style={{
            boxShadow: '0 0 8px rgba(0,0,0,0.5)'
          }}
        >
          {remainingSeconds}s
        </div>
      )}

      <style>
        {`
          @keyframes lootboxDrop {
            from {
              transform: translateY(-150px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};
