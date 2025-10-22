import { useState, useEffect } from 'react';

interface NextLifeTimerProps {
  nextLifeAt: string | null;
  livesCurrent: number;
  livesMax: number;
  serverDriftMs?: number;
}

export const NextLifeTimer = ({ 
  nextLifeAt, 
  livesCurrent, 
  livesMax,
  serverDriftMs = 0 
}: NextLifeTimerProps) => {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    // Don't show timer if at max lives or no next life time
    if (livesCurrent >= livesMax || !nextLifeAt) {
      setRemainingMs(0);
      return;
    }

    const targetTime = new Date(nextLifeAt).getTime();

    const updateRemaining = () => {
      const now = Date.now() + serverDriftMs;
      const diff = Math.max(0, targetTime - now);
      setRemainingMs(diff);
    };

    // Initial update
    updateRemaining();

    // Update every second
    const intervalId = setInterval(updateRemaining, 1000);

    return () => clearInterval(intervalId);
  }, [nextLifeAt, livesCurrent, livesMax, serverDriftMs]);

  // Don't render if at max lives or no remaining time
  if (livesCurrent >= livesMax || remainingMs === 0) {
    return null;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div 
      className="text-xs text-[hsl(var(--dup-crimson-300))] mt-1"
      title="Perc:másodperc múlva +1 élet"
    >
      köv. élet: {formattedTime}
    </div>
  );
};
