import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useDailyGift } from '@/hooks/useDailyGift';
import { useWelcomeBonus } from '@/hooks/useWelcomeBonus';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { useBoosterTimer } from '@/hooks/useBoosterTimer';
import { useLifeRegenerationTimer } from '@/hooks/useLifeRegenerationTimer';
import { Trophy, Coins, Heart, Crown, Play, ShoppingBag, Share2, LogOut, Zap, Clock } from 'lucide-react';
import DailyGiftDialog from '@/components/DailyGiftDialog';
import { WelcomeBonusDialog } from '@/components/WelcomeBonusDialog';
import { LeaderboardCarousel } from '@/components/LeaderboardCarousel';
import { BoosterActivationDialog } from '@/components/BoosterActivationDialog';
import BottomNav from '@/components/BottomNav';
import logoImage from '@/assets/logo.png';
import backmusic from '@/assets/backmusic.mp3';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading } = useGameProfile(userId);
  const { canClaim, currentStreak, nextReward, claimDailyGift, checkDailyGift } = useDailyGift(userId);
  const { canClaim: canClaimWelcome, claiming: claimingWelcome, claimWelcomeBonus } = useWelcomeBonus(userId);
  const { boosters, activateBooster, refetchBoosters } = useUserBoosters(userId);
  const [showDailyGift, setShowDailyGift] = useState(false);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  
  const [showBoosterActivation, setShowBoosterActivation] = useState(false);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  
  const hasActiveBooster = profile?.speed_booster_active || false;
  const availableBoosters = boosters.filter(b => !b.activated);
  const timeRemaining = useBoosterTimer(profile?.speed_booster_expires_at || null);
  
  // Calculate life regeneration rate based on booster
  const lifeRegenRate = hasActiveBooster 
    ? Math.floor(12 / (profile?.speed_booster_multiplier || 1))
    : 12;
    
  const { timeUntilNextLife } = useLifeRegenerationTimer(
    profile?.lives || 0,
    profile?.max_lives || 15,
    profile?.last_life_regeneration || null,
    lifeRegenRate
  );

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

  useEffect(() => {
    if (canClaim) {
      setShowDailyGift(true);
    }
  }, [canClaim]);

  useEffect(() => {
    if (canClaimWelcome) {
      // Welcome bonus has priority over daily gift
      setShowWelcomeBonus(true);
    }
  }, [canClaimWelcome]);

  useEffect(() => {
    const fetchUserRank = async () => {
      if (!userId) return;
      
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();
      
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
    
    // Then fetch every minute (60000ms)
    const interval = setInterval(fetchUserRank, 60000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const handleClaimDailyGift = async () => {
    await claimDailyGift();
    await checkDailyGift();
    setShowDailyGift(false);
  };

  const handleClaimWelcomeBonus = async () => {
    const success = await claimWelcomeBonus();
    if (success) {
      setShowWelcomeBonus(false);
      // Reload profile to show updated coins and question swaps
      window.location.reload();
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
        <p className="text-lg text-white">Hiba a profil betöltésekor</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0">
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden px-4 py-4 pb-24 max-w-screen-lg mx-auto">
        {/* Top Section */}
        <div className="flex items-start justify-between mb-3">
          {/* Left: Greeting */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">Szia, {profile.username}!</h1>
          </div>

          {/* Right: Stats & Avatar */}
          <div className="flex flex-col items-end gap-2">
            {/* Stats Row */}
            <div className="flex items-center gap-2">
              {/* Rank Hexagon */}
              <div className="w-16 h-16 aspect-square clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex flex-col items-center justify-center border-2 border-purple-400">
                <Trophy className="w-4 h-4 text-yellow-500 mb-0.5" />
                <span className="text-white text-xs font-bold">{currentRank || '...'}</span>
              </div>

              {/* Coins Hexagon */}
              <div className="w-16 h-16 aspect-square clip-hexagon bg-gradient-to-br from-yellow-600 to-yellow-900 flex flex-col items-center justify-center border-2 border-yellow-400">
                <Coins className="w-4 h-4 text-white mb-0.5" />
                <span className="text-white text-xs font-bold">{profile.coins}</span>
              </div>

              {/* Lives Hexagon with Timer */}
              <div className="relative">
                <div className="w-16 h-16 aspect-square clip-hexagon bg-gradient-to-br from-red-600 to-red-900 flex flex-col items-center justify-center border-2 border-red-400">
                  <Heart className="w-4 h-4 text-white mb-0.5" />
                  <span className="text-white text-xs font-bold">{profile.lives}</span>
                </div>
                {profile.lives < profile.max_lives && timeUntilNextLife !== '0:00' && (
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-2.5 h-2.5 text-green-400" />
                    <span className="text-[9px] text-green-400 font-bold">{timeUntilNextLife}</span>
                  </div>
                )}
              </div>

              {/* Avatar Hexagon */}
              <button
                onClick={() => navigate('/profile')}
                className="w-16 h-16 aspect-square clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-4 border-purple-400 shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform"
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.username}
                    className="w-full h-full object-cover clip-hexagon"
                  />
                ) : (
                  <span className="text-2xl font-black text-white">
                    {getInitials(profile.username)}
                  </span>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-52">
              <button
                onClick={() => navigate('/invitation')}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold text-sm rounded-lg border-2 border-blue-400 shadow-lg hover:from-blue-700 hover:to-blue-900 transition-all flex items-center justify-center gap-2"
                style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
              >
                <Share2 className="w-4 h-4" />
                PROFIL MEGOSZTÁSA
              </button>
              
              <button
                onClick={() => navigate('/shop')}
                className="w-full py-2 px-4 bg-gradient-to-r from-yellow-600 to-yellow-800 text-gray-100 font-bold text-sm rounded-lg border-2 border-yellow-400 shadow-lg hover:from-yellow-700 hover:to-yellow-900 transition-all flex items-center justify-center gap-2"
                style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
              >
                <ShoppingBag className="w-4 h-4" />
                BOLT
              </button>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-3">
          <div className="relative w-36 h-36">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
            <img src={logoImage} alt="Logo" className="relative w-full h-full object-contain drop-shadow-2xl" />
          </div>
        </div>

        {/* Play Button */}
        <button
          onClick={() => {
            try {
              const w = window as any;
              let a: HTMLAudioElement | undefined = w.__bgm;
              if (!a) {
                a = new Audio(backmusic);
                a.loop = true;
                a.volume = 0.1; // FIXED 10%
                w.__bgm = a;
              } else {
                a.loop = true;
                a.volume = 0.1; // FIXED 10%
              }
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              ctx.resume();
              a.play().catch(() => {});
            } catch {}
            navigate('/game');
          }}
        	  className="w-full py-2.5 px-5 mb-3 bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-black text-lg rounded-2xl border-2 border-green-400 shadow-xl shadow-green-500/40 hover:shadow-green-500/60 hover:scale-105 transition-all animate-pulse-glow-green"
        	  style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        	>
        	  <Play className="inline w-5 h-5 mr-2" />
        	  PLAY NOW
        	</button>

        {/* Booster Button */}
        <button
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
          className={`w-full py-2.5 px-5 mb-3 bg-gradient-to-r ${hasActiveBooster ? 'from-orange-500 via-orange-400 to-orange-500' : 'from-yellow-500 via-yellow-400 to-yellow-500'} ${hasActiveBooster ? 'text-white' : 'text-black'} font-black text-lg rounded-2xl border-2 ${hasActiveBooster ? 'border-orange-600 shadow-orange-500/40' : 'border-yellow-600 shadow-yellow-500/40'} shadow-xl hover:shadow-yellow-500/60 hover:scale-105 transition-all relative`}
          style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        >
          {hasActiveBooster && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          )}
          <Zap className={`inline w-5 h-5 mr-2 ${!hasActiveBooster ? 'text-black' : 'text-white'}`} />
          BOOSTER {hasActiveBooster && `(AKTÍV - ${timeRemaining})`}
        </button>

        {/* Leaderboard Carousel - Top 25 players */}
        <div className="my-3">
          <LeaderboardCarousel />
        </div>

        {/* Ranglista Button */}
        <button
          onClick={() => navigate('/leaderboard')}
          className="w-full py-2.5 px-5 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 text-white font-black text-lg rounded-2xl border-2 border-purple-600 shadow-xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 transition-all"
          style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        >
          <Trophy className="inline w-5 h-5 mr-2" />
          RANGLISTA
        </button>
      </div>

      {/* Welcome bonus dialog */}
      <WelcomeBonusDialog
        open={showWelcomeBonus}
        onClaim={handleClaimWelcomeBonus}
        claiming={claimingWelcome}
      />

      {/* Daily gift dialog */}
      <DailyGiftDialog
        open={showDailyGift && !showWelcomeBonus}
        onClose={() => setShowDailyGift(false)}
        onClaim={handleClaimDailyGift}
        currentStreak={currentStreak}
        nextReward={nextReward}
        canClaim={canClaim}
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

      <BottomNav />
    </div>
  );
};

export default Dashboard;
