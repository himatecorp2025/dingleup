import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useUserBoosters } from '@/hooks/useUserBoosters';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Camera, Heart, Coins, Trophy, Calendar, Zap, Crown, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import BottomNav from '@/components/BottomNav';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { GeniusCrownBadge } from '@/components/GeniusCrownBadge';

const Profile = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading, updateProfile } = useGameProfile(userId);
  const { boosters, getBoosterCounts } = useUserBoosters(userId);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  
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

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
        toast.info('Átirányítás a Stripe kezelő felületre...');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error('Hiba történt az előfizetés kezelő felület megnyitásakor');
    } finally {
      setIsManagingSubscription(false);
    }
  };

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
      
      <div className="w-full flex flex-col px-3 py-4 max-w-screen-sm mx-auto relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }}>
        {/* Header - Back button and Avatar in same line - HIGHER UP */}
        <div className="flex items-center justify-between mb-2 sm:mb-4 pt-safe">
          <button
            onClick={() => navigate('/dashboard')}
            className="relative p-2.5 sm:p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50 neon-border
              shadow-[0_8px_16px_rgba(220,38,38,0.6),0_0_32px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.3)]
              before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none
              after:absolute after:inset-[2px] after:rounded-full after:bg-gradient-to-b after:from-transparent after:to-black/20 after:pointer-events-none
              hover:shadow-[0_12px_24px_rgba(220,38,38,0.7),0_0_40px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(255,255,255,0.4)]
              transform-gpu hover:-translate-y-0.5"
            title="Vissza"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6 -scale-x-100 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
          </button>

          {/* Avatar on the same line as back button */}
          <div className="relative" data-tutorial="profile-pic">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 aspect-square clip-hexagon bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center border-2 sm:border-4 border-yellow-400 gold-glow
                shadow-[0_8px_24px_rgba(234,179,8,0.6),0_0_32px_rgba(234,179,8,0.4),inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-4px_12px_rgba(0,0,0,0.3)]
                before:absolute before:inset-0 before:clip-hexagon before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none
                after:absolute after:inset-[2px] after:clip-hexagon after:bg-gradient-to-b after:from-transparent after:to-black/20 after:pointer-events-none
                relative transform-gpu"
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
              className="absolute bottom-0 right-0 bg-yellow-600 hover:bg-yellow-700 p-1.5 sm:p-2 rounded-full border-2 border-yellow-400 transition-all gold-glow
                shadow-[0_4px_12px_rgba(234,179,8,0.6),0_0_24px_rgba(234,179,8,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.3)]
                before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none
                after:absolute after:inset-[1px] after:rounded-full after:bg-gradient-to-b after:from-transparent after:to-black/20 after:pointer-events-none
                hover:shadow-[0_6px_16px_rgba(234,179,8,0.7),0_0_32px_rgba(234,179,8,0.5)]
                transform-gpu hover:scale-110"
            >
              <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow relative z-10" />
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
          <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-yellow-400 mb-1 flex items-center justify-center gap-2">
            {profile.username}
            {profile.is_subscribed && <GeniusCrownBadge size="md" />}
          </h1>
          <p className="text-sm sm:text-base text-yellow-200/90">{profile.email}</p>
        </div>

        {/* Genius Subscription Management - Only for subscribers */}
        {profile.is_subscribed && (
          <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 transform-gpu">
            {/* Base shadow (3D depth) */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
            
            {/* Outer frame */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-600/30 via-yellow-500/20 to-yellow-900/30 border-2 border-yellow-500/60
              shadow-[0_0_20px_rgba(234,179,8,0.6),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
            
            {/* Middle frame (bright highlight) */}
            <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-yellow-500/20 via-yellow-400/15 to-yellow-700/20"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }} aria-hidden />
            
            {/* Inner crystal layer */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-yellow-400/10 via-yellow-500/15 to-yellow-600/10"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
            
            {/* Specular highlight */}
            <div className="absolute rounded-xl sm:rounded-2xl pointer-events-none"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
                    Genius Előfizetés
                  </h2>
                  {profile.subscriber_type === 'comp' && (
                    <p className="text-xs text-yellow-300/80">Ingyenes teszt előfizetés</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Státusz:</span>
                  <span className="text-green-400 font-bold">✓ Aktív</span>
                </div>
                {profile.subscriber_since && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Aktiválva:</span>
                    <span className="text-white font-bold">
                      {new Date(profile.subscriber_since).toLocaleDateString('hu-HU')}
                    </span>
                  </div>
                )}
                {profile.subscriber_renew_at && profile.subscriber_type === 'paid' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">Megújul:</span>
                    <span className="text-white font-bold">
                      {new Date(profile.subscriber_renew_at).toLocaleDateString('hu-HU')}
                    </span>
                  </div>
                )}
              </div>

              {profile.subscriber_type === 'paid' && (
                <button
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-black py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50
                    shadow-[0_4px_12px_rgba(234,179,8,0.6),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_8px_rgba(0,0,0,0.2)]
                    hover:shadow-[0_6px_16px_rgba(234,179,8,0.7)] transform-gpu hover:-translate-y-0.5"
                >
                  <Settings className="w-4 h-4" />
                  {isManagingSubscription ? 'Betöltés...' : 'Előfizetés Kezelése'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6" data-tutorial="stats">
          {/* Lives */}
          <div className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu">
            {/* Base shadow (3D depth) */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
            
            {/* Outer frame */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-500/60
              shadow-[0_0_20px_rgba(239,68,68,0.6),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
            
            {/* Middle frame (bright highlight) */}
            <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-red-600 via-red-500 to-red-800"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* Inner crystal layer */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-red-500 via-red-600 to-red-700"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
            
            {/* Specular highlight */}
            <div className="absolute rounded-xl sm:rounded-2xl pointer-events-none"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-2 drop-shadow-[0_2px_8px_rgba(248,113,113,0.8)]" />
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Életek</p>
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.lives}/{profile.max_lives}</p>
            </div>
          </div>

          {/* Coins */}
          <div className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu">
            {/* Base shadow (3D depth) */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
            
            {/* Outer frame */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-800 border-2 border-yellow-500/60
              shadow-[0_0_20px_rgba(234,179,8,0.7),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
            
            {/* Middle frame (bright highlight) */}
            <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-700"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* Inner crystal layer */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
            
            {/* Specular highlight */}
            <div className="absolute rounded-xl sm:rounded-2xl pointer-events-none"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10">
              <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-2 drop-shadow-[0_2px_8px_rgba(250,204,21,0.8)]" />
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Aranyérmék</p>
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.coins}</p>
            </div>
          </div>

          {/* Total Correct Answers */}
          <div className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu">
            {/* Base shadow (3D depth) */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
            
            {/* Outer frame */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-700 via-green-600 to-green-900 border-2 border-green-500/60
              shadow-[0_0_20px_rgba(34,197,94,0.6),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
            
            {/* Middle frame (bright highlight) */}
            <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-green-600 via-green-500 to-green-800"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* Inner crystal layer */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-green-500 via-green-600 to-green-700"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
            
            {/* Specular highlight */}
            <div className="absolute rounded-xl sm:rounded-2xl pointer-events-none"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2 drop-shadow-[0_2px_8px_rgba(74,222,128,0.8)]" />
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Helyes válaszok</p>
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.total_correct_answers || 0}</p>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu">
            {/* Base shadow (3D depth) */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
            
            {/* Outer frame */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-900 border-2 border-blue-500/60
              shadow-[0_0_20px_rgba(59,130,246,0.6),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
            
            {/* Middle frame (bright highlight) */}
            <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-blue-600 via-blue-500 to-blue-800"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* Inner crystal layer */}
            <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
            
            {/* Specular highlight */}
            <div className="absolute rounded-xl sm:rounded-2xl pointer-events-none"
              style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2 drop-shadow-[0_2px_8px_rgba(96,165,250,0.8)]" />
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Napi sorozat</p>
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.daily_gift_streak} nap</p>
            </div>
          </div>
        </div>

        {/* Invitation Code - Full width */}
        <div 
          onClick={() => {
            navigator.clipboard.writeText(profile.invitation_code || '');
            toast.success('Meghívókód vágólapra másolva!');
          }}
          className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center mb-4 sm:mb-6 cursor-pointer transition-transform active:scale-95 transform-gpu hover:scale-105 hover:-translate-y-0.5"
        >
          {/* Base shadow (3D depth) */}
          <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
          
          {/* Outer frame */}
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-500/60
            shadow-[0_0_20px_rgba(168,85,247,0.6),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
          
          {/* Middle frame (bright highlight) */}
          <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
          
          {/* Inner crystal layer */}
          <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700"
            style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
          
          {/* Specular highlight */}
          <div className="absolute rounded-xl sm:rounded-2xl pointer-events-none"
            style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
          
          {/* Content */}
          <div className="relative z-10">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2 drop-shadow-[0_2px_8px_rgba(192,132,252,0.8)]" />
            <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold">Meghívó kód (kattints a másoláshoz)</p>
            <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.invitation_code}</p>
          </div>
        </div>

        {/* Booster Inventory */}
        <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm mb-4 sm:mb-6 transform-gpu">
          {/* Base shadow (3D depth) */}
          <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
          
          {/* Outer frame */}
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-600/40 via-yellow-500/30 to-yellow-800/40 border-2 border-yellow-500/50
            shadow-[0_0_20px_rgba(234,179,8,0.6),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
          
          {/* Middle frame (bright highlight) */}
          <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-yellow-500/30 via-yellow-400/20 to-yellow-700/30"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }} aria-hidden />
          
          {/* Inner crystal layer */}
          <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/60 via-black/70 to-black/80"
            style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)' }} aria-hidden />
          
          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 mb-3 sm:mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.8)]" />
              Booster készletem
            </h2>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {['DoubleSpeed', 'MegaSpeed', 'GigaSpeed', 'DingleSpeed'].map((boosterName) => (
                <div key={boosterName} className="relative rounded-lg sm:rounded-xl p-3 sm:p-4 text-center transform-gpu">
                  {/* Booster card base shadow */}
                  <div className="absolute rounded-lg sm:rounded-xl bg-black/25 blur-sm" style={{ top: '2px', left: '2px', right: '-2px', bottom: '-2px' }} aria-hidden />
                  
                  {/* Booster outer frame */}
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-600/30 via-yellow-500/20 to-yellow-700/30 border border-yellow-500/50
                    shadow-[0_0_12px_rgba(234,179,8,0.4),0_4px_12px_rgba(0,0,0,0.3)]" aria-hidden />
                  
                  {/* Booster middle layer */}
                  <div className="absolute inset-[2px] rounded-lg sm:rounded-xl bg-gradient-to-b from-yellow-500/20 via-yellow-400/10 to-yellow-600/20"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }} aria-hidden />
                  
                  {/* Booster inner layer */}
                  <div className="absolute rounded-lg sm:rounded-xl bg-gradient-to-b from-yellow-400/10 via-yellow-500/15 to-yellow-600/10"
                    style={{ top: '3px', left: '3px', right: '3px', bottom: '3px', boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.2)' }} aria-hidden />
                  
                  {/* Booster specular */}
                  <div className="absolute rounded-lg sm:rounded-xl pointer-events-none"
                    style={{ top: '3px', left: '3px', right: '3px', bottom: '3px', background: 'radial-gradient(ellipse 100% 50% at 30% 0%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)' }} aria-hidden />
                  
                  {/* Booster content */}
                  <div className="relative z-10">
                    <p className="text-xs sm:text-sm text-yellow-300 mb-1 font-semibold">{boosterName}</p>
                    <p className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{boosterCounts[boosterName as keyof typeof boosterCounts] || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm transform-gpu">
          {/* Base shadow (3D depth) */}
          <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
          
          {/* Outer frame */}
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-700/40 via-purple-600/30 to-purple-900/40 border-2 border-purple-500/30
            shadow-[0_0_20px_rgba(168,85,247,0.4),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
          
          {/* Middle frame (bright highlight) */}
          <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-purple-600/30 via-purple-500/20 to-purple-800/30"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
          
          {/* Inner crystal layer */}
          <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/50 via-black/60 to-black/70"
            style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)' }} aria-hidden />
          
          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]" />
              Fiók információk
            </h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">Felhasználónév</p>
                <p className="text-sm sm:text-base text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{profile.username}</p>
              </div>
              
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">E-mail cím</p>
                <p className="text-sm sm:text-base text-white font-bold break-all drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{profile.email}</p>
              </div>
              
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">Élet regeneráció</p>
                <p className="text-sm sm:text-base text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {profile.lives_regeneration_rate} perc / 1 élet
                  {profile.speed_booster_active && (
                    <span className="ml-2 text-[10px] sm:text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                      Booster aktív (×{profile.speed_booster_multiplier})
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-white/50 mb-1">Regisztráció dátuma</p>
                <p className="text-sm sm:text-base text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {new Date(profile.created_at).toLocaleDateString('hu-HU')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
      <TutorialManager route="profile" />
    </div>
  );
};

export default Profile;
