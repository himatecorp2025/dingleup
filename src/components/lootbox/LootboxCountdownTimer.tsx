import { useState, useEffect, useRef } from 'react';

interface LootboxCountdownTimerProps {
  durationMs?: number; // fallback, if no expiresAt is provided
  expiresAt?: string | null;
  onExpired?: () => void;
}

/**
 * Countdown timer for active lootbox - modeled after NextLifeTimer
 * Uses backend expiresAt when available so frontend és backend időzítés egyezik
 */
export const LootboxCountdownTimer = ({ 
  durationMs = 30000,
  expiresAt,
  onExpired 
}: LootboxCountdownTimerProps) => {
  const [remainingMs, setRemainingMs] = useState(0);
  const hasExpiredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);

  // Reset expiry flag when a new timer starts
  useEffect(() => {
    hasExpiredRef.current = false;
    onExpiredRef.current = onExpired;
  }, [durationMs, expiresAt, onExpired]);

  useEffect(() => {
    // Ha nincs expiresAt és nincs duration, nem indul a timer
    if ((!durationMs || durationMs <= 0) && !expiresAt) {
      setRemainingMs(0);
      return;
    }

    const now = Date.now();
    const endTime = expiresAt
      ? new Date(expiresAt).getTime()
      : now + durationMs;

    if (!endTime || endTime <= now) {
      setRemainingMs(0);
      return;
    }

    const updateRemaining = () => {
      const current = Date.now();
      const diff = Math.max(0, endTime - current);
      setRemainingMs(diff);
      
      // When timer reaches 0, trigger expiry ONCE
      if (diff <= 0 && onExpiredRef.current && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpiredRef.current();
      }
    };

    updateRemaining();
    const intervalId = setInterval(updateRemaining, 1000);

    return () => clearInterval(intervalId);
  }, [durationMs, expiresAt]);

  // Hide timer when expired
  if (remainingMs === 0) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  return (
    <div 
      className="absolute bottom-0 rounded-md z-50 text-[10px]"
      style={{ 
        perspective: '1000px',
        width: '44px',
        height: '20px',
        left: '50%',
        transform: 'translateX(-50%) translateY(100%)'
      }}
    >
      {/* DEEP BOTTOM SHADOW - Multiple layers for depth */}
      <div 
        className="absolute inset-0 bg-background/70 rounded-md" 
        style={{ 
          transform: 'translate(4px, 6px) rotateX(5deg)', 
          filter: 'blur(6px)' 
        }} 
        aria-hidden 
      />
      <div 
        className="absolute inset-0 bg-background/40 rounded-md" 
        style={{ 
          transform: 'translate(2px, 4px) rotateX(3deg)', 
          filter: 'blur(4px)' 
        }} 
        aria-hidden 
      />
      
      {/* DEEP 3D LAYERS - Bottom to top */}
      {/* Layer 5 - Deepest */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-accent-darker via-accent-dark to-accent-darkest border-2 border-accent-darkest/80" 
        style={{ 
          transform: 'translateZ(-20px) rotateX(2deg)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.6)'
        }} 
        aria-hidden 
      />
      
      {/* Layer 4 */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-accent-dark via-accent to-accent-dark border-2 border-accent-dark/70" 
        style={{ 
          transform: 'translateZ(-15px) rotateX(1.5deg)',
          boxShadow: '0 6px 12px rgba(0,0,0,0.5)'
        }} 
        aria-hidden 
      />
      
      {/* Layer 3 */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-accent via-accent-glow to-accent border-2 border-accent/60" 
        style={{ 
          transform: 'translateZ(-10px) rotateX(1deg)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
        }} 
        aria-hidden 
      />
      
      {/* Layer 2 */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-accent-glow via-accent-light to-accent border-2 border-accent/50" 
        style={{ 
          transform: 'translateZ(-5px) rotateX(0.5deg)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
        }} 
        aria-hidden 
      />
      
      {/* TOP SURFACE - Brightest gold */}
      <div 
        className="absolute inset-0 rounded-md bg-gradient-to-b from-accent-light via-accent-glow to-accent border-2 border-accent-glow/40" 
        style={{ 
          transform: 'translateZ(0px)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.2), 0 0 20px hsl(var(--accent)/0.5)'
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
        className="relative z-10 font-extrabold leading-none flex items-center justify-center" 
        style={{ 
          transform: 'translateZ(10px)',
          textShadow: 'none',
          color: '#000000',
          padding: '1px',
          width: '100%',
          height: '100%'
        }}
      >
        {totalSeconds}s
      </span>
    </div>
  );
};