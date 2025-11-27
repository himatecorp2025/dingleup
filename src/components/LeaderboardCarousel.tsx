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

// Scroll speed in pixels per second (frame rate-independent)
const SCROLL_SPEED_PX_PER_SEC = 100;

const LeaderboardCarouselComponent = () => {
  const { t } = useI18n();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile } = useProfileQuery(userId);
  const { leaderboard, loading } = useLeaderboardQuery(profile?.country_code);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const contentWidthRef = useRef<number>(0);
  const translateXRef = useRef<number>(0);

  // Get user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });
  }, []);

  const topPlayers = leaderboard.slice(0, 100);

  // Calculate and update contentWidth (half of duplicated list)
  const updateContentWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    
    // Use scrollWidth / 2 for exact DOM-calculated width
    // This is the most accurate way to get the width of one full list cycle
    contentWidthRef.current = track.scrollWidth / 2;
  }, []);

  // Frame rate-independent scroll animation using translate3d
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    
    if (!container || !track || topPlayers.length === 0) return;

    // Reset transform position
    translateXRef.current = 0;
    lastTimestampRef.current = null;
    
    // Wait for layout to be fully ready before measuring
    const initContentWidth = () => {
      setTimeout(() => {
        if (!track || track.children.length === 0) return;
        updateContentWidth();
        
        // Only start animation after contentWidth is measured
        if (contentWidthRef.current > 0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }, 50); // Small delay to ensure full layout
    };

    const animate = (timestamp: number) => {
      const currentTrack = trackRef.current;
      
      // Always continue animation as long as track exists
      if (!currentTrack) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Initialize timestamp on first frame
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate delta time in seconds
      const deltaMs = timestamp - lastTimestampRef.current;
      const deltaPx = (SCROLL_SPEED_PX_PER_SEC * deltaMs) / 1000;

      // Update translateX position (moving left, so negative) and snap to whole pixels
      const nextX = translateXRef.current - deltaPx;
      translateXRef.current = -Math.round(Math.abs(nextX));

      // Seamless wrap using modulo - no visible jump
      const contentWidth = contentWidthRef.current;
      if (contentWidth > 0) {
        const absX = Math.abs(translateXRef.current);
        if (absX >= contentWidth) {
          // Use modulo to wrap seamlessly
          translateXRef.current = -(absX % contentWidth);
        }
      }

      // Apply transform using translate3d for GPU acceleration and subpixel precision
      currentTrack.style.transform = `translate3d(${translateXRef.current}px, 0, 0)`;

      // Update timestamp for next frame
      lastTimestampRef.current = timestamp;

      // ALWAYS request next frame - never stop
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Initialize contentWidth and start animation
    initContentWidth();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [topPlayers.length, updateContentWidth]);

  // Handle window resize and recalculate contentWidth
  useEffect(() => {
    if (topPlayers.length === 0) return;

    const handleResize = () => {
      updateContentWidth();
    };

    window.addEventListener('resize', handleResize);
    
    // Recalculate on data change
    updateContentWidth();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [topPlayers, updateContentWidth]);

  // Memoized color functions to prevent recalculation
  const getHexagonColor = useCallback((index: number) => {
    if (index === 0) return 'from-gold via-gold to-gold-dark'; // Arany (ezüst stílusában)
    if (index === 1) return 'from-muted via-muted-foreground to-muted'; // Ezüst
    if (index === 2) return 'from-amber-700 via-amber-600 to-amber-800'; // Bronz (ezüst stílusában)
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
        <DailyRankingsCountdown compact={false} userTimezone={profile?.user_timezone || 'Europe/Budapest'} />
      </div>
      
      <div 
        ref={containerRef}
        className="overflow-hidden whitespace-nowrap h-16 sm:h-20 md:h-24 relative"
      >
        {loading || topPlayers.length === 0 ? (
          <LeaderboardSkeleton />
        ) : (
          <div ref={trackRef} className="inline-flex gap-2 sm:gap-3 px-2 will-change-transform">
            {/* Dupla rendering: eredeti lista + másolat zökkenőmentes loophoz */}
            {[...topPlayers, ...topPlayers].map((player, index) => {
              const rank = (index % topPlayers.length) + 1;
              const showCrown = (index % topPlayers.length) < 3;
              const rankIndex = index % topPlayers.length;
              
              // Get border and shadow colors based on rank
              const getBorderColor = () => {
                if (rankIndex === 0) return 'hsl(var(--gold))'; // Arany
                if (rankIndex === 1) return 'hsl(var(--muted))'; // Ezüst
                if (rankIndex === 2) return '#92400e'; // Bronz
                return 'hsl(var(--primary))'; // Lila
              };
              
              const getShadowColor = () => {
                if (rankIndex === 0) return 'shadow-[0_0_20px_rgba(234,179,8,0.6),0_8px_25px_rgba(0,0,0,0.5)]'; // Gold glow (ezüst stílusában)
                if (rankIndex === 1) return 'shadow-[0_0_20px_rgba(156,163,175,0.6),0_8px_25px_rgba(0,0,0,0.5)]'; // Silver glow
                if (rankIndex === 2) return 'shadow-[0_0_20px_rgba(146,64,14,0.6),0_8px_25px_rgba(0,0,0,0.5)]'; // Bronze glow
                return 'shadow-[0_0_20px_rgba(168,85,247,0.6),0_8px_25px_rgba(0,0,0,0.5)]'; // Purple glow
              };
              
              return (
                <div key={`${player.user_id}-${index}`} className="relative clip-hexagon w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
                  {/* BASE SHADOW (3D depth) */}
                  <div 
                    className="absolute clip-hexagon" 
                    style={{ 
                      top: '3px', 
                      left: '3px', 
                      right: '-3px', 
                      bottom: '-3px', 
                      background: 'rgba(0,0,0,0.35)', 
                      filter: 'blur(3px)' 
                    }} 
                    aria-hidden 
                  />
                  
                  {/* OUTER FRAME - gradient with border */}
                  <div 
                    className={`absolute inset-0 clip-hexagon bg-gradient-to-br ${getHexagonColor(rankIndex)} border-2 ${getShadowColor()}`}
                    style={{ borderColor: getBorderColor() }}
                    aria-hidden 
                  />
                  
                  {/* MIDDLE FRAME (bright inner highlight) */}
                  <div 
                    className={`absolute inset-[3px] clip-hexagon bg-gradient-to-b ${getHexagonColor(rankIndex)}`}
                    style={{ boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15)' }}
                    aria-hidden 
                  />
                  
                  {/* INNER CRYSTAL/COLOR LAYER */}
                  <div 
                    className={`absolute clip-hexagon bg-gradient-to-b ${getHexagonColor(rankIndex)}`}
                    style={{ 
                      top: '5px', 
                      left: '5px', 
                      right: '5px', 
                      bottom: '5px', 
                      boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.15)' 
                    }}
                    aria-hidden 
                  />
                  
                  {/* SPECULAR HIGHLIGHT (top-left) */}
                  <div 
                    className="absolute clip-hexagon pointer-events-none"
                    style={{ 
                      top: '5px', 
                      left: '5px', 
                      right: '5px', 
                      bottom: '5px', 
                      background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)' 
                    }}
                    aria-hidden 
                  />
                  
                  {/* INNER GLOW (bottom shadow for 3D depth) */}
                  <div 
                    className="absolute clip-hexagon pointer-events-none"
                    style={{ 
                      top: '5px', 
                      left: '5px', 
                      right: '5px', 
                      bottom: '5px', 
                      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.125)' 
                    }}
                    aria-hidden 
                  />
                  
                  {/* ANIMATED SPARKLES - csak 1. helyezett */}
                  {rankIndex === 0 && (
                    <svg 
                      className="absolute inset-0 w-full h-full pointer-events-none clip-hexagon"
                      style={{ top: '5px', left: '5px', right: '5px', bottom: '5px' }}
                      viewBox="0 0 100 100"
                      preserveAspectRatio="xMidYMid slice"
                    >
                      {/* Sparkle 1 - top left */}
                      <circle cx="25" cy="20" r="3.5" fill="#ffffff" opacity="0.95">
                        <animate attributeName="opacity" values="0.95;0.4;0.95" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      {/* Sparkle 2 - top right */}
                      <circle cx="75" cy="25" r="3" fill="#fef3c7" opacity="0.85">
                        <animate attributeName="opacity" values="0.85;0.3;0.85" dur="2.5s" repeatCount="indefinite"/>
                      </circle>
                      {/* Sparkle 3 - middle left */}
                      <circle cx="20" cy="50" r="2.8" fill="#fde047" opacity="0.75">
                        <animate attributeName="opacity" values="0.75;0.25;0.75" dur="3s" repeatCount="indefinite"/>
                      </circle>
                      {/* Sparkle 4 - middle right */}
                      <circle cx="80" cy="55" r="2.5" fill="#ffffff" opacity="0.8">
                        <animate attributeName="opacity" values="0.8;0.35;0.8" dur="2.2s" repeatCount="indefinite"/>
                      </circle>
                      {/* Sparkle 5 - bottom center */}
                      <circle cx="50" cy="80" r="2.2" fill="#fef3c7" opacity="0.7">
                        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.8s" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                  )}
                  
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-between z-10 px-1 py-1.5">
                    {/* Felső rész: korona + rang */}
                    <div className="flex flex-col items-center gap-0">
                      {showCrown && <Crown className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${getCrownColor(rankIndex)} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`} />}
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
