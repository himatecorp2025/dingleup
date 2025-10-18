import { useState, useEffect } from 'react';

export const useBoosterTimer = (boosterActiveUntil: string | null) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!boosterActiveUntil) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(boosterActiveUntil).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining('Lejárt');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [boosterActiveUntil]);

  return timeRemaining;
};
