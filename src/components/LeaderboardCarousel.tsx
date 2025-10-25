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
    // Frissítés 5 mp-enként – egyezik a Ranglista oldal ritmusával
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const refresh = async () => {
    console.log('[LeaderboardCarousel] Refreshing data...');
    // TOP 100 (vagy ahány van) a leaderboard_public_cache táblából
    const fromPublic = await fetchFromLeaderboardPublic();
    console.log('[LeaderboardCarousel] fetchFromLeaderboardPublic result:', fromPublic.length, 'players');
    if (fromPublic.length > 0) {
      console.log('[LeaderboardCarousel] First 3 players:', fromPublic.slice(0, 3));
      setTopPlayers(fromPublic.slice(0, 100)); // TOP 100
      return;
    }
    // Fallback: global_leaderboard
    const fromGlobal = await fetchFromGlobalLeaderboard();
    console.log('[LeaderboardCarousel] fetchFromGlobalLeaderboard result:', fromGlobal.length, 'players');
    if (fromGlobal.length > 0) {
      setTopPlayers(fromGlobal.slice(0, 100));
      return;
    }
    // További fallback: heti rangsor
    const fromWeekly = await fetchFromWeeklyRankings();
    console.log('[LeaderboardCarousel] fetchFromWeeklyRankings result:', fromWeekly.length, 'players');
    setTopPlayers(fromWeekly.slice(0, 100));
  };

  const fetchFromLeaderboardPublic = async (): Promise<LeaderboardEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_public_cache')
        .select('rank, username, avatar_url, total_correct_answers')
        .order('rank', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data || []).map((d) => ({
        user_id: `rank-${d.rank}`, // egyedi azonosító RLS mentes módon
        username: d.username ?? 'Player',
        avatar_url: d.avatar_url ?? null,
        total_correct_answers: d.total_correct_answers ?? 0,
      }));
    } catch (e) {
      console.error('[LeaderboardCarousel] leaderboard_public_cache error:', e);
      return [];
    }
  };

  const fetchFromGlobalLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('global_leaderboard')
        .select('user_id, username, total_correct_answers, avatar_url')
        .order('total_correct_answers', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('[LeaderboardCarousel] global_leaderboard error:', e);
      return [];
    }
  };

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const fetchFromWeeklyRankings = async (): Promise<LeaderboardEntry[]> => {
    try {
      const weekStart = getWeekStart();
      const { data, error } = await supabase
        .from('weekly_rankings')
        .select('user_id, total_correct_answers, profiles:profiles!inner(username, avatar_url)')
        .eq('week_start', weekStart)
        .order('total_correct_answers', { ascending: false })
        .limit(200);
      if (error) throw error;

      const map = new Map<string, LeaderboardEntry>();
      (data || []).forEach((row: any) => {
        const uid = row.user_id;
        const name = row.profiles?.username ?? 'Player';
        const avatar = row.profiles?.avatar_url ?? null;
        const prev = map.get(uid);
        const total = (prev?.total_correct_answers || 0) + (row.total_correct_answers || 0);
        map.set(uid, { user_id: uid, username: name, avatar_url: avatar, total_correct_answers: total });
      });
      return Array.from(map.values()).sort((a, b) => b.total_correct_answers - a.total_correct_answers);
    } catch (e) {
      console.error('[LeaderboardCarousel] weekly_rankings error:', e);
      return [];
    }
  };

  // Auto-scroll logika - VÉGTELEN LOOP
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || topPlayers.length === 0) return;
    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = 1.5;
    
    const scroll = () => {
      if (!autoScrollPausedRef.current) {
        scrollPosition += scrollSpeed;
        // Ha elérte a lista felét (duplikált tartalom miatt), visszaugrik az elejére
        const halfWidth = container.scrollWidth / 2;
        if (scrollPosition >= halfWidth) {
          scrollPosition = 0;
          container.scrollLeft = 0;
        } else {
          container.scrollLeft = scrollPosition;
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
      <h3 className="text-center text-xs sm:text-sm font-black text-white mb-1 drop-shadow-lg">🏆 TOP 100 JÁTÉKOS 🏆</h3>
      <div ref={scrollContainerRef} className="overflow-x-hidden whitespace-nowrap h-16 sm:h-20" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="inline-flex gap-2 sm:gap-3 px-2">
          {[...topPlayers, ...topPlayers].map((player, index) => {
            const actualIndex = index % topPlayers.length;
            const rank = actualIndex + 1;
            const showCrown = actualIndex < 3;
            return (
              <div key={`${player.user_id}-${index}`} className="relative clip-hexagon w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                {/* BASE SHADOW */}
                <div className="absolute clip-hexagon" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px', background: 'rgba(0,0,0,0.5)', filter: 'blur(4px)' }} aria-hidden />
                {/* OUTER FRAME */}
                <div className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${getHexagonColor(actualIndex)} border-2 shadow-xl`} style={{ borderColor: actualIndex === 0 ? '#fbbf24' : actualIndex === 1 ? '#d1d5db' : actualIndex === 2 ? '#fb923c' : '#a855f7' }} aria-hidden />
                {/* MIDDLE FRAME */}
                <div className="absolute inset-[2px] clip-hexagon" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4)' }} aria-hidden />
                {/* INNER LAYER */}
                <div className="absolute clip-hexagon" style={{ top: '4px', left: '4px', right: '4px', bottom: '4px', boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
                {/* Content - MÓDOSÍTOTT ELRENDEZÉS */}
                <div className="absolute inset-0 flex flex-col items-center justify-between z-10 px-1 py-1.5">
                  {/* Felső rész: korona + rang */}
                  <div className="flex flex-col items-center gap-0">
                    {showCrown && <Crown className={`w-3 h-3 sm:w-4 sm:h-4 ${getCrownColor(actualIndex)}`} />}
                    <p className="text-[9px] sm:text-[10px] font-black text-white drop-shadow-lg leading-none">{rank}.</p>
                  </div>
                  
                  {/* Középső rész: felhasználónév */}
                  <p className="text-[9px] sm:text-[10px] font-bold text-white text-center truncate w-full drop-shadow-lg">{player.username}</p>
                  
                  {/* Alsó rész: helyes válaszok */}
                  <p className="text-[8px] sm:text-[9px] font-semibold text-white/90 drop-shadow-lg leading-none">{player.total_correct_answers}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
