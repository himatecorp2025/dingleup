import { useEffect, useState } from 'react';
import { DiamondHexagon } from '@/components/DiamondHexagon';
import { DiamondButton } from '@/components/DiamondButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useDailyGift } from '@/hooks/useDailyGift';
import { useWelcomeBonus } from '@/hooks/useWelcomeBonus';
import { useScrollBehavior } from '@/hooks/useScrollBehavior';
import { useI18n } from '@/i18n';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { useWallet } from '@/hooks/useWallet';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useDailyWinnersPopup } from '@/hooks/useDailyWinnersPopup';
import { useBoosterState } from '@/hooks/useBoosterState';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

import DailyGiftDialog from '@/components/DailyGiftDialog';
import { WelcomeBonusDialog } from '@/components/WelcomeBonusDialog';
import { DailyWinnersDialog } from '@/components/DailyWinnersDialog';
import { PremiumBoosterConfirmDialog } from '@/components/PremiumBoosterConfirmDialog';
import { LeaderboardCarousel } from '@/components/LeaderboardCarousel';
import { DailyRankingsCountdown } from '@/components/DailyRankingsCountdown';
import { NextLifeTimer } from '@/components/NextLifeTimer';
import { FallingCoins } from '@/components/FallingCoins';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { IdleWarning } from '@/components/IdleWarning';

import { DailyWinnerPopup } from '@/components/DailyWinnerPopup';

