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
    <div className="w-full mb-4">
      <h3 className="text-center text-sm font-bold text-white mb-2">
        🏆 TOP 25 JÁTÉKOS 🏆
      </h3>
      
      <div
        ref={scrollContainerRef}
        className="overflow-x-hidden whitespace-nowrap h-16"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="inline-flex gap-2">
          {/* Duplicate the array for seamless loop */}
          {[...topPlayers, ...topPlayers].map((player, index) => {
            const actualIndex = index % topPlayers.length;
            return (
              <div
                key={`${player.user_id}-${index}`}
                className="relative clip-hexagon w-16 h-16 flex-shrink-0"
              >
                {/* BASE SHADOW (3D depth) */}
                <div
                  className="absolute clip-hexagon"
                  style={{
                    top: '2px',
                    left: '2px',
                    right: '-2px',
                    bottom: '-2px',
                    background: 'rgba(0,0,0,0.35)',
                    filter: 'blur(2px)',
                  }}
                  aria-hidden
                />

                {/* OUTER FRAME */}
                <div
                  className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${getMedalColor(actualIndex)} border border-purple-400 shadow-md`}
                  aria-hidden
                />

                {/* MIDDLE FRAME */}
                <div
                  className="absolute inset-[2px] clip-hexagon bg-gradient-to-b"
                  style={{
                    background: `linear-gradient(180deg, rgba(255,255,255,0.2), transparent)`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                  aria-hidden
                />

                {/* INNER LAYER */}
                <div
                  className="absolute clip-hexagon"
                  style={{
                    top: '3px',
                    left: '3px',
                    right: '3px',
                    bottom: '3px',
                    boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.2), inset 0 -4px 8px rgba(0,0,0,0.3)',
                  }}
                  aria-hidden
                />

                {/* SPECULAR HIGHLIGHT */}
                <div
                  className="absolute clip-hexagon pointer-events-none"
                  style={{
                    top: '3px',
                    left: '3px',
                    right: '3px',
                    bottom: '3px',
                    background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)',
                  }}
                  aria-hidden
                />

                {/* DIAGONAL LIGHT STREAKS */}
                <div
                  className="absolute clip-hexagon pointer-events-none"
                  style={{
                    top: '3px',
                    left: '3px',
                    right: '3px',
                    bottom: '3px',
                    background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.06) 9px)',
                    opacity: 0.7,
                  }}
                  aria-hidden
                />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 transform hover:scale-105 transition-transform">
                  {actualIndex < 3 && (
                    <Crown className={`${actualIndex === 0 ? 'w-4 h-4' : 'w-3 h-3'} mb-0.5 ${
                      actualIndex === 0 ? 'text-yellow-200' :
                      actualIndex === 1 ? 'text-gray-200' :
                      'text-orange-200'
                    }`} />
                  )}
                  <p className={`${actualIndex < 3 ? 'text-[9px]' : 'text-[8px]'} font-bold text-white text-center px-1 truncate w-full`}>
                    {actualIndex + 1}. {player.username}
                  </p>
                  <p className={`${actualIndex < 3 ? 'text-sm' : 'text-xs'} font-black text-white`}>
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
