import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Heart, Coins, Trophy, Calendar, Zap } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const Profile = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading, updateProfile } = useGameProfile(userId);
  const { boosters, getBoosterCounts } = useUserBoosters(userId);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] pb-24 overflow-x-hidden overflow-y-auto">
      <div className="max-w-md mx-auto p-4">
        {/* Header - Egységes vissza gomb */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
            title="Vissza"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div 
              className="w-32 h-32 aspect-square clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-4 border-purple-400 shadow-xl shadow-purple-500/50"
            >
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-full h-full object-cover clip-hexagon"
                />
              ) : (
                <span className="text-5xl font-black text-white">
                  {getInitials(profile.username)}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 p-3 rounded-full border-2 border-purple-400 shadow-lg transition-all"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <h1 className="text-3xl font-black text-white mb-1">{profile.username}</h1>
          <p className="text-purple-300">{profile.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Lives */}
          <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border-2 border-red-500/50 rounded-2xl p-4 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-white/70 mb-1">Életek</p>
            <p className="text-2xl font-black text-white">{profile.lives}/{profile.max_lives}</p>
          </div>

          {/* Coins */}
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border-2 border-yellow-500/50 rounded-2xl p-4 text-center">
            <Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-white/70 mb-1">Aranyérmék</p>
            <p className="text-2xl font-black text-white">{profile.coins}</p>
          </div>

          {/* Total Correct Answers */}
          <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border-2 border-green-500/50 rounded-2xl p-4 text-center">
            <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-white/70 mb-1">Helyes válaszok</p>
            <p className="text-2xl font-black text-white">{profile.total_correct_answers || 0}</p>
          </div>

          {/* Daily Streak */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border-2 border-blue-500/50 rounded-2xl p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-white/70 mb-1">Napi sorozat</p>
            <p className="text-2xl font-black text-white">{profile.daily_gift_streak} nap</p>
          </div>
        </div>

        {/* Invitation Code - Full width */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-2 border-purple-500/50 rounded-2xl p-4 text-center mb-6">
          <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-sm text-white/70 mb-1">Meghívó kód</p>
          <p className="text-2xl font-black text-white">{profile.invitation_code}</p>
        </div>

        {/* Booster Inventory */}
        <div className="bg-black/60 border-2 border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm mb-6">
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Booster készletem
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-sm text-yellow-300 mb-1">DoubleSpeed</p>
              <p className="text-2xl font-black text-yellow-500">{boosterCounts.DoubleSpeed || 0}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-sm text-yellow-300 mb-1">MegaSpeed</p>
              <p className="text-2xl font-black text-yellow-500">{boosterCounts.MegaSpeed || 0}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-sm text-yellow-300 mb-1">GigaSpeed</p>
              <p className="text-2xl font-black text-yellow-500">{boosterCounts.GigaSpeed || 0}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <p className="text-sm text-yellow-300 mb-1">DingleSpeed</p>
              <p className="text-2xl font-black text-yellow-500">{boosterCounts.DingleSpeed || 0}</p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-black/60 border-2 border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-500" />
            Fiók információk
          </h2>
          
          <div className="space-y-4">
            <div className="border-b border-purple-500/20 pb-3">
              <p className="text-sm text-white/50 mb-1">Felhasználónév</p>
              <p className="text-white font-bold">{profile.username}</p>
            </div>
            
            <div className="border-b border-purple-500/20 pb-3">
              <p className="text-sm text-white/50 mb-1">E-mail cím</p>
              <p className="text-white font-bold">{profile.email}</p>
            </div>
            
            <div className="border-b border-purple-500/20 pb-3">
              <p className="text-sm text-white/50 mb-1">Élet regeneráció</p>
              <p className="text-white font-bold">
                {profile.lives_regeneration_rate} perc / 1 élet
                {profile.speed_booster_active && (
                  <span className="ml-2 text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded">
                    Booster aktív (×{profile.speed_booster_multiplier})
                  </span>
                )}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-white/50 mb-1">Regisztráció dátuma</p>
              <p className="text-white font-bold">
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
