import { useEffect, useState } from 'react';
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
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useWeeklyWinnersPopup } from '@/hooks/useWeeklyWinnersPopup';
import { Trophy, Coins, Heart, Crown, Play, ShoppingBag, Share2, LogOut, Zap, Clock } from 'lucide-react';
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
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const isHandheld = usePlatformDetection();
  const { canMountModals } = useScrollBehavior();
  const { markActive } = useActivityTracker('route_view');
  const { profile, loading, regenerateLives, refreshProfile } = useGameProfile(userId);
  const { walletData, serverDriftMs, refetchWallet } = useWallet(userId);
  const { loginState } = useWeeklyLogin(userId);
  
  // Auto logout on inactivity with warning
  const { showWarning, remainingSeconds, handleStayActive } = useAutoLogout();
  const { canClaim, weeklyEntryCount, nextReward, claimDailyGift, checkDailyGift, handleLater: handleDailyLater } = useDailyGift(userId, profile?.is_subscribed || false);
  const { canClaim: canClaimWelcome, claiming: claimingWelcome, claimWelcomeBonus, handleLater: handleWelcomeLater } = useWelcomeBonus(userId);
  const { showDialog: showWeeklyWinners, handleClose: handleWeeklyWinnersClose } = useWeeklyWinners(userId);
  const { showPopup: showWeeklyWinnersPopup, triggerPopup: triggerWeeklyWinnersPopup, closePopup: closeWeeklyWinnersPopup } = useWeeklyWinnersPopup(userId);
  const { boosters, activateBooster, refetchBoosters } = useUserBoosters(userId);
  const [showDailyGift, setShowDailyGift] = useState(false);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [showBoosterActivation, setShowBoosterActivation] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [dailyGiftJustClaimed, setDailyGiftJustClaimed] = useState(false);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  
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



  useEffect(() => {
    const fetchUserRank = async () => {
      if (!userId) return;
      
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();
      if (!userId) return;
      
      // Get current user's total correct answers this week
      const { data: userResults, error: userError } = await supabase
        .from('game_results')
        .select('correct_answers')
        .eq('user_id', userId)
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);
      
      if (userError) {
        console.error('Error fetching user results:', userError);
        return;
      }
      
      const userTotal = userResults?.reduce((sum, r) => sum + (r.correct_answers || 0), 0) || 0;
      
      // Get all users' totals this week and count how many are better
      const { data: allResults, error: allError } = await supabase
        .from('game_results')
        .select('user_id, correct_answers')
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd);
      
      if (allError) {
        console.error('Error fetching all results:', allError);
        return;
      }
      
      // Group by user_id and sum correct_answers
      const userTotals = new Map<string, number>();
      allResults?.forEach(r => {
        const current = userTotals.get(r.user_id) || 0;
        userTotals.set(r.user_id, current + (r.correct_answers || 0));
      });
      
      // Count how many users have more correct answers
      let betterCount = 0;
      userTotals.forEach((total, uid) => {
        if (total > userTotal && uid !== userId) {
          betterCount++;
        }
      });
      
      const rank = betterCount + 1;
      setCurrentRank(rank);
    };
    
    // Fetch immediately
    fetchUserRank();
    
    // Then fetch every 10 seconds for immediate updates
    const interval = setInterval(fetchUserRank, 10000);
    
    return () => clearInterval(interval);
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
  <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0" style={{
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)'
  }}>
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
      
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden px-4 py-4 max-w-screen-lg mx-auto relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }}>
        {/* Top Section */}
        <div className="flex flex-col gap-3 mb-3">
          {/* First Row: Username and Stats */}
          <div className="flex items-start justify-between">
            {/* Left: Greeting */}
            <div className="flex flex-col items-start">
              <h1 className="text-base sm:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-yellow-400 flex items-center gap-2">
                Szia, {profile.username}!
                {profile.is_subscribed && <GeniusCrownBadge size="sm" />}
              </h1>
            </div>

            {/* Right: Stats & Avatar */}
            <div className="flex items-center gap-1.5 sm:gap-2" data-tutorial="profile-header">
              {/* Rank Hexagon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 aspect-square clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex flex-col items-center justify-center border-2 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.5)] neon-border">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mb-0.5" />
                <span className="text-white text-[10px] sm:text-xs font-bold drop-shadow-lg">{currentRank || '...'}</span>
              </div>

              {/* Coins Hexagon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 aspect-square clip-hexagon bg-gradient-to-br from-yellow-600 to-yellow-900 flex flex-col items-center justify-center border-2 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.6)] gold-glow">
                <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-white mb-0.5 drop-shadow-lg" />
                <span className="text-white text-[10px] sm:text-xs font-bold drop-shadow-lg">{profile.coins}</span>
              </div>

              {/* Lives Hexagon with Timer */}
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 aspect-square clip-hexagon bg-gradient-to-br from-red-600 to-red-900 flex flex-col items-center justify-center border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-white mb-0.5 drop-shadow-lg" />
                  <span className="text-white text-[10px] sm:text-xs font-bold drop-shadow-lg">{profile.lives}</span>
                </div>
                {/* Life Regeneration Timer - server authoritative */}
                <NextLifeTimer
                  nextLifeAt={walletData?.nextLifeAt || null}
                  livesCurrent={profile.lives}
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
                className="w-12 h-12 sm:w-16 sm:h-16 aspect-square clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-2 sm:border-4 border-purple-400 shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform gold-glow"
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.username}
                    className="w-full h-full object-cover clip-hexagon"
                  />
                ) : (
                  <span className="text-lg sm:text-2xl font-black text-white">
                    {getInitials(profile.username)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Second Row: Weekly Countdown + Action Buttons */}
          <div className="flex items-stretch justify-between gap-2 sm:gap-3">
            {/* Left: Weekly Rankings Countdown - Casino style, same height as buttons */}
            <div className="flex-shrink-0">
              <WeeklyRankingsCountdown compact={false} />
            </div>
            
            {/* Right: Action Buttons - Vertical Stack, constrained width */}
            <div className="flex flex-col gap-2 flex-1" style={{ maxWidth: 'calc(100% - 180px)' }}>
              <button
                onClick={() => navigate('/invitation')}
                data-tutorial="daily-gift"
                className="w-full py-2 sm:py-2.5 px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold text-xs sm:text-sm rounded-lg border-2 border-blue-400 shadow-lg hover:from-blue-700 hover:to-blue-900 transition-all flex items-center justify-center gap-1 sm:gap-1.5 casino-card shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 drop-shadow-lg" />
                <span className="text-[10px] sm:text-xs">SHARE</span>
              </button>
              
              <button
                onClick={() => navigate('/shop')}
                className="w-full py-2 sm:py-2.5 px-2 sm:px-3 bg-gradient-to-r from-yellow-600 to-yellow-800 text-gray-100 font-bold text-xs sm:text-sm rounded-lg border-2 border-yellow-400 shadow-lg hover:from-yellow-700 hover:to-yellow-900 transition-all flex items-center justify-center gap-1 sm:gap-1.5 casino-card shadow-[0_0_15px_rgba(234,179,8,0.6)] gold-glow"
                style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
              >
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 drop-shadow-lg" />
                <span className="text-[10px] sm:text-xs">BOLT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-2 sm:mb-3">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 via-red-500/20 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <img src={logoImage} alt="Logo" className="relative w-full h-full object-contain drop-shadow-2xl gold-glow" />
          </div>
        </div>

        {/* Play Button */}
        <button
          data-tutorial="play-button"
          onClick={() => navigate('/game')}
        	  className="w-full py-2 sm:py-2.5 px-4 sm:px-5 mb-2 sm:mb-3 bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-black text-base sm:text-lg rounded-2xl border-2 border-green-400 shadow-xl shadow-green-500/50 hover:shadow-green-500/70 hover:scale-105 transition-all animate-pulse-glow-green casino-card"
        	  style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        	>
        	  <Play className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2 drop-shadow-lg" />
        	  PLAY NOW
        	</button>

        {/* Booster Button */}
        <button
          data-tutorial="booster-button"
          onClick={async () => {
            // Ha már van aktív booster, mutassuk meg a részleteket
            if (hasActiveBooster) {
              setShowBoosterActivation(true);
              return;
            }
            
            // Ha nincs elérhető booster, irányítsuk a boltba
            if (availableBoosters.length === 0) {
              toast.error('Nincs elérhető booster! Vásárolj egyet a boltban.');
              navigate('/shop');
              return;
            }
            
            // Egyből aktiváljuk az első elérhető boostert
            const firstBooster = availableBoosters[0];
            const success = await activateBooster(firstBooster.id);
            if (success) {
              window.location.reload();
            }
          }}
          className={`w-full py-2 sm:py-2.5 px-4 sm:px-5 mb-2 sm:mb-3 bg-gradient-to-r ${hasActiveBooster ? 'from-orange-500 via-orange-400 to-orange-500' : 'from-yellow-500 via-yellow-400 to-yellow-500'} ${hasActiveBooster ? 'text-white' : 'text-black'} font-black text-base sm:text-lg rounded-2xl border-2 ${hasActiveBooster ? 'border-orange-600' : 'border-yellow-600'} shadow-xl ${hasActiveBooster ? 'shadow-orange-500/60' : 'shadow-yellow-500/60'} hover:scale-105 transition-all relative casino-card`}
          style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        >
          {hasActiveBooster && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          )}
          <Zap className={`inline w-4 h-4 sm:w-5 sm:h-5 mr-2 ${!hasActiveBooster ? 'text-black' : 'text-white'}`} />
          {hasActiveBooster ? (
            <span className="text-sm sm:text-base">AKTÍV BOOSTER ({timeRemaining})</span>
          ) : availableBoosters.length > 0 ? (
            <span className="text-sm sm:text-base">
              BOOSTER AKTIVÁLÁS
              <span className="block text-xs mt-0.5">Következő: {availableBoosters[0].booster_type}</span>
            </span>
          ) : (
            <span className="text-sm sm:text-base">BOOSTER VÁSÁRLÁS</span>
          )}
        </button>

        {/* Leaderboard Carousel - Top 25 players */}
        <div className="my-3">
          <LeaderboardCarousel />
        </div>


        {/* Ranglista Button moved higher above bottom nav */}
        <button
          onClick={() => navigate('/leaderboard')}
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 text-white font-black text-base sm:text-lg rounded-2xl border-2 border-purple-600 shadow-xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 transition-all mb-3 casino-card"
          style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        >
          <Trophy className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2 drop-shadow-lg" />
          RANGLISTA
        </button>

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
