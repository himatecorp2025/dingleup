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
    // If lives are at max, hide timer immediately
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

  // Hide timer when lives are at max
  if (livesCurrent >= livesMax || remainingMs === 0) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div 
      className="absolute -bottom-[7.2px] -right-0.5 rounded-md z-50 text-[8px]"
      title="Következő élet érkezése"
      style={{ perspective: '1000px' }}
    >
      {/* DEEP BOTTOM SHADOW - Multiple layers for depth */}
      <div 
        className="absolute inset-0 bg-black/70 rounded-md" 
        style={{ 
          transform: 'translate(4px, 6px) rotateX(5deg)', 
          filter: 'blur(6px)' 
        }} 
        aria-hidden 
      />
      <div 
        className="absolute inset-0 bg-black/40 rounded-md" 
        style={{ 
          transform: 'translate(2px, 4px) rotateX(3deg)', 
          filter: 'blur(4px)' 
        }} 
        aria-hidden 
      />
      
      {/* DEEP 3D LAYERS - Bottom to top */}
      {/* Layer 5 - Deepest */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-yellow-900 via-yellow-800 to-yellow-950 border-2 border-yellow-950/80" 
        style={{ 
          transform: 'translateZ(-20px) rotateX(2deg)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.6)'
        }} 
        aria-hidden 
      />
      
      {/* Layer 4 */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-yellow-700 via-yellow-600 to-yellow-800 border-2 border-yellow-700/70" 
        style={{ 
          transform: 'translateZ(-15px) rotateX(1.5deg)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.5)'
        }} 
        aria-hidden 
      />
      
      {/* Layer 3 */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-600 border-2 border-yellow-600/60" 
        style={{ 
          transform: 'translateZ(-10px) rotateX(1deg)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
        }} 
        aria-hidden 
      />
      
      {/* Layer 2 */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-yellow-400 via-yellow-300 to-yellow-500 border-2 border-yellow-500/50" 
        style={{ 
          transform: 'translateZ(-5px) rotateX(0.5deg)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
        }} 
        aria-hidden 
      />
      
      {/* TOP SURFACE - Brightest gold */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-yellow-400/40" 
        style={{ 
          transform: 'translateZ(0px)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.2), 0 0 20px rgba(255,215,0,0.5)'
        }} 
        aria-hidden 
      />
      
      {/* BRIGHT SPECULAR HIGHLIGHT */}
      <div 
        className="absolute inset-[2px] rounded-sm pointer-events-none" 
        style={{ 
          background: 'radial-gradient(ellipse 120% 70% at 40% 10%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 30%, transparent 60%)',
          transform: 'translateZ(5px)'
        }} 
        aria-hidden 
      />
      
      {/* TEXT - Clean black, no effects */}
      <span 
        className="relative z-10 font-extrabold text-black leading-none block px-1.5 py-0.5" 
        style={{ 
          transform: 'translateZ(10px)',
          textShadow: 'none'
        }}
      >
        {formattedTime}
      </span>
    </div>
  );
};
