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
        className={`bg-gradient-to-r from-purple-600/30 to-purple-900/30 border-2 border-purple-500/40 px-3 py-3 sm:px-4 sm:py-4 text-center ${className}`}
        style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <span className="text-xs sm:text-sm font-bold text-white">Heti díjazásig</span>
        </div>
        <p className="text-sm sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400">
          {timeRemaining}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-2 border-purple-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 text-center">
      <h3 className="text-sm sm:text-base font-black text-white mb-1 sm:mb-2 flex items-center justify-center gap-2">
        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
        Heti Nyeremények
      </h3>
      <p className="text-[10px] sm:text-xs text-white/60 mb-2">Következő díjazás:</p>
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-purple-500/30">
        <p className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-yellow-400 animate-pulse">
          {timeRemaining}
        </p>
      </div>
      <p className="text-[9px] sm:text-[10px] text-white/40 mt-2">
        Top 10 játékos kategóriánként jutalmat nyer
      </p>
    </div>
  );
};