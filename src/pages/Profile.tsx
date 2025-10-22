import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Camera, Heart, Coins, Trophy, Calendar, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import BottomNav from '@/components/BottomNav';

const Profile = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading, updateProfile } = useGameProfile(userId);
  const { boosters, getBoosterCounts } = useUserBoosters(userId);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto logout on inactivity
  useAutoLogout();

  const boosterCounts = getBoosterCounts();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: data.publicUrl });
      toast.success('Profilkép sikeresen feltöltve!');
    } catch (error: any) {
      toast.error('Hiba a feltöltés során: ' + error.message);
    } finally {
      setUploading(false);
    }
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

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] fixed inset-0 overflow-y-auto" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Casino lights at top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse z-50"></div>
      
      <div className="w-full flex flex-col px-3 py-4 pb-24 max-w-screen-sm mx-auto relative z-10">
        {/* Header - Back button and Avatar in same line - HIGHER UP */}
        <div className="flex items-center justify-between mb-2 sm:mb-4 pt-safe">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 sm:p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50 neon-border"
            title="Vissza"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6 -scale-x-100" />
          </button>

          {/* Avatar on the same line as back button */}
          <div className="relative">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 aspect-square clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-2 sm:border-4 border-yellow-400 shadow-xl shadow-yellow-500/50 gold-glow"
            >
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-full h-full object-cover clip-hexagon"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                  {getInitials(profile.username)}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-yellow-600 hover:bg-yellow-700 p-1.5 sm:p-2 rounded-full border-2 border-yellow-400 shadow-lg transition-all gold-glow"
            >
              <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-yellow-400 mb-1">{profile.username}</h1>
          <p className="text-sm sm:text-base text-yellow-200/90">{profile.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Lives */}
          <div className="bg-gradient-to-br from-red-600/30 to-red-900/30 border-2 border-red-500/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-[0_0_15px_rgba(239,68,68,0.4)] casino-card">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-2 drop-shadow-lg" />
            <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Életek</p>
            <p className="text-xl sm:text-2xl font-black text-white drop-shadow-lg">{profile.lives}/{profile.max_lives}</p>
          </div>

          {/* Coins */}
          <div className="bg-gradient-to-br from-yellow-600/30 to-yellow-900/30 border-2 border-yellow-500/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-[0_0_15px_rgba(234,179,8,0.5)] casino-card gold-glow">
            <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-2 drop-shadow-lg" />
            <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Aranyérmék</p>
            <p className="text-xl sm:text-2xl font-black text-white drop-shadow-lg">{profile.coins}</p>
          </div>

          {/* Total Correct Answers */}
          <div className="bg-gradient-to-br from-green-600/30 to-green-900/30 border-2 border-green-500/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-[0_0_15px_rgba(34,197,94,0.4)] casino-card">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2 drop-shadow-lg" />
            <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Helyes válaszok</p>
            <p className="text-xl sm:text-2xl font-black text-white drop-shadow-lg">{profile.total_correct_answers || 0}</p>
          </div>

          {/* Daily Streak */}
          <div className="bg-gradient-to-br from-blue-600/30 to-blue-900/30 border-2 border-blue-500/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-[0_0_15px_rgba(59,130,246,0.4)] casino-card">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2 drop-shadow-lg" />
            <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Napi sorozat</p>
            <p className="text-xl sm:text-2xl font-black text-white drop-shadow-lg">{profile.daily_gift_streak} nap</p>
          </div>
        </div>

        {/* Invitation Code - Full width */}
        <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/30 border-2 border-purple-500/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center mb-4 sm:mb-6 shadow-[0_0_15px_rgba(168,85,247,0.4)] casino-card">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2 drop-shadow-lg" />
          <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Meghívó kód</p>
          <p className="text-xl sm:text-2xl font-black text-white drop-shadow-lg">{profile.invitation_code}</p>
        </div>

        {/* Booster Inventory */}
        <div className="bg-black/80 border-2 border-yellow-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm mb-4 sm:mb-6 shadow-[0_0_20px_rgba(234,179,8,0.3)] casino-card">
          <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 mb-3 sm:mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-lg" />
            Booster készletem
          </h2>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center casino-card">
              <p className="text-xs sm:text-sm text-yellow-300 mb-1 font-semibold">DoubleSpeed</p>
              <p className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-lg">{boosterCounts.DoubleSpeed || 0}</p>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center casino-card">
              <p className="text-xs sm:text-sm text-yellow-300 mb-1 font-semibold">MegaSpeed</p>
              <p className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-lg">{boosterCounts.MegaSpeed || 0}</p>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center casino-card">
              <p className="text-xs sm:text-sm text-yellow-300 mb-1 font-semibold">GigaSpeed</p>
              <p className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-lg">{boosterCounts.GigaSpeed || 0}</p>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center casino-card">
              <p className="text-xs sm:text-sm text-yellow-300 mb-1 font-semibold">DingleSpeed</p>
              <p className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-lg">{boosterCounts.DingleSpeed || 0}</p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-black/60 border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            Fiók információk
          </h2>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
              <p className="text-xs sm:text-sm text-white/50 mb-1">Felhasználónév</p>
              <p className="text-sm sm:text-base text-white font-bold">{profile.username}</p>
            </div>
            
            <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
              <p className="text-xs sm:text-sm text-white/50 mb-1">E-mail cím</p>
              <p className="text-sm sm:text-base text-white font-bold break-all">{profile.email}</p>
            </div>
            
            <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
              <p className="text-xs sm:text-sm text-white/50 mb-1">Élet regeneráció</p>
              <p className="text-sm sm:text-base text-white font-bold">
                {profile.lives_regeneration_rate} perc / 1 élet
                {profile.speed_booster_active && (
                  <span className="ml-2 text-[10px] sm:text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded">
                    Booster aktív (×{profile.speed_booster_multiplier})
                  </span>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-xs sm:text-sm text-white/50 mb-1">Regisztráció dátuma</p>
              <p className="text-sm sm:text-base text-white font-bold">
                {new Date(profile.created_at).toLocaleDateString('hu-HU')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
