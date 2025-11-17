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
  const autoScrollPausedRef = useRef(false);
  const autoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refresh();
    
    // Real-time subscription for weekly_rankings updates
    const channel = supabase
      .channel('weekly-rankings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_rankings'
        },
        () => {
          console.log('[LeaderboardCarousel] Real-time update received, refreshing...');
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refresh = async () => {
    console.log('[LeaderboardCarousel] Refreshing weekly rankings data...');
    // Only show current week's rankings
    const weeklyData = await fetchFromWeeklyRankings();
    console.log('[LeaderboardCarousel] fetchFromWeeklyRankings result:', weeklyData.length, 'players');
    setTopPlayers(weeklyData.slice(0, 100));
  };


  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const fetchFromWeeklyRankings = async (): Promise<LeaderboardEntry[]> => {
    try {
      const weekStart = getWeekStart();
      const { data, error } = await supabase
        .from('weekly_rankings')
        .select('user_id, total_correct_answers, profiles:profiles!inner(username, avatar_url)')
        .eq('week_start', weekStart)
        .order('total_correct_answers', { ascending: false });
      if (error) throw error;

      // Aggregate by user_id - sum all categories for each user
      const userMap = new Map<string, LeaderboardEntry>();
      (data || []).forEach((row: any) => {
        const uid = row.user_id;
        const existing = userMap.get(uid);
        const correctAnswers = row.total_correct_answers || 0;
        
        if (existing) {
          existing.total_correct_answers += correctAnswers;
        } else {
          userMap.set(uid, {
            user_id: uid,
            username: row.profiles?.username ?? 'Player',
            avatar_url: row.profiles?.avatar_url ?? null,
            total_correct_answers: correctAnswers
          });
        }
      });

      // Sort by total_correct_answers and return TOP 100
      return Array.from(userMap.values())
        .sort((a, b) => b.total_correct_answers - a.total_correct_answers)
        .slice(0, 100);
    } catch (e) {
      console.error('[LeaderboardCarousel] weekly_rankings error:', e);
      return [];
    }
  };

  // Auto-scroll logika - egyszerű lineáris scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || topPlayers.length === 0) return;
    let animationFrameId: number;
    const scrollSpeed = 1.5;
    
    const scroll = () => {
      if (!autoScrollPausedRef.current) {
        container.scrollLeft += scrollSpeed;
        
        // Ha elérte a végét, visszaugrik az elejére
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [topPlayers]);

  // Érintéses/manuális csúsztatás
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const pauseAutoScroll = () => {
      autoScrollPausedRef.current = true;
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
      autoScrollTimeoutRef.current = setTimeout(() => {
        autoScrollPausedRef.current = false;
      }, 3000);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.style.cursor = 'grabbing';
      pauseAutoScroll();
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDragging = true;
      startX = e.touches[0].pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      pauseAutoScroll();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };

    const handleEnd = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    container.style.cursor = 'grab';
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('mouseup', handleEnd);
    container.addEventListener('mouseleave', handleEnd);
    container.addEventListener('touchend', handleEnd);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('mouseup', handleEnd);
      container.removeEventListener('mouseleave', handleEnd);
      container.removeEventListener('touchend', handleEnd);
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  const getHexagonColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 via-yellow-500 to-yellow-600'; // Arany
    if (index === 1) return 'from-gray-300 via-gray-400 to-gray-500'; // Ezüst
    if (index === 2) return 'from-orange-400 via-orange-500 to-orange-600'; // Bronz
    return 'from-purple-500 via-purple-600 to-purple-700'; // Lila
  };

  const getCrownColor = (index: number) => {
    if (index === 0) return 'text-yellow-300';
    if (index === 1) return 'text-gray-200';
    if (index === 2) return 'text-orange-300';
    return '';
  };

  if (topPlayers.length === 0) return null;

  return (
    <div className="w-full py-1">
      <h3 className="text-center text-xs sm:text-sm md:text-base font-black text-white mb-1 drop-shadow-lg">🏆 TOP 100 JÁTÉKOS 🏆</h3>
      <div ref={scrollContainerRef} className="overflow-x-hidden whitespace-nowrap h-16 sm:h-20 md:h-24" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="inline-flex gap-2 sm:gap-3 px-2">
          {topPlayers.map((player, index) => {
            const rank = index + 1;
            const showCrown = index < 3;
            return (
              <div key={player.user_id} className="relative clip-hexagon w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
                {/* BASE SHADOW */}
                <div className="absolute clip-hexagon" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px', background: 'rgba(0,0,0,0.5)', filter: 'blur(4px)' }} aria-hidden />
                {/* OUTER FRAME */}
                <div className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${getHexagonColor(index)} border-2 shadow-xl`} style={{ borderColor: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#fb923c' : '#a855f7' }} aria-hidden />
                {/* MIDDLE FRAME */}
                <div className="absolute inset-[2px] clip-hexagon" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4)' }} aria-hidden />
                {/* INNER LAYER */}
                <div className="absolute clip-hexagon" style={{ top: '4px', left: '4px', right: '4px', bottom: '4px', boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-between z-10 px-1 py-1.5">
                  {/* Felső rész: korona + rang */}
                  <div className="flex flex-col items-center gap-0">
                    {showCrown && <Crown className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${getCrownColor(index)}`} />}
                    <p className="text-[9px] sm:text-[10px] md:text-xs font-black text-white drop-shadow-lg leading-none">{rank}.</p>
                  </div>
                  
                  {/* Középső rész: felhasználónév */}
                  <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white text-center truncate w-full drop-shadow-lg">{player.username}</p>
                  
                  {/* Alsó rész: helyes válaszok */}
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold text-white/90 drop-shadow-lg leading-none">{player.total_correct_answers}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
