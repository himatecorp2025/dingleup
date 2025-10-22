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
      className="relative px-6 py-2 sm:px-8 overflow-hidden h-full flex items-center min-w-[180px] sm:min-w-[220px]"
      style={{ 
        background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 20%, #FBBF24 40%, #F59E0B 60%, #D97706 80%, #FBBF24 100%)',
        boxShadow: '0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(251, 191, 36, 0.8), inset 0 0 40px rgba(255, 255, 255, 0.5), inset 0 -5px 20px rgba(217, 119, 6, 0.5)',
        border: '3px solid #FFD700',
        clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
      }}
    >
      {/* Animated shimmer overlay */}
      <div 
        className="absolute inset-0 opacity-60 animate-pulse"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 1) 0%, transparent 70%)',
        }}
      />
      
      {/* Moving light streak */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
          animation: 'slide-in-right 3s ease-in-out infinite'
        }}
      />
      
      {/* Sparkle dots */}
      <div className="absolute top-1 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse" />
      <div className="absolute bottom-1 right-1/4 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Casino lights border effect */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          border: '2px solid transparent',
          borderImage: 'linear-gradient(90deg, #FFD700, #FFF, #FFD700, #FFF, #FFD700) 1',
          animation: 'pulse 1s ease-in-out infinite'
        }}
      />
      
      <div className="relative z-10 text-center w-full">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] animate-pulse" />
          <p className="text-xl sm:text-2xl text-black font-black drop-shadow-[0_2px_4px_rgba(255,215,0,0.5)]">DÍJAZÁSIG</p>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-black drop-shadow-[0_3px_6px_rgba(255,215,0,0.6)] leading-tight tracking-wider">
          {timeRemaining}
        </p>
      </div>
    </div>
  );
};