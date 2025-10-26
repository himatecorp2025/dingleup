import { useEffect, useState } from 'react';
import { DiamondHexagon } from '@/components/DiamondHexagon';
import { DiamondButton } from '@/components/DiamondButton';
import { HexagonActionButton } from '@/components/HexagonActionButton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useDailyGift } from '@/hooks/useDailyGift';
import { useWelcomeBonus } from '@/hooks/useWelcomeBonus';
import { useWeeklyWinners } from '@/hooks/useWeeklyWinners';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { useBoosterTimer } from '@/hooks/useBoosterTimer';
import { useGeniusPromo } from '@/hooks/useGeniusPromo';
import { usePromoScheduler } from '@/hooks/usePromoScheduler';
import { useScrollBehavior } from '@/hooks/useScrollBehavior';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { useWallet } from '@/hooks/useWallet';
import { useRealtimeWallet } from '@/hooks/useRealtimeWallet';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useWeeklyWinnersPopup } from '@/hooks/useWeeklyWinnersPopup';

import DailyGiftDialog from '@/components/DailyGiftDialog';
import { WelcomeBonusDialog } from '@/components/WelcomeBonusDialog';
import { WeeklyWinnersDialog } from '@/components/WeeklyWinnersDialog';
import { GeniusPromoDialog } from '@/components/GeniusPromoDialog';
import { LeaderboardCarousel } from '@/components/LeaderboardCarousel';
import { BoosterActivationDialog } from '@/components/BoosterActivationDialog';
import { WeeklyRankingsCountdown } from '@/components/WeeklyRankingsCountdown';
import { NextLifeTimer } from '@/components/NextLifeTimer';
import { FallingCoins } from '@/components/FallingCoins';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { GeniusCrownBadge } from '@/components/GeniusCrownBadge';
import { IdleWarning } from '@/components/IdleWarning';

import { WeeklyWinnerPopup } from '@/components/WeeklyWinnerPopup';
import { useWeeklyLogin } from '@/hooks/useWeeklyLogin';

