import { useState, useEffect } from 'react';

interface NextLifeTimerProps {
  nextLifeAt: string | null;
  livesCurrent: number;
  livesMax: number;
  serverDriftMs?: number;
  speedBoosterActive?: boolean;
}

export const NextLifeTimer = ({ 
  nextLifeAt, 
  livesCurrent, 
  livesMax,
  serverDriftMs = 0,
  speedBoosterActive = false
}: NextLifeTimerProps) => {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    // Always show timer if lives are below max
    if (!nextLifeAt || livesCurrent >= livesMax) {
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
  }, [nextLifeAt, livesCurrent, livesMax, serverDriftMs, speedBoosterActive]);

  // Don't render if at max lives or no time remaining
  if (livesCurrent >= livesMax || remainingMs === 0) {
    return null;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div 
      className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-yellow-500 border-2 border-yellow-400 rounded px-2 py-0.5 shadow-[0_0_10px_rgba(234,179,8,0.6)]"
      title="Következő élet érkezése"
    >
      <span className="text-[10px] font-black text-black drop-shadow">
        {formattedTime}
      </span>
    </div>
  );
};
