import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown } from 'lucide-react';

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
    
    // Realtime frissítés
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
      console.log('[LeaderboardCarousel] Fetched players:', data?.length);
      setTopPlayers(data || []);
    } catch (error) {
      console.error('[LeaderboardCarousel] Error fetching top players:', error);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || topPlayers.length === 0) return;

    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 1.5;

    const scroll = () => {
      scrollPosition += scrollSpeed;
      
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

  const getHexagonColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 via-yellow-500 to-yellow-600'; // Arany
    if (index === 1) return 'from-gray-300 via-gray-400 to-gray-500'; // Ezüst
    if (index === 2) return 'from-orange-400 via-orange-500 to-orange-600'; // Bronz
    return 'from-purple-500 via-purple-600 to-purple-700'; // Lila
  };

  const getCrownColor = (index: number) => {
    if (index === 0) return 'text-yellow-300'; // Arany korona
    if (index === 1) return 'text-gray-200'; // Ezüst korona
    if (index === 2) return 'text-orange-300'; // Bronz korona
    return '';
  };

  if (topPlayers.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-2">
      <h3 className="text-center text-xs sm:text-sm font-black text-white mb-2 drop-shadow-lg">
        🏆 TOP 25 JÁTÉKOS 🏆
      </h3>
      
      <div
        ref={scrollContainerRef}
        className="overflow-x-hidden whitespace-nowrap h-20 sm:h-24"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="inline-flex gap-2 sm:gap-3">
          {/* Duplikált tömb a seamless loophoz */}
          {[...topPlayers, ...topPlayers].map((player, index) => {
            const actualIndex = index % topPlayers.length;
            const showCrown = actualIndex < 3;
            
            return (
              <div
                key={`${player.user_id}-${index}`}
                className="relative clip-hexagon w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 transform hover:scale-110 transition-transform duration-200"
              >
                {/* BASE SHADOW */}
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

                {/* OUTER FRAME */}
                <div
                  className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${getHexagonColor(actualIndex)} border-2 shadow-xl`}
                  style={{
                    borderColor: actualIndex === 0 ? '#fbbf24' : 
                                actualIndex === 1 ? '#d1d5db' : 
                                actualIndex === 2 ? '#fb923c' : '#a855f7',
                    boxShadow: `0 0 15px ${
                      actualIndex === 0 ? 'rgba(251,191,36,0.6)' : 
                      actualIndex === 1 ? 'rgba(209,213,219,0.6)' : 
                      actualIndex === 2 ? 'rgba(251,146,60,0.6)' : 'rgba(168,85,247,0.6)'
                    }`
                  }}
                  aria-hidden
                />

                {/* MIDDLE FRAME */}
                <div
                  className="absolute inset-[2px] clip-hexagon"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4)',
                  }}
                  aria-hidden
                />

                {/* INNER LAYER */}
                <div
                  className="absolute clip-hexagon"
                  style={{
                    top: '4px',
                    left: '4px',
                    right: '4px',
                    bottom: '4px',
                    boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.3)',
                  }}
                  aria-hidden
                />

                {/* SPECULAR HIGHLIGHT */}
                <div
                  className="absolute clip-hexagon pointer-events-none"
                  style={{
                    top: '4px',
                    left: '4px',
                    right: '4px',
                    bottom: '4px',
                    background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)',
                  }}
                  aria-hidden
                />

                {/* Content - korona az első 3 helyezettnél */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-1">
                  {showCrown && (
                    <Crown className={`w-3 h-3 sm:w-4 sm:h-4 mb-0.5 ${getCrownColor(actualIndex)} drop-shadow-lg`} />
                  )}
                  <p className="text-[9px] sm:text-[10px] font-bold text-white text-center truncate w-full drop-shadow-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {player.username}
                  </p>
                  <p className="text-xs sm:text-sm font-black text-white drop-shadow-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
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
