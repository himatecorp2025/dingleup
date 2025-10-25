import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_correct_answers: number;
  avatar_url: string | null;
}

export const LeaderboardCarousel = () => {
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTopPlayers();
    
    // Realtime frissítés - azonnal lássuk az új eredményeket
    const interval = setInterval(fetchTopPlayers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTopPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('global_leaderboard')
        .select('user_id, username, total_correct_answers, avatar_url')
        .order('total_correct_answers', { ascending: false })
        .limit(25);

      if (error) throw error;
      setTopPlayers(data || []);
    } catch (error) {
      console.error('Error fetching top players:', error);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || topPlayers.length === 0) return;

    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 1.2; // Gyorsabb animáció

    const scroll = () => {
      scrollPosition += scrollSpeed;
      
      // Reset pozíció a végén
      if (scrollPosition >= container.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      container.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [topPlayers]);

  const getMedalColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 via-yellow-500 to-yellow-600'; // Arany - élénkebb
    if (index === 1) return 'from-gray-300 via-gray-400 to-gray-500'; // Ezüst - élénkebb
    if (index === 2) return 'from-orange-400 via-orange-500 to-orange-600'; // Bronz - élénkebb
    return 'from-purple-500 via-purple-600 to-purple-700'; // Lilás - élénkebb
  };

  return (
    <div className="w-full py-2 bg-gradient-to-r from-purple-900/40 via-purple-800/40 to-purple-900/40 backdrop-blur-sm">
      <h3 className="text-center text-xs sm:text-sm font-black text-white mb-2 drop-shadow-lg" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
        🏆 TOP 25 JÁTÉKOS 🏆
      </h3>
      
      <div
        ref={scrollContainerRef}
        className="overflow-x-hidden whitespace-nowrap h-20 sm:h-24"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="inline-flex gap-2 sm:gap-3 px-2">
          {/* Duplikált tömb a seamless loophoz */}
          {[...topPlayers, ...topPlayers].map((player, index) => {
            const actualIndex = index % topPlayers.length;
            return (
              <div
                key={`${player.user_id}-${index}`}
                className="relative clip-hexagon w-18 h-18 sm:w-22 sm:h-22 flex-shrink-0 transform hover:scale-110 transition-transform duration-200"
              >
                {/* BASE SHADOW (3D mélység) - erősebb */}
                <div
                  className="absolute clip-hexagon"
                  style={{
                    top: '3px',
                    left: '3px',
                    right: '-3px',
                    bottom: '-3px',
                    background: 'rgba(0,0,0,0.5)',
                    filter: 'blur(4px)',
                  }}
                  aria-hidden
                />

                {/* OUTER FRAME - élénkebb színekkel */}
                <div
                  className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${getMedalColor(actualIndex)} border-2 shadow-xl`}
                  style={{
                    borderColor: actualIndex === 0 ? '#fbbf24' : 
                                actualIndex === 1 ? '#d1d5db' : 
                                actualIndex === 2 ? '#fb923c' : '#a855f7',
                    boxShadow: `0 0 20px ${
                      actualIndex === 0 ? 'rgba(251,191,36,0.6)' : 
                      actualIndex === 1 ? 'rgba(209,213,219,0.6)' : 
                      actualIndex === 2 ? 'rgba(251,146,60,0.6)' : 'rgba(168,85,247,0.6)'
                    }`
                  }}
                  aria-hidden
                />

                {/* MIDDLE FRAME - erősebb fényhatás */}
                <div
                  className="absolute inset-[2px] clip-hexagon"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.5)',
                  }}
                  aria-hidden
                />

                {/* INNER LAYER - erősebb 3D hatás */}
                <div
                  className="absolute clip-hexagon"
                  style={{
                    top: '4px',
                    left: '4px',
                    right: '4px',
                    bottom: '4px',
                    boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.3), inset 0 -6px 12px rgba(0,0,0,0.4)',
                  }}
                  aria-hidden
                />

                {/* SPECULAR HIGHLIGHT - erősebb fény */}
                <div
                  className="absolute clip-hexagon pointer-events-none"
                  style={{
                    top: '4px',
                    left: '4px',
                    right: '4px',
                    bottom: '4px',
                    background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 30%, transparent 60%)',
                  }}
                  aria-hidden
                />

                {/* Content - csak felhasználónév és eredmény */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-1">
                  <p className="text-[10px] sm:text-xs font-black text-white text-center truncate w-full drop-shadow-lg" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 8px rgba(255,255,255,0.4)' }}>
                    {player.username}
                  </p>
                  <p className="text-base sm:text-lg font-black text-white drop-shadow-lg" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 8px rgba(255,255,255,0.4)' }}>
                    {player.total_correct_answers}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