import BottomNav from '@/components/BottomNav';
import logoImage from '@/assets/logo.png';
import gameBackground from '@/assets/game-background.jpg';
import { toast } from 'sonner';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const isHandheld = usePlatformDetection();
  const { canMountModals } = useScrollBehavior();
  const { markActive } = useActivityTracker('route_view');
  const { profile, loading, regenerateLives, refreshProfile } = useGameProfile(userId);
  const { walletData, serverDriftMs, refetchWallet } = useWallet(userId);
  
  // Realtime wallet updates for instant sync
  useRealtimeWallet({
    userId,
    onWalletUpdate: () => {
      refetchWallet();
    },
    enabled: !!userId,
  });
  const { loginState } = useWeeklyLogin(userId);
  
  // Auto logout on inactivity with warning
  const { showWarning, remainingSeconds, handleStayActive } = useAutoLogout();
  const { canClaim, weeklyEntryCount, nextReward, claimDailyGift, checkDailyGift, handleLater: handleDailyLater } = useDailyGift(userId, profile?.is_subscribed || false);
  const { canClaim: canClaimWelcome, claiming: claimingWelcome, claimWelcomeBonus, handleLater: handleWelcomeLater } = useWelcomeBonus(userId);
  const { showDialog: showWeeklyWinners, handleClose: handleWeeklyWinnersClose } = useWeeklyWinners(userId);
  const { showPopup: showWeeklyWinnersPopup, triggerPopup: triggerWeeklyWinnersPopup, closePopup: closeWeeklyWinnersPopup, canShowThisWeek: canShowWeeklyPopup } = useWeeklyWinnersPopup(userId);
  const { boosters, activateBooster, refetchBoosters } = useUserBoosters(userId);
  const [showDailyGift, setShowDailyGift] = useState(false);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [showBoosterActivation, setShowBoosterActivation] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
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
  
  // Promo scheduler with time intelligence
  const canShowPromo = usePromoScheduler(userId);
  const hasOtherDialogs = showWelcomeBonus || showDailyGift;
  const { shouldShow: shouldShowGeniusPromo, closePromo, handleSubscribe, handleLater: handlePromoLater } = useGeniusPromo(
    userId,
    profile?.is_subscribed || false,
    hasOtherDialogs,
    dailyGiftJustClaimed
  );
  
  const hasActiveBooster = profile?.speed_booster_active || false;
  const availableBoosters = boosters.filter(b => !b.activated);
  const timeRemaining = useBoosterTimer(profile?.speed_booster_expires_at || null);

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
        // Check subscription status on login
        checkSubscriptionStatus(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  // Check subscription status helper
  const checkSubscriptionStatus = async (uid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('[Dashboard] Subscription check error:', error);
        return;
      }
      console.log('[Dashboard] Subscription status updated:', data);
      // Refresh profile to get updated is_subscribed, max_lives, lives_regeneration_rate
      await refreshProfile();
      await refetchWallet();
    } catch (err) {
      console.error('[Dashboard] Exception checking subscription:', err);
    }
  };

  // Periodic subscription check (every 5 minutes)
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      checkSubscriptionStatus(userId);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [userId]);

  // Show Welcome Bonus dialog FIRST (highest priority) - TESTING MODE: show on desktop too, with 1s delay
  useEffect(() => {
    if (canMountModals && canClaimWelcome && userId) {
      const t = setTimeout(() => {
        setShowWelcomeBonus(true);
        setShowDailyGift(false);
        setShowPromo(false);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [canMountModals, canClaimWelcome, userId]);

  // Show Daily Gift dialog SECOND (after welcome bonus) - only on handheld, not during gameplay
  useEffect(() => {
    if (isHandheld && canMountModals && canClaim && !canClaimWelcome && !showWeeklyWinners && userId) {
      // Wait 3 seconds after daily gift might have appeared
      const timer = setTimeout(() => {
        setShowDailyGift(true);
        setShowPromo(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isHandheld, canMountModals, canClaim, canClaimWelcome, showWeeklyWinners, userId]);

  // Show Genius Promo THIRD (after welcome and daily, with scheduler) - only on handheld, not during gameplay
  useEffect(() => {
    if (isHandheld && canMountModals && shouldShowGeniusPromo && canShowPromo && !canClaimWelcome && !canClaim) {
      setShowPromo(true);
    }
  }, [isHandheld, canMountModals, shouldShowGeniusPromo, canShowPromo, canClaimWelcome, canClaim]);



  // Realtime rank updates - same calculation as Leaderboard page
  useEffect(() => {
    if (!userId) return;

    const fetchUserRank = async () => {
      try {
        // Query global_leaderboard table - same as Leaderboard page
        const { data, error } = await supabase
          .from('global_leaderboard')
          .select('user_id, total_correct_answers')
          .order('total_correct_answers', { ascending: false });
        
        if (error) {
          console.error('Error fetching leaderboard:', error);
          setCurrentRank(null);
          return;
        }
        
        // Find current user's rank
        const userRank = data?.findIndex(entry => entry.user_id === userId);
        if (userRank !== undefined && userRank !== -1) {
          setCurrentRank(userRank + 1); // +1 because findIndex is 0-based
        } else {
          setCurrentRank(null);
        }
      } catch (err) {
        console.error('Exception fetching user rank:', err);
        setCurrentRank(null);
      }
    };
    
    // Fetch immediately on mount
    fetchUserRank();
    
    // Subscribe to realtime changes in global_leaderboard
    const leaderboardChannel = supabase
      .channel('global-leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_leaderboard'
        },
        () => {
          // Leaderboard changed -> recalculate rank
          fetchUserRank();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(leaderboardChannel);
    };
  }, [userId]);

  const handleClaimDailyGift = async () => {
    const success = await claimDailyGift(refetchWallet);
    if (success) {
      await checkDailyGift();
      await refreshProfile();
      setShowDailyGift(false);
      setDailyGiftJustClaimed(true);
      
      // Trigger weekly winners popup 3 seconds after claiming
      triggerWeeklyWinnersPopup();
    }
  };

  const handleCloseDailyGift = () => {
    setShowDailyGift(false);
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
    }
    return success;
  };

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
      <p className="text-lg text-white">Betöltés...</p>
    </div>
  );
}

if (!profile) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
      <p className="text-lg text-white">Betöltés...</p>
    </div>
  );
}

return (
  <div className="h-screen w-screen overflow-hidden fixed inset-0" style={{
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)'
  }}>
    {/* Háttérkép - mobilra optimalizálva */}
    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${gameBackground})` }}
    />
    {/* Áttetsző kék overlay - 50% opacity */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] opacity-50" />
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
      
      {/* Casino lights at top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse z-50"></div>
      
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden px-3 py-2 max-w-screen-lg mx-auto relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 100px)' }}>
        {/* Top Section */}
        <div className="flex flex-col gap-3 mb-3">
          {/* First Row: Username and Stats */}
          <div className="flex items-center justify-between">
            {/* Left: Greeting - vertically centered with hexagons */}
            <div className="flex items-center h-12 sm:h-16 md:h-20">
              <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-yellow-400">
                Szia, {profile.username}!
              </h1>
            </div>

            {/* Right: Stats & Avatar - including Genius Crown as first hexagon */}
            <div className="flex items-center gap-1.5 sm:gap-2" data-tutorial="profile-header">
              {/* Genius Crown Hexagon - only for subscribers */}
              {profile.is_subscribed && <GeniusCrownBadge asHexagon showTooltip />}
              
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

          {/* Second Row: Weekly Countdown + Action Buttons */}
          <div className="flex items-stretch justify-between gap-2 sm:gap-3">
            {/* Left: Weekly Rankings Countdown - Casino style, same height as buttons */}
            <div className="flex-shrink-0">
              <WeeklyRankingsCountdown compact={false} />
            </div>
            
            {/* Right: Action Buttons - Match width from Rank hexagon to Avatar hexagon (always 4 hexagons) */}
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
              <div data-buttons-container className="flex flex-col gap-2 w-full">
              <HexagonActionButton
                onClick={() => navigate('/invitation')}
                variant="default"
                show3DLine={false}
              >
                {/* Share SVG Icon */}
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 inline mr-1 drop-shadow-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold">SHARE</span>
              </HexagonActionButton>
              
              <HexagonActionButton
                onClick={() => navigate('/leaderboard')}
                variant="default"
                show3DLine={false}
              >
                {/* Trophy SVG Icon */}
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 inline mr-1 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9H4.5C3.67157 9 3 8.32843 3 7.5V5C3 4.44772 3.44772 4 4 4H6" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M18 9H19.5C20.3284 9 21 8.32843 21 7.5V5C21 4.44772 20.5523 4 20 4H18" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M8 4H16V10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10V4Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 14V17M8 20H16M10 17H14V20H10V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold">RANGLISTA</span>
              </HexagonActionButton>
            </div>
            </div>
          </div>
        </div>

        {/* Logo - 10%-kal megnövelt méret, vertikálisan 65%-al feljebb */}
        <div className="flex-1 flex items-center justify-center mb-1 sm:mb-2">
          <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-72 md:h-72 lg:w-80 lg:h-80 transform -translate-y-[65%]">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 via-red-500/20 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <img src={logoImage} alt="Logo" className="relative w-full h-full object-contain drop-shadow-2xl gold-glow" />
          </div>
        </div>

        {/* Play Button - Hexagon Shape with 3D Line - fixált pozíció a booster gomb felett, 2.5vh távolságra */}
        <div className="fixed left-0 right-0 z-[9002] flex justify-center px-3" style={{ bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 2.5vh + 6.5rem + 2.5vh + 3.5rem + 2.5vh)' }}>
          <div className="w-full max-w-screen-lg">
            <HexagonActionButton
              data-tutorial="play-button"
              onClick={() => navigate('/game')}
              variant="play"
              show3DLine={true}
              style={{
                animation: 'play-pulse 0.8s ease-in-out infinite'
              }}
            >
              {/* Play SVG Icon */}
              <svg className="inline w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5.14v14l11-7-11-7z"/>
              </svg>
              <span 
                className="font-black text-base sm:text-xl md:text-2xl lg:text-3xl" 
                style={{ 
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 4px rgba(0,0,0,0.8)'
                }}
              >
                PLAY NOW
              </span>
            </HexagonActionButton>
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

        {/* Booster Button - Hexagon Shape with 3D Line - Fixált a TOP 100 cím felett, 2.5vh távolságra */}
        <div className="fixed left-0 right-0 z-[9001] flex justify-center px-3" style={{ bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 2.5vh + 6.5rem + 2.5vh)' }}>
          <div className="w-full max-w-screen-lg">
            <HexagonActionButton
              data-tutorial="booster-button"
              onClick={async () => {
                if (hasActiveBooster) {
                  setShowBoosterActivation(true);
                  return;
                }
                if (availableBoosters.length === 0) {
                  toast.error('Nincs elérhető booster! Vásárolj egyet a boltban.');
                  navigate('/shop');
                  return;
                }
                const firstBooster = availableBoosters[0];
                const success = await activateBooster(firstBooster.id);
                if (success) {
                  window.location.reload();
                }
              }}
              variant="booster"
              show3DLine={true}
              active={hasActiveBooster}
              badge={
                hasActiveBooster ? (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                ) : undefined
              }
            >
              {/* Lightning SVG Icon */}
              <svg className="inline w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
              </svg>
              {hasActiveBooster ? (
                <span className="text-base sm:text-xl md:text-2xl font-black">AKTÍV BOOSTER ({timeRemaining})</span>
              ) : availableBoosters.length > 0 ? (
                <span className="text-base sm:text-xl md:text-2xl font-black">
                  BOOSTER AKTIVÁLÁS
                  <span className="block text-xs sm:text-sm md:text-base mt-0.5 font-bold">Következő: {availableBoosters[0].booster_type}</span>
                </span>
              ) : (
                <span className="font-black text-base sm:text-xl md:text-2xl">BOOSTERS</span>
              )}
            </HexagonActionButton>
          </div>
        </div>

        {/* Leaderboard Carousel - Top 100 players - Fixált az alsó menüsáv fölé 2.5vh távolsággal */}
        <div className="fixed left-0 right-0 z-[9000]" style={{ bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 2.5vh)' }}>
          <LeaderboardCarousel />
        </div>

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

      {/* Daily gift dialog - SECOND */}
      <DailyGiftDialog
        open={showDailyGift && !showWelcomeBonus}
        onClaim={handleClaimDailyGift}
        onClaimSuccess={() => {
          setDailyGiftJustClaimed(true);
          setTimeout(() => setDailyGiftJustClaimed(false), 2000);
        }}
        onLater={handleCloseDailyGift}
        weeklyEntryCount={weeklyEntryCount}
        nextReward={nextReward}
        canClaim={canClaim}
        isPremium={profile?.is_subscribed || false}
      />

      {/* Genius Promo dialog - THIRD */}
      <GeniusPromoDialog
        open={showPromo && !showWelcomeBonus && !showDailyGift}
        onClose={() => {
          closePromo();
          setShowPromo(false);
        }}
        onSubscribe={handleSubscribe}
        onLater={handlePromoLater}
      />

      {/* Booster activation dialog */}
      <BoosterActivationDialog
        open={showBoosterActivation}
        onClose={() => {
          setShowBoosterActivation(false);
          refetchBoosters();
        }}
        availableBoosters={availableBoosters}
        hasActiveBooster={hasActiveBooster}
        onActivate={async (boosterId) => {
          const success = await activateBooster(boosterId);
          if (success) {
            setShowBoosterActivation(false);
            window.location.reload();
          }
        }}
      />

      <div data-tutorial="bottom-nav">
        <BottomNav />
      </div>
      <TutorialManager route="dashboard" />
    </div>
  );
};

export default Dashboard;