import BottomNav from '@/components/BottomNav';
import gameBackground from '@/assets/game-background.png';
import { toast } from 'sonner';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | undefined>();
  const { t } = useI18n();
  const { isHandheld, isStandalone } = usePlatformDetection();
  const { canMountModals } = useScrollBehavior();
  const { markActive } = useActivityTracker('route_view');
  const { profile, loading, regenerateLives, refreshProfile } = useGameProfile(userId);
  const { walletData, serverDriftMs, refetchWallet } = useWallet(userId);
  
  // Auto logout on inactivity with warning
  const { showWarning, remainingSeconds, handleStayActive } = useAutoLogout();
  const { canClaim, showPopup, weeklyEntryCount, nextReward, claiming, claimDailyGift, checkDailyGift, handleLater, showDailyGiftPopup, setShowPopup } = useDailyGift(userId, false);
  const { canClaim: canClaimWelcome, claiming: claimingWelcome, claimWelcomeBonus, handleLater: handleWelcomeLater } = useWelcomeBonus(userId);
  const { showPopup: showDailyWinnersPopup, triggerPopup: triggerDailyWinnersPopup, closePopup: closeDailyWinnersPopup, canShowToday: canShowDailyPopup } = useDailyWinnersPopup(userId);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const boosterState = useBoosterState(userId);
  const [showPremiumConfirm, setShowPremiumConfirm] = useState(false);
  const [dailyGiftJustClaimed, setDailyGiftJustClaimed] = useState(false);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  
  // Pull-to-refresh functionality
  const { isPulling, pullProgress } = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([
        refreshProfile(),
        refetchWallet()
      ]);
    },
    threshold: 80,
    disabled: !isHandheld
  });
  
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

  // Check for canceled payment - separate useEffect for searchParams
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast.error('Visszaléptél, a jutalmad elveszett!', {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: 'bold',
          border: '2px solid #ff0000',
          boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
        },
      });
      // Remove the query parameter
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Show Welcome Bonus dialog FIRST (highest priority) - instant, 0 seconds delay
  useEffect(() => {
    if (canMountModals && canClaimWelcome && userId) {
      setShowWelcomeBonus(true);
      setShowPopup(false);
    }
  }, [canMountModals, canClaimWelcome, userId]);

  // Show Daily Gift dialog SECOND (after welcome bonus) - AUTOMATIC, no auto-claim
  useEffect(() => {
    if (canMountModals && canClaim && !showWelcomeBonus && userId) {
      setShowPopup(true);
    }
  }, [canMountModals, canClaim, showWelcomeBonus, userId]);

  // Show Daily Winners popup THIRD (after Daily Gift is handled)
  useEffect(() => {
    if (canMountModals && canShowDailyPopup && !showWelcomeBonus && !showPopup && userId && dailyGiftJustClaimed) {
      triggerDailyWinnersPopup();
    }
  }, [canMountModals, canShowDailyPopup, showWelcomeBonus, showPopup, userId, dailyGiftJustClaimed, triggerDailyWinnersPopup]);



  // Realtime country-specific rank updates via edge function (instant, 0 seconds delay)
  useEffect(() => {
    if (!userId) return;

    const fetchUserDailyRank = async () => {
      try {
        // Call edge function to get country-specific leaderboard and user rank
        const { data, error } = await supabase.functions.invoke('get-daily-leaderboard-by-country');
        
        if (error) {
          console.error('[Dashboard] Error fetching user rank:', error);
          setCurrentRank(1); // Fallback to rank 1
          return;
        }
        
        if (data?.userRank) {
          setCurrentRank(data.userRank);
        } else {
          // User not found in leaderboard
          setCurrentRank(1);
        }
      } catch (err) {
        console.error('[Dashboard] Exception fetching user rank:', err);
        setCurrentRank(null);
      }
    };
    
    // Fetch immediately on mount
    fetchUserDailyRank();
    
    // Subscribe to realtime changes in daily_rankings (instant refetch, 0 seconds delay)
    const leaderboardChannel = supabase
      .channel('daily-leaderboard-rank-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_rankings'
        },
        () => {
          fetchUserDailyRank();
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
      triggerDailyWinnersPopup();
      setTimeout(() => setDailyGiftJustClaimed(false), 2000);
    }
    return success;
  };

  const handleCloseDailyGift = () => {
    handleLater();
    setShowPopup(false);
    setDailyGiftJustClaimed(true);
    // Trigger daily winners popup 3 seconds after dismissing
    triggerDailyWinnersPopup();
  };

  const handleClaimWelcomeBonus = async () => {
    const success = await claimWelcomeBonus();
    if (success) {
      setShowWelcomeBonus(false);
      // Reload profile and wallet to show updated coins and lives
      await refreshProfile();
      await refetchWallet();
      // Check if Daily Gift should appear after Welcome Bonus (instant, 0 seconds delay)
      await checkDailyGift();
    }
    return success;
  };

  const handleSpeedBoost = async () => {
    if (!userId) {
      toast.error('Kérlek jelentkezz be a vásárláshoz');
      return;
    }

    // If user has pending premium, activate it
    if (boosterState.hasPendingPremium) {
      await handleActivatePremiumSpeed();
      return;
    }

    // Otherwise, purchase premium booster
    if (!boosterState.instantPremiumEnabled) {
      // Show confirmation dialog for first-time purchase
      setShowPremiumConfirm(true);
      return;
    }

    // Instant purchase enabled - direct purchase
    await purchasePremiumBooster(true);
  };

  const handleActivatePremiumSpeed = async () => {
    try {
      toast.loading('Premium Speed aktiválása...', { id: 'activate-premium-speed' });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nem vagy bejelentkezve', { id: 'activate-premium-speed' });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('activate-premium-speed', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`A Premium Speed Booster aktiválva! ${data.activatedSpeed?.speedCount}× ${data.activatedSpeed?.speedDurationMinutes} perces Speed gyorsítás elindult.`, { id: 'activate-premium-speed' });
        await refetchWallet();
        await refreshProfile();
      } else if (data?.error === 'NO_PENDING_PREMIUM') {
        // Already activated - just inform user, no error
        toast.info('A Premium Speed már aktiválva lett.', { id: 'activate-premium-speed' });
      } else {
        throw new Error(data?.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      console.error('Premium speed activation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Hiba történt az aktiválás során';
      toast.error(errorMsg, { id: 'activate-premium-speed' });
    }
  };

  const purchasePremiumBooster = async (confirmInstant: boolean = false) => {
    try {
      toast.loading('Fizetési oldal betöltése...', { id: 'purchase-premium-booster' });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nem vagy bejelentkezve', { id: 'purchase-premium-booster' });
        return;
      }
      
      // Create Stripe Checkout session
      const { data, error } = await supabase.functions.invoke('create-premium-booster-payment', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout in new tab
        window.open(data.url, '_blank');
        toast.success('Fizetési oldal megnyitva új fülön', { id: 'purchase-premium-booster' });
      } else {
        throw new Error('Fizetési URL nem érkezett meg');
      }
    } catch (error) {
      console.error('Premium booster payment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Hiba történt a fizetési oldal betöltése során';
      toast.error(errorMsg, { id: 'purchase-premium-booster' });
    }
  };

  if (loading) {
  return (
    <div className="min-h-dvh min-h-svh flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      <p className="text-lg text-foreground">{t('common.loading')}</p>
    </div>
  );
}

if (!profile) {
  return (
    <div className="min-h-dvh min-h-svh flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      <p className="text-lg text-foreground">{t('common.loading')}</p>
    </div>
  );
}

  return (
    <div className="min-h-svh min-h-dvh w-screen overflow-x-hidden relative" style={{
      background: 'transparent'
    }}>
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center pointer-events-none"
          style={{ 
            height: `${pullProgress * 60}px`,
            opacity: pullProgress,
            paddingTop: 'env(safe-area-inset-top, 0px)'
          }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
        </div>
      )}
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
    
    {/* Daily winner popup - shows if user won yesterday */}
    <DailyWinnerPopup userId={userId} />
    
    {/* Daily Winners Dialog - tegnapi TOP 10 */}
    <DailyWinnersDialog 
      open={showDailyWinnersPopup} 
      onClose={closeDailyWinnersPopup} 
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
                {t('dashboard.welcome')}, {profile.username}!
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
                {/* Life Regeneration Timer or Speed Timer - server authoritative */}
                {walletData?.activeSpeedToken ? (
                  <NextLifeTimer
                    nextLifeAt={walletData.activeSpeedToken.expiresAt}
                    livesCurrent={walletData?.livesCurrent ?? profile.lives}
                    livesMax={walletData?.livesMax || profile.max_lives}
                    serverDriftMs={serverDriftMs}
                    onExpired={() => {
                      refetchWallet();
                      refreshProfile();
                    }}
                    isSpeedBoost={true}
                  />
                ) : (
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
                )}
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
                onClick={handleSpeedBoost}
                disabled={!profile || boosterState.loading}
                className="!py-[clamp(1rem,4vw,1.75rem)] sm:!py-[clamp(1.25rem,5vw,2rem)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(234,179,8,0.6)] active:scale-95"
                style={{
                  width: '100%',
                  background: boosterState.hasPendingPremium 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #f59e0b 100%)',
                  boxShadow: boosterState.hasPendingPremium
                    ? '0 0 30px rgba(16,185,129,0.5), inset 0 0 20px rgba(255,255,255,0.2)'
                    : '0 0 30px rgba(234,179,8,0.4), inset 0 0 20px rgba(255,255,255,0.2)',
                }}
              >
                <svg className="inline w-[clamp(1rem,3vw,1.5rem)] h-[clamp(1rem,3vw,1.5rem)] sm:w-[clamp(1.25rem,3.5vw,2rem)] sm:h-[clamp(1.25rem,3.5vw,2rem)] mr-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.9))' }}>
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="flex flex-col items-center">
                  <span 
                    className="relative font-black text-[clamp(0.85rem,2.5vw,1.15rem)] sm:text-[clamp(1rem,3vw,1.5rem)] tracking-[0.05em] sm:tracking-[0.1em]" 
                    style={{ 
                      textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 8px rgba(0,0,0,0.9), 0 0 15px rgba(234,179,8,0.8)'
                    }}
                  >
                    {boosterState.hasPendingPremium ? 'PREMIUM SPEED AKTIVÁLÁSA' : 'SPEED BOOSTER'}
                  </span>
                  {!boosterState.hasPendingPremium && (
                    <span 
                      className="block text-[clamp(0.65rem,2vw,0.85rem)] sm:text-[clamp(0.75rem,2.5vw,1rem)] font-semibold mt-0.5 opacity-90"
                      style={{ 
                        textShadow: '-0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000'
                      }}
                    >
                      2.49 USD • Premium Booster
                    </span>
                  )}
                </div>
                <svg className="inline w-[clamp(1rem,3vw,1.5rem)] h-[clamp(1rem,3vw,1.5rem)] sm:w-[clamp(1.25rem,3.5vw,2rem)] sm:h-[clamp(1.25rem,3.5vw,2rem)] ml-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.9))' }}>
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
                <svg
                  className="inline w-[clamp(1.25rem,3.5vw,2rem)] h-[clamp(1.25rem,3.5vw,2rem)] sm:w-[clamp(1.5rem,4vw,2.5rem)] sm:h-[clamp(1.5rem,4vw,2.5rem)] mr-3 drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,1))' }}
                >
                  <path
                    d="M8 5v14l11-7z"
                    fill="white"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
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
      
      <PremiumBoosterConfirmDialog
        open={showPremiumConfirm}
        onOpenChange={setShowPremiumConfirm}
        onConfirm={() => purchasePremiumBooster(true)}
      />
    </div>
  );
};

export default Dashboard;
