import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const WeeklyRankingsCountdown = () => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      
      // Find next Sunday 23:55
      const nextSunday = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7;
      if (daysUntilSunday === 0 && (now.getHours() < 23 || (now.getHours() === 23 && now.getMinutes() < 55))) {
        // It's Sunday before 23:55
        nextSunday.setHours(23, 55, 0, 0);
      } else {
        // Go to next Sunday
        nextSunday.setDate(now.getDate() + (daysUntilSunday || 7));
        nextSunday.setHours(23, 55, 0, 0);
      }

      const diff = nextSunday.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('0 nap 0 óra 0 perc');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${days} nap ${hours} óra ${minutes} perc`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl p-4 mb-6 border-2 border-purple-500/30">
      <div className="flex items-center justify-center gap-3">
        <Clock className="w-6 h-6 text-yellow-400 animate-pulse" />
        <div className="text-center">
          <p className="text-sm text-white/70 mb-1">Következő heti díjazás</p>
          <p className="text-lg font-bold text-white">{timeRemaining}</p>
        </div>
      </div>
    </div>
  );
};
