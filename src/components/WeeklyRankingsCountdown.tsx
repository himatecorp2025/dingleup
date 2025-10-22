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
      className="relative px-4 py-3 sm:px-5 sm:py-4 overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #F59E0B 100%)',
        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.5)',
        clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)',
      }}
    >
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-900" />
          <p className="text-[10px] sm:text-xs text-yellow-900 font-bold">Heti díjazásig</p>
        </div>
        <p className="text-sm sm:text-base font-black text-yellow-900 drop-shadow">
          {timeRemaining}
        </p>
      </div>
    </div>
  );
};