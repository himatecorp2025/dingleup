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
      className="relative mb-4 px-3 py-4 sm:px-4 sm:py-5 overflow-hidden rounded-xl sm:rounded-2xl"
      style={{ 
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF8C00 50%, #FFA500 75%, #FFD700 100%)',
        boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 60px rgba(255, 255, 255, 0.3)',
        border: '3px solid #FFD700',
        animation: 'shimmer 3s ease-in-out infinite'
      }}
    >
      {/* Arany ragyogás effekt */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      
      {/* Belső arany keret */}
      <div 
        className="absolute inset-2 rounded-lg"
        style={{
          border: '2px solid rgba(255, 215, 0, 0.5)',
          boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.4)'
        }}
      />

      <div className="relative z-10 text-center">
        <h3 className="text-sm sm:text-base font-black text-yellow-900 mb-1 sm:mb-2 flex items-center justify-center gap-2 drop-shadow-lg">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-900" />
          Heti Nyeremények
        </h3>
        <p className="text-[10px] sm:text-xs text-yellow-900/80 font-semibold mb-2">Következő díjazás:</p>
        <div className="bg-yellow-100/50 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 sm:py-3 border-2 border-yellow-600">
          <p className="text-base sm:text-xl font-black text-yellow-900 drop-shadow">
            {timeRemaining}
          </p>
        </div>
        <p className="text-[9px] sm:text-[10px] text-yellow-900/70 font-semibold mt-2 drop-shadow">
          Top 10 játékos kategóriánként jutalmat nyer
        </p>
      </div>
    </div>
  );
};