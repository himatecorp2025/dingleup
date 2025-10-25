import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

interface WeeklyRankingsCountdownProps {
  compact?: boolean;
  className?: string;
}

export const WeeklyRankingsCountdown = ({ compact = false, className = '' }: WeeklyRankingsCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      
      // Calculate next Sunday 23:59:59
      const nextSunday = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7;
      nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
      nextSunday.setHours(23, 59, 59, 999);
      
      const diff = nextSunday.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Díjazás folyamatban...');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${days}n ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div 
        className={`bg-purple-600 border border-purple-400 rounded px-1 py-0.5 shadow-[0_0_8px_rgba(168,85,247,0.6)] ${className}`}
        title="Heti verseny vége"
      >
        <span className="text-[8px] font-extrabold text-white drop-shadow leading-none whitespace-nowrap">
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
          top: '6px',
          left: '6px',
          right: '6px',
          bottom: '6px',
          clipPath: 'polygon(8% 0.6%, 92% 0%, 100% 50%, 92% 100%, 8% 99.4%, 0% 50%)',
          background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 30%, transparent 60%)',
        }}
        aria-hidden
      />

      {/* DIAGONAL LIGHT STREAKS */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '6px',
          left: '6px',
          right: '6px',
          bottom: '6px',
          clipPath: 'polygon(8% 0.6%, 92% 0%, 100% 50%, 92% 100%, 8% 99.4%, 0% 50%)',
          background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.12) 8px, rgba(255,255,255,0.12) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.08) 20px, rgba(255,255,255,0.08) 24px)',
          opacity: 0.7,
        }}
        aria-hidden
      />

      {/* 45° SHINE (animated, clipped to hex) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '6px',
          left: '6px',
          right: '6px',
          bottom: '6px',
          clipPath: 'polygon(8% 0.6%, 92% 0%, 100% 50%, 92% 100%, 8% 99.4%, 0% 50%)',
          overflow: 'hidden',
        }}
        aria-hidden
      >
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          style={{
            background: 'linear-gradient(45deg, transparent 46%, rgba(255,255,255,0.5) 50%, transparent 54%)',
            animation: 'slide-in-right 3s linear infinite',
          }}
        />
      </div>

      {/* INNER GLOW (bottom shadow for 3D depth) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '6px',
          left: '6px',
          right: '6px',
          bottom: '6px',
          clipPath: 'polygon(8% 0.6%, 92% 0%, 100% 50%, 92% 100%, 8% 99.4%, 0% 50%)',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.2)',
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 text-center w-full px-4">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-pulse" />
          <p className="text-xs sm:text-sm md:text-base text-black font-black drop-shadow-[0_2px_4px_rgba(255,215,0,0.5)]">DÍJAZÁSIG</p>
        </div>
        <p className="text-sm sm:text-base md:text-lg font-black text-black drop-shadow-[0_3px_6px_rgba(255,215,0,0.6)] leading-tight tracking-wider">
          {timeRemaining}
        </p>
      </div>
    </div>
  );
};