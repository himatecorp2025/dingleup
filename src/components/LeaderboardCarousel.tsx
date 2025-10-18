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
  const [isHovering, setIsHovering] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTopPlayers();
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
    const scrollSpeed = isHovering ? 0.3 : 1; // Slower when hovering

    const scroll = () => {
      scrollPosition += scrollSpeed;
      
      // Reset position when reaching the end
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
  }, [topPlayers, isHovering]);

  const getMedalColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 to-yellow-600'; // Gold
    if (index === 1) return 'from-gray-300 to-gray-500'; // Silver
    if (index === 2) return 'from-orange-400 to-orange-600'; // Bronze
    return 'from-purple-500 to-purple-700';
  };

  return (
    <div className="w-full mb-6">
      <h3 className="text-center text-lg font-bold text-white mb-4">
        🏆 TOP 25 JÁTÉKOS 🏆
      </h3>
      
      <div
        ref={scrollContainerRef}
        className="overflow-x-hidden whitespace-nowrap"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="inline-flex gap-3">
          {/* Duplicate the array for seamless loop */}
          {[...topPlayers, ...topPlayers].map((player, index) => {
            const actualIndex = index % topPlayers.length;
            return (
              <div
                key={`${player.user_id}-${index}`}
                className={`clip-hexagon w-28 h-28 flex flex-col items-center justify-center bg-gradient-to-br ${getMedalColor(actualIndex)} border-2 border-purple-400 shadow-lg transform hover:scale-110 transition-transform flex-shrink-0`}
              >
                {actualIndex < 3 && (
                  <Crown className={`w-6 h-6 mb-1 ${
                    actualIndex === 0 ? 'text-yellow-200' :
                    actualIndex === 1 ? 'text-gray-200' :
                    'text-orange-200'
                  }`} />
                )}
                <p className="text-xs font-bold text-white text-center px-2 truncate w-full">
                  {actualIndex + 1}. {player.username}
                </p>
                <p className="text-lg font-black text-white">
                  {player.total_correct_answers}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
