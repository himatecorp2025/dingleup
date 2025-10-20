import { useState, useEffect } from 'react';

interface BoosterConfig {
  multiplier: number;
  maxLives: number;
  regenMinutes: number;
}

export const BOOSTER_CONFIGS: Record<string, BoosterConfig> = {
  base: { multiplier: 1, maxLives: 15, regenMinutes: 12 },
  DoubleSpeed: { multiplier: 2, maxLives: 25, regenMinutes: 6 },
  MegaSpeed: { multiplier: 4, maxLives: 35, regenMinutes: 3 },
  GigaSpeed: { multiplier: 12, maxLives: 75, regenMinutes: 1 },
  DingleSpeed: { multiplier: 24, maxLives: 135, regenMinutes: 0.5 }
};

interface UseLifeRegenerationProps {
  currentLives: number;
  maxLives: number;
  lastRegeneration: string | null;
  boosterActive: boolean;
  boosterType: string | null;
  boosterExpiresAt: string | null;
}

export const useLifeRegeneration = ({
  currentLives,
  maxLives,
  lastRegeneration,
  boosterActive,
  boosterType,
  boosterExpiresAt
}: UseLifeRegenerationProps) => {
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [shouldShowTimer, setShouldShowTimer] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      // Determine current config
      let config = BOOSTER_CONFIGS.base;
      if (boosterActive && boosterType && boosterExpiresAt) {
        const now = new Date().getTime();
        const expiresTime = new Date(boosterExpiresAt).getTime();
        if (now < expiresTime && BOOSTER_CONFIGS[boosterType]) {
          config = BOOSTER_CONFIGS[boosterType];
        }
      }

      // Show timer only if lives < maxLives
      const effectiveMaxLives = config.maxLives;
      if (currentLives >= effectiveMaxLives) {
        setShouldShowTimer(false);
        setTimeUntilNext('');
        return;
      }

      setShouldShowTimer(true);

      // Calculate time until next life
      if (!lastRegeneration) {
        setTimeUntilNext('...');
        return;
      }

      const lastRegen = new Date(lastRegeneration).getTime();
      const now = new Date().getTime();
      const regenIntervalMs = config.regenMinutes * 60 * 1000;
      const elapsed = now - lastRegen;
      const remaining = Math.max(0, regenIntervalMs - elapsed);

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      if (remaining <= 0) {
        setTimeUntilNext('0:00');
      } else {
        setTimeUntilNext(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentLives, maxLives, lastRegeneration, boosterActive, boosterType, boosterExpiresAt]);

  return { timeUntilNext, shouldShowTimer };
};
