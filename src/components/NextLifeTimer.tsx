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

  // Show timer whenever lives are below max, even at 00:00 while next cycle starts
  if (livesCurrent >= livesMax) {
    return null;
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  const seconds = Math.max(0, totalSeconds % 60);

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div 
      className="absolute -bottom-1 -right-1 bg-yellow-500 border border-yellow-400 rounded px-1.5 py-0.5 shadow-[0_0_10px_rgba(234,179,8,0.6)] z-50"
      title="Következő élet érkezése"
    >
      <span className="text-[10px] sm:text-xs font-extrabold text-black drop-shadow">
        {formattedTime}
      </span>
    </div>
  );
};
