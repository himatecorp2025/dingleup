import { useEffect, useState } from 'react';
import { DiamondHexagon } from '@/components/DiamondHexagon';
import { DiamondButton } from '@/components/DiamondButton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useDailyGift } from '@/hooks/useDailyGift';
import { useWelcomeBonus } from '@/hooks/useWelcomeBonus';
import { useWeeklyWinners } from '@/hooks/useWeeklyWinners';
import { useScrollBehavior } from '@/hooks/useScrollBehavior';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { useWallet } from '@/hooks/useWallet';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useWeeklyWinnersPopup } from '@/hooks/useWeeklyWinnersPopup';

import DailyGiftDialog from '@/components/DailyGiftDialog';
import { WelcomeBonusDialog } from '@/components/WelcomeBonusDialog';
import { WeeklyWinnersDialog } from '@/components/WeeklyWinnersDialog';
import { LeaderboardCarousel } from '@/components/LeaderboardCarousel';
import { WeeklyRankingsCountdown } from '@/components/WeeklyRankingsCountdown';
import { NextLifeTimer } from '@/components/NextLifeTimer';
import { FallingCoins } from '@/components/FallingCoins';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { IdleWarning } from '@/components/IdleWarning';

import { WeeklyWinnerPopup } from '@/components/WeeklyWinnerPopup';

