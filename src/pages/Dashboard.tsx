import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useDailyGift } from '@/hooks/useDailyGift';
import { Trophy, Coins, Heart, Crown, Play, ShoppingBag, Share2 } from 'lucide-react';
import DailyGiftDialog from '@/components/DailyGiftDialog';
import logoImage from '@/assets/logo.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading } = useGameProfile(userId);
  const { canClaim, currentStreak, nextReward, claimDailyGift, checkDailyGift } = useDailyGift(userId);
  const [showDailyGift, setShowDailyGift] = useState(false);
  const [currentRank, setCurrentRank] = useState<number>(1);

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4">
      <div className="max-w-md mx-auto">
        {/* Top Section */}
        <div className="flex items-start justify-between mb-6">
          {/* Left: Greeting */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">Szia, {profile.username}!</h1>
          </div>

          {/* Right: Stats & Avatar */}
          <div className="flex flex-col items-end gap-2">
            {/* Stats Row */}
            <div className="flex items-center gap-2">
              {/* Rank Hexagon */}
              <div className="w-14 h-16 clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex flex-col items-center justify-center border-2 border-purple-400">
                <Trophy className="w-4 h-4 text-yellow-500 mb-0.5" />
                <span className="text-white text-xs font-bold">{currentRank}</span>
              </div>

              {/* Coins Hexagon */}
              <div className="w-14 h-16 clip-hexagon bg-gradient-to-br from-yellow-600 to-yellow-900 flex flex-col items-center justify-center border-2 border-yellow-400">
                <Coins className="w-4 h-4 text-white mb-0.5" />
                <span className="text-white text-xs font-bold">{profile.coins}</span>
              </div>

              {/* Lives Hexagon */}
              <div className="w-14 h-16 clip-hexagon bg-gradient-to-br from-red-600 to-red-900 flex flex-col items-center justify-center border-2 border-red-400">
                <Heart className="w-4 h-4 text-white mb-0.5" />
                <span className="text-white text-xs font-bold">{profile.lives}</span>
              </div>

              {/* Avatar Hexagon */}
              <button
                onClick={() => navigate('/profile')}
                className="w-16 h-18 clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-4 border-purple-400 shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform"
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
                onClick={() => navigate('/profile')}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold text-sm rounded-lg border-2 border-blue-400 shadow-lg hover:from-blue-700 hover:to-blue-900 transition-all flex items-center justify-center gap-2"
                style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
              >
                <Share2 className="w-4 h-4" />
                PROFIL MEGOSZTÁSA
              </button>
              
              <button
                onClick={() => navigate('/shop')}
                className="w-full py-2 px-4 bg-gradient-to-r from-yellow-600 to-yellow-800 text-black font-bold text-sm rounded-lg border-2 border-yellow-400 shadow-lg hover:from-yellow-700 hover:to-yellow-900 transition-all flex items-center justify-center gap-2"
                style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
              >
                <ShoppingBag className="w-4 h-4" />
                BOLT
              </button>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
            <img src={logoImage} alt="Logo" className="relative w-full h-full object-contain drop-shadow-2xl" />
          </div>
        </div>

        {/* Play Button */}
        <button
          onClick={() => navigate('/game')}
          className="w-full py-3 px-6 mb-4 bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-black text-xl rounded-2xl border-4 border-green-400 shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 hover:scale-105 transition-all animate-pulse-glow-green"
          style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        >
          <Play className="inline w-6 h-6 mr-3" />
          PLAY NOW
        </button>

        {/* Booster Button */}
        <button
          onClick={() => navigate('/shop')}
          className="w-full py-2 px-6 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-black font-black text-base rounded-2xl border-4 border-yellow-600 shadow-2xl shadow-yellow-500/50 hover:shadow-yellow-500/70 hover:scale-105 transition-all"
          style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
        >
          <div className="text-center">
            <div className="text-lg mb-0.5">BOOSTER</div>
            <div className="text-[10px] font-bold">SZEREZZ TOVÁBBI 300 MÁSODPERC ELŐNYT!</div>
            <div className="text-[9px] mt-0.5 opacity-80">Csak 349 Ft-ért!</div>
          </div>
        </button>
      </div>

      {/* Daily gift dialog */}
      <DailyGiftDialog
        open={showDailyGift}
        onClose={() => setShowDailyGift(false)}
        onClaim={handleClaimDailyGift}
        currentStreak={currentStreak}
        nextReward={nextReward}
        canClaim={canClaim}
      />
    </div>
  );
};

export default Dashboard;
