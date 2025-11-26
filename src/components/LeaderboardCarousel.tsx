import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown } from 'lucide-react';
import { DailyRankingsCountdown } from './DailyRankingsCountdown';
import { LeaderboardSkeleton } from './LeaderboardSkeleton';
import { useI18n } from '@/i18n';
import { useLeaderboardQuery } from '@/hooks/queries/useLeaderboardQuery';
import { useProfileQuery } from '@/hooks/useProfileQuery';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_correct_answers: number;
  avatar_url: string | null;
}

const LeaderboardCarouselComponent = () => {
  const { t } = useI18n();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile } = useProfileQuery(userId);
  const { leaderboard, loading } = useLeaderboardQuery(profile?.country_code);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollPausedRef = useRef(false);
  const autoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });
  }, []);

  const topPlayers = leaderboard.slice(0, 100);

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
      // Resume auto-scroll after 500ms (instant UX, minimal pause)
      autoScrollTimeoutRef.current = setTimeout(() => {
        autoScrollPausedRef.current = false;
      }, 500);
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

  // Memoized color functions to prevent recalculation
  const getHexagonColor = useCallback((index: number) => {
    if (index === 0) return 'from-gold via-gold to-gold-dark'; // Arany
    if (index === 1) return 'from-muted via-muted-foreground to-muted'; // Ezüst
    if (index === 2) return 'from-gold-dark via-gold-dark to-gold'; // Bronz
    return 'from-primary via-primary to-primary'; // Lila
  }, []);

  const getCrownColor = useCallback((index: number) => {
    if (index === 0) return 'text-gold';
    if (index === 1) return 'text-muted';
    if (index === 2) return 'text-gold-dark';
    return '';
  }, []);

  return (
    <div className="w-full py-1">
      {/* Daily Rankings Countdown with TOP 100 title inside */}
      <div className="flex justify-center mb-2">
        <DailyRankingsCountdown compact={false} />
      </div>
      
      <div ref={scrollContainerRef} className="overflow-x-hidden whitespace-nowrap h-16 sm:h-20 md:h-24" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {loading || topPlayers.length === 0 ? (
          <LeaderboardSkeleton />
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

// Memoize entire component to prevent unnecessary re-renders
export const LeaderboardCarousel = memo(LeaderboardCarouselComponent);
