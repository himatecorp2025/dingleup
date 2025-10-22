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
      className="relative px-3 py-2 sm:px-4 overflow-hidden h-full flex items-center"
      style={{ 
        background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 25%, #D97706 50%, #F59E0B 75%, #FBBF24 100%)',
        boxShadow: '0 0 20px rgba(251, 191, 36, 0.8), inset 0 0 30px rgba(255, 255, 255, 0.4)',
        border: '2px solid #FBBF24',
        clipPath: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
        animation: 'shimmer 3s ease-in-out infinite'
      }}
    >
      {/* Shimmer effect overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9) 0%, transparent 60%)',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      
      <div className="relative z-10 text-center w-full">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-900 drop-shadow" />
          <p className="text-[9px] sm:text-[10px] text-yellow-900 font-black">Díjazásig</p>
        </div>
        <p className="text-[10px] sm:text-xs font-black text-yellow-900 drop-shadow-lg leading-tight">
          {timeRemaining}
        </p>
      </div>
    </div>
  );
};