import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useDailyGift } from '@/hooks/useDailyGift';
import { useWelcomeBonus } from '@/hooks/useWelcomeBonus';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { useBoosterTimer } from '@/hooks/useBoosterTimer';
import { Trophy, Coins, Heart, Crown, Play, ShoppingBag, Share2, LogOut, Zap } from 'lucide-react';
import DailyGiftDialog from '@/components/DailyGiftDialog';
import { WelcomeBonusDialog } from '@/components/WelcomeBonusDialog';
import { LeaderboardCarousel } from '@/components/LeaderboardCarousel';
import { BoosterActivationDialog } from '@/components/BoosterActivationDialog';
import logoImage from '@/assets/logo.png';
import backmusic from '@/assets/backmusic.mp3';

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
  const [currentRank, setCurrentRank] = useState<number>(1);
  
  const hasActiveBooster = profile?.speed_booster_active || false;
  const availableBoosters = boosters.filter(b => !b.activated);
  const timeRemaining = useBoosterTimer(profile?.speed_booster_expires_at || null);

  // Helper function
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
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
      const { data } = await supabase
        .from('weekly_rankings')
        .select('rank')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single();
      
      if (data?.rank) setCurrentRank(data.rank);
    };
    
    fetchUserRank();
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
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] p-4 flex justify-center overflow-hidden fixed inset-0">
      <div className="w-full max-w-md mx-auto flex flex-col overflow-y-auto overflow-x-hidden">
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
                <span className="text-white text-xs font-bold">{currentRank}</span>
              </div>

              {/* Coins Hexagon */}
              <div className="w-16 h-16 aspect-square clip-hexagon bg-gradient-to-br from-yellow-600 to-yellow-900 flex flex-col items-center justify-center border-2 border-yellow-400">
                <Coins className="w-4 h-4 text-white mb-0.5" />
                <span className="text-white text-xs font-bold">{profile.coins}</span>
              </div>

              {/* Lives Hexagon */}
              <div className="w-16 h-16 aspect-square clip-hexagon bg-gradient-to-br from-red-600 to-red-900 flex flex-col items-center justify-center border-2 border-red-400">
                <Heart className="w-4 h-4 text-white mb-0.5" />
                <span className="text-white text-xs font-bold">{profile.lives}</span>
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
            <div className="flex flex-col gap-2 w-48">
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
          onClick={() => setShowBoosterActivation(true)}
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

      {/* Logout button - bottom right corner */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
        className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 z-50 border-2 border-red-400/50"
        title="Kijelentkezés"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard;
