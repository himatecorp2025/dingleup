import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

interface DailyRankingsCountdownProps {
  compact?: boolean;
  className?: string;
}

export const DailyRankingsCountdown = ({ compact = false, className = '' }: DailyRankingsCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      
      // Calculate next day 00:00:00 (midnight)
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Díjazás folyamatban...');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${hours} óra ${minutes} perc ${seconds} másodperc`
      );
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div 
        className={`bg-primary border border-primary/60 rounded px-1 py-0.5 shadow-[0_0_8px_hsl(var(--primary)/0.6)] ${className}`}
        title="Napi verseny vége"
      >
        <span className="text-[8px] font-extrabold text-foreground drop-shadow leading-none whitespace-nowrap">
          {timeRemaining}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="relative h-full flex items-center w-[180px] sm:w-[220px] md:w-[260px]"
      style={{ 
        clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
      }}
    >
      {/* BASE SHADOW (3D depth) */}
      <div
        className="absolute"
        style={{
          top: '4px',
          left: '4px',
          right: '-4px',
          bottom: '-4px',
          clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          background: 'rgba(0,0,0,0.35)',
          filter: 'blur(4px)',
        }}
        aria-hidden
      />

      {/* OUTER GOLD FRAME (dark diagonal gradient) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          background: 'linear-gradient(135deg, #B8860B, #DAA520 50%, #8B6914)',
          boxShadow: 'inset 0 0 0 3px #FFD700, 0 0 30px rgba(255,215,0,0.8)',
        }}
        aria-hidden
      />

      {/* MIDDLE GOLD FRAME (bright inner highlight) */}
      <div
        className="absolute inset-[3px]"
        style={{
          clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          background: 'linear-gradient(180deg, #FFD700, #FDB931 40%, #D97706)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.6)',
        }}
        aria-hidden
      />

      {/* INNER GOLDEN CRYSTAL */}
      <div
        className="absolute"
        style={{
          top: '6px',
          left: '6px',
          right: '6px',
          bottom: '6px',
          clipPath: 'polygon(8% 0.6%, 92% 0%, 100% 50%, 92% 100%, 8% 99.4%, 0% 50%)',
          background: 'radial-gradient(ellipse 100% 80% at 50% -10%, #FFF9E6 0%, #FFE082 30%, #FDB931 60%, #F59E0B 100%)',
          boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.4), inset 0 -12px 24px rgba(0,0,0,0.3)',
        }}
        aria-hidden
      />

      {/* SPECULAR HIGHLIGHT (top-left) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '8px',
          left: '20%',
          width: '30%',
          height: '30%',
          background: 'radial-gradient(ellipse 100% 100% at center, rgba(255,255,255,0.6) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
        aria-hidden
      />

      {/* CONTENT */}
      <div className="relative z-10 flex items-center justify-center gap-2 w-full px-4">
        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary-dark drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        <div className="flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] font-bold text-primary-dark/90 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] leading-tight whitespace-nowrap">
            HOLNAP 00:00
          </span>
          <span className="text-[7px] sm:text-[8px] font-extrabold text-primary-dark drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] leading-none whitespace-nowrap mt-0.5">
            {timeRemaining}
          </span>
        </div>
      </div>

      {/* HEXAGON GLOW EFFECT */}
      <div
        className="absolute inset-0 pointer-events-none animate-pulse"
        style={{
          clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
          boxShadow: '0 0 40px rgba(255,215,0,0.6), inset 0 0 20px rgba(255,215,0,0.3)',
        }}
        aria-hidden
      />
    </div>
  );
};
