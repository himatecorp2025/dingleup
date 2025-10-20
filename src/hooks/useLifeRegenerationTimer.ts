import { useState, useEffect } from 'react';

interface LifeRegenTimerResult {
  timeUntilNextLife: string;
  totalSecondsLeft: number;
}

export const useLifeRegenerationTimer = (
  lives: number,
  maxLives: number,
  lastRegeneration: string | null,
  regenRateMinutes: number
): LifeRegenTimerResult => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    // Only show timer if lives are below max
    if (lives >= maxLives || !lastRegeneration) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const lastRegen = new Date(lastRegeneration).getTime();
      const regenIntervalMs = regenRateMinutes * 60 * 1000;
      
      // Time elapsed since last regeneration
      const elapsed = now - lastRegen;
      
      // Time until next life
      const timeUntilNext = regenIntervalMs - (elapsed % regenIntervalMs);
      
      setTimeLeft(Math.max(0, Math.floor(timeUntilNext / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lives, maxLives, lastRegeneration, regenRateMinutes]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeUntilNextLife: formatTime(timeLeft),
    totalSecondsLeft: timeLeft
  };
};