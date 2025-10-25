import { useState, useEffect } from 'react';

interface NextLifeTimerProps {
  nextLifeAt: string | null;
  livesCurrent: number;
  livesMax: number;
  serverDriftMs?: number;
  onExpired?: () => void;
}

export const NextLifeTimer = ({ 
  nextLifeAt, 
  livesCurrent, 
  livesMax,
  serverDriftMs = 0,
  onExpired
}: NextLifeTimerProps) => {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!nextLifeAt || livesCurrent >= livesMax) {
      setRemainingMs(0);
      return;
    }

    const targetTime = new Date(nextLifeAt).getTime();

    const updateRemaining = () => {
      const now = Date.now() + serverDriftMs;
      const diff = Math.max(0, targetTime - now);
      setRemainingMs(diff);
      
      // When timer reaches 00:00, trigger refresh
      if (diff <= 0 && onExpired) {
        onExpired();
      }
    };

    updateRemaining();
    const intervalId = setInterval(updateRemaining, 1000);

    return () => clearInterval(intervalId);
  }, [nextLifeAt, livesCurrent, livesMax, serverDriftMs, onExpired]);

  if (livesCurrent >= livesMax) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div 
      className="absolute -bottom-[7.2px] -right-0.5 rounded z-50 text-[8px]"
      title="Következő élet érkezése"
      style={{ perspective: '500px' }}
    >
      {/* BASE SHADOW */}
      <div className="absolute inset-0 bg-black/60 rounded" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
      
      {/* OUTER FRAME */}
      <div className="absolute inset-0 rounded bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 border border-yellow-400/70 shadow-lg" style={{ transform: 'translateZ(0px)' }} aria-hidden />
      
      {/* MIDDLE FRAME */}
      <div className="absolute inset-[1px] rounded bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.3)', transform: 'translateZ(5px)' }} aria-hidden />
      
      {/* SPECULAR HIGHLIGHT */}
      <div className="absolute inset-[1px] rounded pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)', transform: 'translateZ(10px)' }} aria-hidden />
      
      <span className="relative z-10 font-extrabold text-black drop-shadow leading-none block px-1 py-0.5" style={{ transform: 'translateZ(15px)' }}>
        {formattedTime}
      </span>
    </div>
  );
};
