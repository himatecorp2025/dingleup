import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown } from 'lucide-react';
import { getWeekStartInUserTimezone } from '@/lib/utils';
import { WeeklyRankingsCountdown } from './WeeklyRankingsCountdown';

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
  const countryCodeCacheRef = useRef<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      // Azonnali betöltés cache-sel és párhuzamos lekérdezésekkel
      const weeklyData = await fetchFromWeeklyRankings();
      setTopPlayers(weeklyData.slice(0, 100));
    };

    // Azonnal indítjuk a betöltést
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
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    // Azonnali betöltés cache-sel és párhuzamos lekérdezésekkel
    const weeklyData = await fetchFromWeeklyRankings();
    setTopPlayers(weeklyData.slice(0, 100));
  };



  const fetchFromWeeklyRankings = async (): Promise<LeaderboardEntry[]> => {
    try {
      // Cache country code - csak egyszer kérdezzük le
      let countryCode = countryCodeCacheRef.current;
      
      if (!countryCode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return [];
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('country_code')
          .eq('id', user.id)
          .single();
        
        countryCode = profile?.country_code || 'HU';
        countryCodeCacheRef.current = countryCode;
      }
      
      const weekStart = getWeekStartInUserTimezone();
      
      // Párhuzamos lekérdezések: TOP 100 és fill users egyszerre
      const [rankingsResult, fillResult] = await Promise.all([
        supabase
          .from('weekly_rankings')
          .select(`
            user_id,
            total_correct_answers,
            profiles!inner (
              username,
              avatar_url,
              country_code
            )
          `)
          .eq('week_start', weekStart)
          .eq('category', 'mixed')
          .eq('profiles.country_code', countryCode)
          .order('total_correct_answers', { ascending: false })
          .limit(100),
        
        // Előre lekérdezzük a fill users-t is párhuzamosan
        supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('country_code', countryCode)
          .order('created_at', { ascending: true })
          .limit(100)
      ]);
      
      const { data: topRankings, error: rankingsError } = rankingsResult;
      
      if (rankingsError) {
        return [];
      }
      
      const entries: LeaderboardEntry[] = (topRankings || []).map(row => ({
        user_id: row.user_id,
        username: (row.profiles as any)?.username || 'Player',
        avatar_url: (row.profiles as any)?.avatar_url || null,
        total_correct_answers: row.total_correct_answers || 0
      }));
      
      // Ha kevesebb mint 100, használjuk a párhuzamosan lekérdezett fill users-t
      if (entries.length < 100) {
        const existingUserIds = entries.map(e => e.user_id);
        const { data: allFillUsers } = fillResult;
        
        if (allFillUsers) {
          const filteredFillUsers = allFillUsers
            .filter(u => !existingUserIds.includes(u.id))
            .slice(0, 100 - entries.length);
          
          filteredFillUsers.forEach(u => {
            entries.push({
              user_id: u.id,
              username: u.username || 'Player',
              avatar_url: u.avatar_url || null,
              total_correct_answers: 0
            });
          });
        }
      }

      return entries;
    } catch (e) {
      console.error('[LeaderboardCarousel] weekly_rankings error:', e);
      return [];
    }
  };

  // Auto-scroll logika - infinite loop with seamless transition
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || topPlayers.length === 0) return;
    let animationFrameId: number;
    const scrollSpeed = 1.5;
    
    const scroll = () => {
      if (!autoScrollPausedRef.current) {
        container.scrollLeft += scrollSpeed;
        
        // Körköröz scroll: ha elértük a duplikált tartalom felét, visszaugrik az elejére (zökkenőmentes)
        const halfWidth = container.scrollWidth / 2;
        if (container.scrollLeft >= halfWidth) {
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
    if (index === 0) return 'from-gold via-gold to-gold-dark'; // Arany
    if (index === 1) return 'from-muted via-muted-foreground to-muted'; // Ezüst
    if (index === 2) return 'from-gold-dark via-gold-dark to-gold'; // Bronz
    return 'from-primary via-primary to-primary'; // Lila
  };

  const getCrownColor = (index: number) => {
    if (index === 0) return 'text-gold';
    if (index === 1) return 'text-muted';
    if (index === 2) return 'text-gold-dark';
    return '';
  };

  return (
    <div className="w-full py-1">
      <h3 className="text-center text-xs sm:text-sm md:text-base font-black text-foreground mb-1 drop-shadow-lg">🏆 TOP 100 JÁTÉKOS 🏆</h3>
      
      {/* Weekly Rankings Countdown moved here from top section */}
      <div className="flex justify-center mb-2">
        <WeeklyRankingsCountdown compact={false} />
      </div>
      
      <div ref={scrollContainerRef} className="overflow-x-hidden whitespace-nowrap h-16 sm:h-20 md:h-24" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {topPlayers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-xs sm:text-sm">Ranglista betöltése...</p>
          </div>
        ) : (
          <div className="inline-flex gap-2 sm:gap-3 px-2">
            {/* Dupla rendering: eredeti lista + másolat körköröz scrollhoz */}
            {[...topPlayers, ...topPlayers].map((player, index) => {
              const rank = (index % topPlayers.length) + 1;
              const showCrown = (index % topPlayers.length) < 3;
              return (
                <div key={`${player.user_id}-${index}`} className="relative clip-hexagon w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
                  {/* BASE SHADOW */}
                  <div className="absolute clip-hexagon" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px', background: 'rgba(0,0,0,0.5)', filter: 'blur(4px)' }} aria-hidden />
                  {/* OUTER FRAME */}
                  <div className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${getHexagonColor(index % topPlayers.length)} border-2 shadow-xl`} style={{ borderColor: (index % topPlayers.length) === 0 ? 'hsl(var(--gold))' : (index % topPlayers.length) === 1 ? 'hsl(var(--muted))' : (index % topPlayers.length) === 2 ? 'hsl(var(--gold-dark))' : 'hsl(var(--primary))' }} aria-hidden />
                  {/* MIDDLE FRAME */}
                  <div className="absolute inset-[2px] clip-hexagon" style={{ background: 'linear-gradient(180deg, hsl(var(--primary-foreground) / 0.3), hsl(var(--primary-foreground) / 0.1))', boxShadow: 'inset 0 2px 0 hsl(var(--primary-foreground) / 0.4)' }} aria-hidden />
                  {/* INNER LAYER */}
                  <div className="absolute clip-hexagon" style={{ top: '4px', left: '4px', right: '4px', bottom: '4px', boxShadow: 'inset 0 4px 8px hsl(var(--primary-foreground) / 0.3), inset 0 -4px 8px hsl(var(--background) / 0.3)' }} aria-hidden />
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-between z-10 px-1 py-1.5">
                    {/* Felső rész: korona + rang */}
                    <div className="flex flex-col items-center gap-0">
                      {showCrown && <Crown className={`w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ${getCrownColor(index % topPlayers.length)}`} />}
                      <p className="text-[9px] sm:text-[10px] md:text-xs font-black text-primary-foreground drop-shadow-lg leading-none">{rank}.</p>
                    </div>
                    
                    {/* Középső rész: felhasználónév */}
                    <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-primary-foreground text-center truncate w-full drop-shadow-lg">{player.username}</p>
                    
                    {/* Alsó rész: helyes válaszok */}
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold text-primary-foreground/90 drop-shadow-lg leading-none">{player.total_correct_answers}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
