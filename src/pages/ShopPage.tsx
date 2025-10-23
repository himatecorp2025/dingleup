import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Coins, Heart } from 'lucide-react';
import Shop from '@/components/Shop';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useWallet } from '@/hooks/useWallet';
import BottomNav from '@/components/BottomNav';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { TipsVideosGrid } from '@/components/TipsVideosGrid';

const ShopPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading } = useGameProfile(userId);
  const { walletData } = useWallet(userId);

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
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden pb-24 relative z-10">
        <div className="max-w-6xl mx-auto p-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-safe">
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

        {/* Wallet Balance Box */}
        <div className="mb-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
          <h3 className="text-xl font-bold text-yellow-400 mb-2">💰 Aranyérme egyenleg</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold text-white">{profile.coins}</span>
            </div>
          </div>
        </div>

        {/* Tips & Tricks - Only for Genius subscribers */}
        {walletData?.isSubscriber && (
          <div className="mb-4">
            <TipsVideosGrid 
              isGenius={true} 
              onSubscribeClick={() => {}} 
            />
            {walletData.subscriberRenewAt && (
              <div className="mt-2 text-center text-xs text-yellow-400/80">
                Következő megújítás: {new Intl.DateTimeFormat('hu-HU', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date(walletData.subscriberRenewAt))}
              </div>
            )}
          </div>
        )}

        {/* Shop Component */}
        <div data-tutorial="coins-section">
          <Shop userId={userId!} />
        </div>
      </div>
      </div>

      <BottomNav />
      <TutorialManager route="shop" />
    </div>
  );
};

export default ShopPage;
