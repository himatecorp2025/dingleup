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

  // Platform detection for conditional padding
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://');
      setIsStandalone(isPWA);
    };
    checkStandalone();
  }, []);

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
    <div className="shop-container h-dvh h-svh w-screen overflow-hidden fixed inset-0" style={{
      paddingTop: 'max(calc(env(safe-area-inset-top) + 2%), env(safe-area-inset-top) + 8px)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Full-screen background that covers status bar */}
      <div 
        className="absolute bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]"
        style={{
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none'
        }}
      />
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 100px)' }}>
        <div className="max-w-6xl mx-auto p-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="relative p-3 rounded-full hover:scale-110 transition-all"
            title="Vissza"
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
            
            {/* Icon */}
            <LogOut className="w-6 h-6 text-white relative z-10 -scale-x-100" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Lives Badge - 3D Box Style */}
            <div className="relative rounded-full px-3 sm:px-4 py-2 overflow-hidden">
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-black/60 via-black/40 to-black/60" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[3px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.2) 0%, transparent 60%)' }} aria-hidden />
              
              <div className="relative z-10 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-bold text-white">{profile.lives}/{profile.max_lives}</span>
              </div>
            </div>
            
            {/* Coins Badge - 3D Box Style */}
            <div className="relative rounded-full px-3 sm:px-4 py-2 overflow-hidden">
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-900 border-2 border-yellow-400/50 shadow-lg" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-black/60 via-black/40 to-black/60" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[3px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.2) 0%, transparent 60%)' }} aria-hidden />
              
              <div className="relative z-10 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-white">{profile.coins}</span>
              </div>
            </div>
          </div>
        </div>


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
