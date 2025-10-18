import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Coins, Heart } from 'lucide-react';
import Shop from '@/components/Shop';
import BottomNav from '@/components/BottomNav';
import { useGameProfile } from '@/hooks/useGameProfile';

const ShopPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading } = useGameProfile(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] pb-24 overflow-x-hidden overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
            title="Vissza"
          >
            <LogOut className="w-6 h-6 -scale-x-100" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border-2 border-red-500/50">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold text-white">{profile.lives}/{profile.max_lives}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border-2 border-yellow-500/50">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-white">{profile.coins}</span>
            </div>
          </div>
        </div>

        {/* Shop Component */}
        <Shop userId={userId!} />
      </div>

      <BottomNav />
    </div>
  );
};

export default ShopPage;