import BottomNav from '@/components/BottomNav';
import gameBackground from '@/assets/game-background.png';
import { toast } from 'sonner';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { isHandheld, isStandalone } = usePlatformDetection();
  const { canMountModals } = useScrollBehavior();
  const { markActive } = useActivityTracker('route_view');
  const { profile, loading, regenerateLives, refreshProfile } = useGameProfile(userId);
  const { walletData, serverDriftMs, refetchWallet } = useWallet(userId);
  
  // Auto logout on inactivity with warning
  const { showWarning, remainingSeconds, handleStayActive } = useAutoLogout();
  const { canClaim, showPopup, weeklyEntryCount, nextReward, claiming, claimDailyGift, checkDailyGift, handleLater, showDailyGiftPopup, setShowPopup } = useDailyGift(userId, false);
  const { canClaim: canClaimWelcome, claiming: claimingWelcome, claimWelcomeBonus, handleLater: handleWelcomeLater } = useWelcomeBonus(userId);
  const { showDialog: showWeeklyWinners, handleClose: handleWeeklyWinnersClose } = useWeeklyWinners(userId);
  const { showPopup: showWeeklyWinnersPopup, triggerPopup: triggerWeeklyWinnersPopup, closePopup: closeWeeklyWinnersPopup, canShowThisWeek: canShowWeeklyPopup } = useWeeklyWinnersPopup(userId);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [dailyGiftJustClaimed, setDailyGiftJustClaimed] = useState(false);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  
  // Instant wallet sync via broadcast (no 3s delay)
  useBroadcastChannel({
    channelName: 'wallet',
    onMessage: (message) => {
      if (message?.type === 'wallet:update') {
        refetchWallet();
        refreshProfile();
      }
    },
    enabled: true,
  });
  

  // Helper function
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  };

  const getWeekEnd = () => {
    const weekStart = new Date(getWeekStart());
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6); // Sunday
    sunday.setHours(23, 59, 59, 999);
    return sunday.toISOString();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  // Show Welcome Bonus dialog FIRST (highest priority) - TESTING MODE: show on desktop too, with 1s delay
  useEffect(() => {
    if (canMountModals && canClaimWelcome && userId) {
      const t = setTimeout(() => {
        setShowWelcomeBonus(true);
        setShowPopup(false);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [canMountModals, canClaimWelcome, userId]);

  // Show Daily Gift dialog SECOND (after welcome bonus) - AUTOMATIC, no auto-claim
  useEffect(() => {
    if (canMountModals && canClaim && !showWelcomeBonus && !showWeeklyWinners && userId) {
      setShowPopup(true);
    }
  }, [canMountModals, canClaim, showWelcomeBonus, showWeeklyWinners, userId]);



  // Realtime weekly rank updates - aggregated across all categories for current week
  useEffect(() => {
    if (!userId) return;

    const getWeekStartForRank = () => {
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - diff);
      monday.setUTCHours(0, 0, 0, 0);
      return monday.toISOString().split('T')[0];
    };

    const fetchUserWeeklyRank = async () => {
      try {
        const weekStart = getWeekStartForRank();
        
        // Query weekly_rankings for current week - all categories
        const { data, error } = await supabase
          .from('weekly_rankings')
          .select('user_id, total_correct_answers')
          .eq('week_start', weekStart);
        
        if (error) {
          console.error('Error fetching weekly rankings:', error);
          // Even on error, show rank as if user has 0 correct answers
          setCurrentRank(1);
          return;
        }
        
        if (!data || data.length === 0) {
          // No data yet this week - user is rank 1 with 0 correct answers
          setCurrentRank(1);
          return;
        }

        // Aggregate total_correct_answers per user across all categories
        const userTotals = new Map<string, number>();
        data.forEach(entry => {
          const currentTotal = userTotals.get(entry.user_id) || 0;
          userTotals.set(entry.user_id, currentTotal + entry.total_correct_answers);
        });

        // Ensure current user is in the map (even if no games played this week)
        if (userId && !userTotals.has(userId)) {
          userTotals.set(userId, 0);
        }

        // Sort by total correct answers (descending)
        const sortedUsers = Array.from(userTotals.entries())
          .sort((a, b) => b[1] - a[1]);

        // Find current user's rank - they will always be found now
        const userRank = sortedUsers.findIndex(([uid]) => uid === userId);
        if (userRank !== -1) {
          setCurrentRank(userRank + 1); // +1 because findIndex is 0-based
        } else {
          setCurrentRank(null);
        }
      } catch (err) {
        console.error('Exception fetching weekly user rank:', err);
        setCurrentRank(null);
      }
    };
    
    // Fetch immediately on mount
    fetchUserWeeklyRank();
    
    // Subscribe to realtime changes in weekly_rankings
    const leaderboardChannel = supabase
      .channel('weekly-leaderboard-rank-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_rankings'
        },
        () => {
          // Weekly rankings changed -> recalculate rank
          fetchUserWeeklyRank();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(leaderboardChannel);
    };
  }, [userId]);

  const handleClaimDailyGift = async (): Promise<boolean> => {
    const success = await claimDailyGift(refetchWallet);
    if (success) {
      await checkDailyGift();
      await refreshProfile();
      setDailyGiftJustClaimed(true);
      triggerWeeklyWinnersPopup();
      setTimeout(() => setDailyGiftJustClaimed(false), 2000);
    }
    return success;
  };

  const handleCloseDailyGift = () => {
    handleLater();
    setShowPopup(false);
    // Trigger weekly winners popup 3 seconds after dismissing
    triggerWeeklyWinnersPopup();
  };

  const handleClaimWelcomeBonus = async () => {
    const success = await claimWelcomeBonus();
    if (success) {
      setShowWelcomeBonus(false);
      // Reload profile and wallet to show updated coins and lives
      await refreshProfile();
      await refetchWallet();
      // Check if Daily Gift should appear after Welcome Bonus
      setTimeout(async () => {
        await checkDailyGift();
      }, 500);
    }
    return success;
  };

  if (loading) {
  return (
    <div className="min-h-dvh min-h-svh flex items-center justify-center bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
      <p className="text-lg text-foreground">Betöltés...</p>
    </div>
  );
}

if (!profile) {
  return (
    <div className="min-h-dvh min-h-svh flex items-center justify-center bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
      <p className="text-lg text-foreground">Betöltés...</p>
    </div>
  );
}

  return (
    <div className="min-h-svh min-h-dvh w-screen overflow-x-hidden relative" style={{
      background: 'transparent'
    }}>
      {/* Background image - EXTENDS BEYOND safe-area to cover status bar */}
      <div 
        className="fixed z-0" 
        style={{
          backgroundImage: `url(${gameBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: '50% 50%',
          backgroundAttachment: 'fixed',
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          width: 'calc(100vw + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
          height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none'
        }}
      />
    {/* Idle warning (60s countdown before logout) */}
    <IdleWarning 
      show={showWarning} 
      remainingSeconds={remainingSeconds} 
      onStayActive={handleStayActive} 
    />
    
    {/* Weekly winner popup (old version - will be replaced) */}
    <WeeklyWinnerPopup userId={userId} />
    
    {/* Weekly Winners Dialog - minden héten egyszer megjelenik */}
    <WeeklyWinnersDialog 
      open={showWeeklyWinnersPopup} 
      onClose={closeWeeklyWinnersPopup} 
    />
    
    {/* Falling coins background */}
    <FallingCoins />
      
      {/* Casino lights removed per user requirement */}
      
        <div className="min-h-dvh w-full flex flex-col overflow-x-hidden px-3 max-w-screen-lg mx-auto relative z-10" style={{ paddingTop: 'max(calc(env(safe-area-inset-top) + 2%), env(safe-area-inset-top) + 8px)' }}>
        {/* Top Section */}
        <div className="flex flex-col gap-3 mb-3 flex-shrink-0">
          {/* First Row: Username and Stats */}
          <div className="flex items-center justify-between">
            {/* Left: Greeting */}
            <div className="flex items-center gap-3 h-12 sm:h-16 md:h-20">
              <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-yellow-400">
                Szia, {profile.username}!
              </h1>
            </div>

            {/* Right: Stats & Avatar */}
            <div className="flex items-center gap-1.5 sm:gap-2" data-tutorial="profile-header">
              {/* Rank Hexagon - 3D Diamond */}
              <DiamondHexagon type="rank" value={currentRank !== null ? currentRank : '...'} />

              {/* Coins Hexagon - 3D Diamond - server authoritative */}
              <DiamondHexagon type="coins" value={walletData?.coinsCurrent ?? profile.coins} />

              {/* Lives Hexagon with Timer - 3D Diamond - server authoritative */}
              <div className="relative flex flex-col items-center">
                <DiamondHexagon type="lives" value={walletData?.livesCurrent ?? profile.lives} />
                {/* Life Regeneration Timer - server authoritative */}
                <NextLifeTimer
                  nextLifeAt={walletData?.nextLifeAt || null}
                  livesCurrent={walletData?.livesCurrent ?? profile.lives}
                  livesMax={walletData?.livesMax || profile.max_lives}
                  serverDriftMs={serverDriftMs}
                  onExpired={() => {
                    refetchWallet();
                    refreshProfile();
                  }}
                />
              </div>

               {/* Avatar Hexagon */}
              <button
                onClick={() => navigate('/profile')}
                className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square hover:scale-105 transition-transform"
              >
                {/* BASE SHADOW (3D depth) */}
                <div
                  className="absolute clip-hexagon"
                  style={{
                    top: '3px',
                    left: '3px',
                    right: '-3px',
                    bottom: '-3px',
                    background: 'rgba(0,0,0,0.35)',
                    filter: 'blur(3px)',
                  }}
                  aria-hidden
                />

                {/* OUTER FRAME */}
                <div
                  className="absolute inset-0 clip-hexagon bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 sm:border-4 border-purple-400 shadow-lg shadow-purple-500/50"
                  aria-hidden
                />

                {/* MIDDLE FRAME */}
                <div
                  className="absolute inset-[3px] clip-hexagon bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                  aria-hidden
                />

                {/* INNER LAYER */}
                <div
                  className="absolute clip-hexagon bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700"
                  style={{
                    top: '5px',
                    left: '5px',
                    right: '5px',
                    bottom: '5px',
                    boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)',
                  }}
                  aria-hidden
                />

                {/* SPECULAR HIGHLIGHT */}
                <div
                  className="absolute clip-hexagon pointer-events-none"
                  style={{
                    top: '5px',
                    left: '5px',
                    right: '5px',
                    bottom: '5px',
                    background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)',
                  }}
                  aria-hidden
                />


                {/* INNER GLOW */}
                <div
                  className="absolute clip-hexagon pointer-events-none"
                  style={{
                    top: '5px',
                    left: '5px',
                    right: '5px',
                    bottom: '5px',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.25)',
                  }}
                  aria-hidden
                />

                {/* Content - Avatar */}
                <div className="absolute inset-0 clip-hexagon flex items-center justify-center z-10 overflow-hidden">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.username}
                      className="w-full h-full object-cover clip-hexagon"
                    />
                  ) : (
                    <span className="text-lg sm:text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {getInitials(profile.username)}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Second Row: Action Buttons (Weekly Countdown moved below TOP 100 title) */}
          <div className="flex items-stretch justify-end gap-2 sm:gap-3">
            {/* Action Buttons - Match width from Rank hexagon to Avatar hexagon (always 4 hexagons) */}
            <div
              className="flex flex-col gap-2"
              style={{
                width: 'calc(4 * (3rem) + 3 * 0.375rem)' // 4 hexagons mobile: rank + coins + lives + avatar
              }}
            >
              {/* Desktop width handled via sm: and md: breakpoint */}
              <style>{`
                @media (min-width: 640px) {
                  [data-buttons-container] {
                    width: calc(4 * (4rem) + 3 * 0.5rem) !important;
                  }
                }
                @media (min-width: 768px) {
                  [data-buttons-container] {
                    width: calc(4 * (5rem) + 3 * 0.5rem) !important;
                  }
                }
              `}</style>
              {/* Share and Leaderboard buttons moved to BottomNav */}
            </div>
          </div>
        </div>

        {/* Fixed bottom section - CORRECT ORDER from bottom to top: BottomNav -> Top 100 -> Boosters -> Play Now -> Logo */}
        <div className="fixed bottom-0 left-0 right-0 z-[9000] flex flex-col-reverse items-center pb-[calc(var(--bottom-nav-h)+1rem)]">
          {/* Top 100 Leaderboard Carousel - legalsó (közvetlenül BottomNav felett) */}
          <div className="w-full" style={{ marginBottom: '2vh' }}>
            <LeaderboardCarousel />
          </div>

          {/* Booster Button - Top 100 felett */}
          <div className="flex justify-center w-full px-3" style={{ marginBottom: '2vh' }}>
            <div className="w-full max-w-screen-lg">
              <DiamondButton
                variant="booster"
                size="lg"
                disabled={true}
                className="!py-[clamp(1rem,4vw,1.75rem)] sm:!py-[clamp(1.25rem,5vw,2rem)]"
                style={{
                  width: '100%',
                }}
              >
                {/* Zap/Lightning Bolt SVG Icon */}
                <svg className="inline w-[clamp(1rem,3vw,1.5rem)] h-[clamp(1rem,3vw,1.5rem)] sm:w-[clamp(1.25rem,3.5vw,2rem)] sm:h-[clamp(1.25rem,3.5vw,2rem)] mr-2 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span 
                  className="font-black text-[clamp(0.875rem,3.5vw,1.25rem)] sm:text-[clamp(1rem,4vw,1.5rem)] md:text-[clamp(1.25rem,4.5vw,1.75rem)]" 
                  style={{ 
                    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 4px rgba(0,0,0,0.8)'
                  }}
                >
                  BOOSTERS
                </span>
              </DiamondButton>
            </div>
          </div>

          {/* Play Now Button - Boosters felett */}
          <div className="flex justify-center w-full px-3" style={{ marginBottom: '2vh' }}>
            <div className="w-full max-w-screen-lg">
              <DiamondButton
                data-tutorial="play-button"
                onClick={() => navigate('/game')}
                variant="play"
                size="lg"
                className="!py-[clamp(1.25rem,5vw,2rem)] sm:!py-[clamp(1.5rem,6vw,2.5rem)]"
                style={{
                  width: '100%',
                  transform: 'scale(1)',
                }}
              >
                <svg className="inline w-[clamp(1rem,3vw,1.5rem)] h-[clamp(1rem,3vw,1.5rem)] sm:w-[clamp(1.25rem,3.5vw,2rem)] sm:h-[clamp(1.25rem,3.5vw,2rem)] mr-2 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5.14v14l11-7-11-7z"/>
                </svg>
                <span 
                  className="font-black text-[clamp(1rem,4vw,1.5rem)] sm:text-[clamp(1.25rem,4.5vw,2rem)] md:text-[clamp(1.5rem,5vw,2.5rem)]" 
                  style={{ 
                    textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 4px rgba(0,0,0,0.8)'
                  }}
                >
                  PLAY NOW
                </span>
              </DiamondButton>
            </div>
          </div>

          {/* Logo - legfelső, Play Now felett */}
          <div className="flex justify-center w-full" style={{ marginBottom: '2vh', pointerEvents: 'none' }}>
            <div className="relative w-[clamp(146px,45.36vw,308px)] h-[clamp(146px,45.36vw,308px)]">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 via-red-500/20 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="400"
                height="400"
                viewBox="0 0 1024 1024"
                className="relative w-full h-full object-contain drop-shadow-2xl gold-glow"
              >
                <image
                  href="/logo.png"
                  x="0"
                  y="0"
                  width="1024"
                  height="1024"
                  preserveAspectRatio="xMidYMid meet"
                />
              </svg>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes play-pulse {
            0%, 100% { 
              transform: scale(1);
              filter: brightness(1) drop-shadow(0 0 8px rgba(34,197,94,0.4));
            }
            50% { 
              transform: scale(1.02);
              filter: brightness(1.1) drop-shadow(0 0 16px rgba(34,197,94,0.7));
            }
          }
        `}</style>

          {/* Life Regeneration Timer - removed from here, now at hexagon */}

          {/* Ranglista Button (moved above) removed here */}
      </div>

      {/* Welcome bonus dialog - FIRST */}
        <WelcomeBonusDialog
          open={showWelcomeBonus}
          onClaim={handleClaimWelcomeBonus}
          onLater={() => {
            handleWelcomeLater();
            setShowWelcomeBonus(false);
          }}
          claiming={claimingWelcome}
        />

      {/* Daily gift dialog - SECOND - manual trigger */}
      <DailyGiftDialog
        open={showPopup}
        onClaim={handleClaimDailyGift}
        onLater={handleCloseDailyGift}
        weeklyEntryCount={weeklyEntryCount}
        nextReward={nextReward}
        canClaim={canClaim}
        claiming={claiming}
      />

      <div data-tutorial="bottom-nav">
        <BottomNav />
      </div>
      <TutorialManager route="dashboard" />
    </div>
  );
};

export default Dashboard;
