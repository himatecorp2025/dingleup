import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { LifeIcon3D } from '@/components/icons/LifeIcon3D';
import { CoinIcon3D } from '@/components/icons/CoinIcon3D';
import { DiamondIcon3D } from '@/components/icons/DiamondIcon3D';

interface InGameRescuePopupProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason: 'NO_LIFE' | 'NO_GOLD';
  currentLives: number;
  currentGold: number;
  onStateRefresh: () => Promise<void>;
}

export const InGameRescuePopup: React.FC<InGameRescuePopupProps> = ({
  isOpen,
  onClose,
  triggerReason,
  currentLives,
  currentGold,
  onStateRefresh,
}) => {
  const { t } = useI18n();
  const [loadingGoldSaver, setLoadingGoldSaver] = useState(false);
  const [loadingInstantRescue, setLoadingInstantRescue] = useState(false);

  const handleGoldSaverPurchase = async () => {
    if (currentGold < 500) {
      toast.error('Nincs elég aranyérméd a mentőcsomag megvásárlásához!');
      return;
    }

    setLoadingGoldSaver(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nincs bejelentkezve! Kérlek, jelentkezz be!');
        setLoadingGoldSaver(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'GOLD_SAVER' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Sikeres vásárlás! +30 aranyérme és +3 élet hozzáadva!');
        await onStateRefresh();
        onClose();
      } else {
        toast.error(data?.error || 'Sikertelen vásárlás!');
      }
    } catch (error) {
      console.error('Gold Saver purchase error:', error);
      toast.error('Hiba történt a vásárlás során!');
    } finally {
      setLoadingGoldSaver(false);
    }
  };

  const handleInstantRescuePurchase = async () => {
    setLoadingInstantRescue(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nincs bejelentkezve! Kérlek, jelentkezz be!');
        setLoadingInstantRescue(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'INSTANT_RESCUE' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Sikeres vásárlás! +1500 aranyérme és +50 élet hozzáadva!');
        await onStateRefresh();
        onClose();
      } else {
        if (data?.error === 'PAYMENT_FAILED') {
          toast.error('A fizetés sikertelen volt!');
        } else {
          toast.error(data?.error || 'Sikertelen vásárlás!');
        }
      }
    } catch (error) {
      console.error('Instant Rescue purchase error:', error);
      toast.error('Hiba történt a vásárlás során!');
    } finally {
      setLoadingInstantRescue(false);
    }
  };

  const hasEnoughGold = currentGold >= 500;

  const [starsVisible, setStarsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setStarsVisible(true), 50);
      return () => {
        clearTimeout(timer);
        setStarsVisible(false);
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-[95vw] w-full h-[70vh] overflow-y-auto border-0 p-0 shadow-2xl rounded-3xl !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !m-0 bg-transparent" 
        style={{ 
          boxShadow: '0 0 60px rgba(250, 204, 21, 0.8), 0 30px 100px rgba(0, 0, 0, 0.9), 0 0 120px rgba(234, 179, 8, 0.6)',
          background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.95) 0%, rgba(88, 28, 135, 0.98) 50%, rgba(127, 29, 29, 0.95) 100%)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Animated golden stars background */}
        {starsVisible && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            {[...Array(80)].map((_, i) => {
              const delay = Math.random() * 3;
              const duration = 1.5 + Math.random() * 1;
              const startX = Math.random() * 100;
              const startY = Math.random() * 100;
              const moveX = (Math.random() - 0.5) * 30;
              const moveY = (Math.random() - 0.5) * 30;
              
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${startX}%`,
                    top: `${startY}%`,
                    animation: `starFadeRescue${i} ${duration}s ease-in-out ${delay}s infinite`,
                    zIndex: 1
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="#fbbf24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <style>{`
                    @keyframes starFadeRescue${i} {
                      0%, 100% { 
                        transform: translate(0, 0) scale(0);
                        opacity: 0;
                      }
                      50% { 
                        transform: translate(${moveX}px, ${moveY}px) scale(1.8);
                        opacity: 1;
                      }
                    }
                  `}</style>
                </div>
              );
            })}
          </div>
        )}

        {/* Main content with ultra 3D styling */}
        <div className="relative z-10 p-5 h-full flex flex-col" style={{
          background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.4) 0%, rgba(126, 34, 206, 0.5) 50%, rgba(185, 28, 28, 0.4) 100%)',
          boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.6), inset 0 -4px 20px rgba(0, 0, 0, 0.6)',
          border: '5px solid transparent',
          borderImage: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%) 1',
          borderRadius: '24px'
        }}>
        {/* Header with ultra 3D styling */}
        <DialogHeader className="space-y-1.5 mb-4">
          <DialogTitle className="text-3xl font-black text-center bg-gradient-to-r from-yellow-200 via-yellow-50 to-yellow-200 bg-clip-text text-transparent leading-tight tracking-wider" style={{ 
            textShadow: '0 4px 15px rgba(234, 179, 8, 0.9), 0 8px 30px rgba(234, 179, 8, 0.6), 0 0 40px rgba(234, 179, 8, 0.7), 0 2px 4px rgba(0, 0, 0, 0.8)', 
            filter: 'drop-shadow(0 6px 15px rgba(234, 179, 8, 0.5))'
          }}>
            {t('rescue.title')}
          </DialogTitle>
          <p className="text-center text-yellow-50 text-base font-black tracking-wide" style={{ textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(251, 191, 36, 0.5), 0 6px 20px rgba(251, 191, 36, 0.4)' }}>
            {t('rescue.subtitle')}
          </p>
        </DialogHeader>

        {/* Current Status with ultra 3D styling */}
        <div className="relative bg-gradient-to-br from-blue-900/80 via-purple-900/90 to-blue-900/80 border-[4px] rounded-2xl p-4 mb-4 shadow-2xl" style={{ 
          borderImage: 'linear-gradient(135deg, rgba(96, 165, 250, 0.8), rgba(147, 51, 234, 0.9), rgba(96, 165, 250, 0.8)) 1',
          boxShadow: 'inset 0 4px 16px rgba(0, 0, 0, 0.5), 0 8px 30px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3), 0 12px 40px rgba(0, 0, 0, 0.6)' 
        }}>
          {/* Multiple glow layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/25 via-transparent to-purple-500/25 rounded-2xl pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-400/15 via-transparent to-purple-400/15 rounded-2xl pointer-events-none"></div>
          
          <div className="relative flex items-center justify-around">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/40 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute inset-0 bg-green-400/30 rounded-full blur-lg"></div>
                <LifeIcon3D size={48} className="relative drop-shadow-2xl" style={{ filter: 'drop-shadow(0 8px 20px rgba(34, 197, 94, 0.6)) drop-shadow(0 0 30px rgba(34, 197, 94, 0.4))' }} />
              </div>
              <div>
                <p className="text-blue-50 text-sm font-black tracking-wide" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(59, 130, 246, 0.4)' }}>{t('rescue.life_label')}</p>
                <p className="text-white font-black text-3xl" style={{ textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(59, 130, 246, 0.6), 0 6px 25px rgba(59, 130, 246, 0.4)' }}>{currentLives}</p>
              </div>
            </div>
            
            <div className="h-14 w-[3px] bg-gradient-to-b from-transparent via-blue-200/50 to-transparent shadow-lg"></div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/40 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-lg"></div>
                <CoinIcon3D size={48} className="relative drop-shadow-2xl" style={{ filter: 'drop-shadow(0 8px 20px rgba(234, 179, 8, 0.6)) drop-shadow(0 0 30px rgba(234, 179, 8, 0.4))' }} />
              </div>
              <div>
                <p className="text-yellow-50 text-sm font-black tracking-wide" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(234, 179, 8, 0.4)' }}>{t('rescue.gold_label')}</p>
                <p className="text-white font-black text-3xl" style={{ textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(234, 179, 8, 0.6), 0 6px 25px rgba(234, 179, 8, 0.4)' }}>{currentGold}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booster Options - Ultra 3D styling */}
        <div className="grid grid-cols-2 gap-4 mb-4 items-stretch">
          {/* Gold Saver Booster - Ultra 3D */}
          <div className="relative flex flex-col h-full">
            {/* Multiple glow layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/60 to-orange-500/60 rounded-3xl blur-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/50 to-orange-400/50 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 rounded-3xl p-4 shadow-2xl flex-1 flex flex-col" style={{ 
              border: '5px solid transparent',
              borderImage: 'linear-gradient(135deg, #fde047 0%, #facc15 25%, #f59e0b 50%, #facc15 75%, #fde047 100%) 1',
              boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.5), 0 10px 40px rgba(234, 179, 8, 0.6), 0 0 50px rgba(234, 179, 8, 0.4), 0 15px 50px rgba(0, 0, 0, 0.7)' 
            }}>
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/15 via-transparent to-orange-500/15 rounded-3xl pointer-events-none"></div>
              
              {/* Large coin icon at top with ultra glow */}
              <div className="flex justify-center -mt-10 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-300/60 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute inset-0 bg-yellow-400/50 rounded-full blur-xl"></div>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-500 flex items-center justify-center" style={{ boxShadow: '0 15px 40px rgba(202, 138, 4, 0.8), inset 0 -6px 16px rgba(0, 0, 0, 0.5), inset 0 6px 16px rgba(255, 255, 255, 0.6), 0 0 50px rgba(234, 179, 8, 0.5)' }}>
                    <CoinIcon3D size={64} className="drop-shadow-2xl" style={{ filter: 'drop-shadow(0 10px 25px rgba(202, 138, 4, 0.7))' }} />
                  </div>
                </div>
              </div>

              <h3 className="text-base font-black text-center bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 bg-clip-text text-transparent mb-2 leading-tight tracking-widest" style={{ textShadow: '0 3px 12px rgba(234, 179, 8, 0.9), 0 0 25px rgba(234, 179, 8, 0.5)' }}>
                Gold Saver
              </h3>

              <p className="text-blue-50 text-xs text-center mb-3 font-bold leading-snug px-2" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(147, 197, 253, 0.3)' }}>
                {t('rescue.gold_saver_description')}
              </p>

              {/* Ultra enhanced reward bar */}
              <div className="relative bg-gradient-to-r from-red-800 via-orange-600 to-red-800 rounded-2xl p-2.5 mb-3 shadow-2xl" style={{ 
                border: '3px solid transparent',
                borderImage: 'linear-gradient(135deg, rgba(248, 113, 113, 0.8), rgba(251, 146, 60, 0.9), rgba(248, 113, 113, 0.8)) 1',
                boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.5), 0 6px 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4)' 
              }}>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-orange-500/20 rounded-2xl pointer-events-none"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <span className="text-yellow-50 text-sm font-black tracking-wide" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(234, 179, 8, 0.4)' }}>{t('rescue.gold_saver_reward_gold')}</span>
                  <span className="text-green-50 text-sm font-black tracking-wide" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(34, 197, 94, 0.4)' }}>{t('rescue.gold_saver_reward_lives')}</span>
                </div>
              </div>

              <div className="flex-1"></div>

              {!hasEnoughGold && (
                <p className="text-yellow-100 text-[10px] text-center mb-2.5 font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 0 12px rgba(234, 179, 8, 0.4)' }}>
                  {t('rescue.not_enough_warning')}
                </p>
              )}

              <Button
                onClick={handleGoldSaverPurchase}
                disabled={!hasEnoughGold || loadingGoldSaver}
                className="w-full bg-gradient-to-b from-green-300 via-green-500 to-green-800 hover:from-green-200 hover:via-green-400 hover:to-green-700 text-white font-black text-base py-4 rounded-2xl disabled:opacity-50 transition-all" 
                style={{ 
                  textShadow: '0 3px 8px rgba(0, 0, 0, 0.8)', 
                  border: '4px solid transparent',
                  borderImage: 'linear-gradient(135deg, #bbf7d0, #4ade80, #bbf7d0) 1',
                  boxShadow: 'inset 0 4px 8px rgba(255, 255, 255, 0.5), 0 8px 30px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.5), 0 12px 40px rgba(0, 0, 0, 0.5)' 
                }}
              >
                {loadingGoldSaver ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="text-sm">{t('rescue.processing')}</span>
                  </>
                ) : hasEnoughGold ? (
                  <span className="text-base tracking-widest">500 ARANY</span>
                ) : (
                  <span className="text-sm">{t('rescue.not_enough_short')}</span>
                )}
              </Button>
            </div>
          </div>

          {/* Instant Rescue Booster - Ultra Premium 3D */}
          <div className="relative flex flex-col h-full">
            {/* Multiple animated glow layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/70 to-purple-500/70 rounded-3xl blur-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/60 to-purple-400/60 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 rounded-3xl p-4 shadow-2xl flex-1 flex flex-col" style={{ 
              border: '5px solid transparent',
              borderImage: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 25%, #ec4899 50%, #f472b6 75%, #fbcfe8 100%) 1',
              boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.5), 0 10px 40px rgba(236, 72, 153, 0.7), 0 0 50px rgba(236, 72, 153, 0.5), 0 15px 50px rgba(0, 0, 0, 0.7)' 
            }}>
              {/* Inner glow layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-transparent to-purple-500/20 rounded-3xl pointer-events-none"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-pink-400/15 via-transparent to-purple-400/15 rounded-3xl pointer-events-none"></div>
              
              {/* Large diamond icon at top with ultra glow */}
              <div className="flex justify-center -mt-10 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-300/70 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute inset-0 bg-pink-400/60 rounded-full blur-xl"></div>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 via-pink-200 to-pink-500 flex items-center justify-center" style={{ boxShadow: '0 15px 40px rgba(219, 39, 119, 0.9), inset 0 -6px 16px rgba(0, 0, 0, 0.5), inset 0 6px 16px rgba(255, 255, 255, 0.6), 0 0 50px rgba(236, 72, 153, 0.6)' }}>
                    <DiamondIcon3D size={64} className="drop-shadow-2xl" style={{ filter: 'drop-shadow(0 10px 25px rgba(219, 39, 119, 0.8))' }} />
                  </div>
                </div>
              </div>

              <h3 className="text-base font-black text-center bg-gradient-to-r from-pink-50 via-pink-100 to-pink-50 bg-clip-text text-transparent mb-2 leading-tight tracking-widest" style={{ textShadow: '0 3px 12px rgba(236, 72, 153, 0.9), 0 0 25px rgba(236, 72, 153, 0.5)' }}>
                Instant Rescue
              </h3>

              <p className="text-pink-50 text-xs text-center mb-3 font-bold leading-snug px-2" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(251, 207, 232, 0.3)' }}>
                {t('rescue.instant_rescue_description')}
              </p>

              {/* Ultra enhanced reward bar */}
              <div className="relative bg-gradient-to-r from-red-800 via-orange-600 to-red-800 rounded-2xl p-2.5 mb-3 shadow-2xl" style={{ 
                border: '3px solid transparent',
                borderImage: 'linear-gradient(135deg, rgba(248, 113, 113, 0.8), rgba(251, 146, 60, 0.9), rgba(248, 113, 113, 0.8)) 1',
                boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.5), 0 6px 20px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4)' 
              }}>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-orange-500/20 rounded-2xl pointer-events-none"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <span className="text-yellow-50 text-sm font-black tracking-wide" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(234, 179, 8, 0.4)' }}>{t('rescue.instant_rescue_reward_gold')}</span>
                  <span className="text-green-50 text-sm font-black tracking-wide" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(34, 197, 94, 0.4)' }}>{t('rescue.instant_rescue_reward_lives')}</span>
                </div>
              </div>

              <div className="flex-1"></div>

              <Button
                onClick={handleInstantRescuePurchase}
                disabled={loadingInstantRescue}
                className="w-full bg-gradient-to-b from-green-300 via-green-500 to-green-800 hover:from-green-200 hover:via-green-400 hover:to-green-700 text-white font-black text-base py-4 rounded-2xl transition-all" 
                style={{ 
                  textShadow: '0 3px 8px rgba(0, 0, 0, 0.8)', 
                  border: '4px solid transparent',
                  borderImage: 'linear-gradient(135deg, #bbf7d0, #4ade80, #bbf7d0) 1',
                  boxShadow: 'inset 0 4px 8px rgba(255, 255, 255, 0.5), 0 8px 30px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.5), 0 12px 40px rgba(0, 0, 0, 0.5)' 
                }}
              >
                {loadingInstantRescue ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="text-sm">{t('rescue.processing')}</span>
                  </>
                ) : (
                  <span className="text-base tracking-widest">1,49 $</span>
                )}
              </Button>

              <p className="text-pink-50/80 text-[9px] text-center mt-2 leading-snug font-bold" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                {t('rescue.instant_credit')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer with ultra 3D styling */}
        <div className="text-center pt-3 shadow-2xl" style={{ 
          borderTop: '3px solid transparent',
          borderImage: 'linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.5), transparent) 1',
          boxShadow: '0 -4px 15px rgba(234, 179, 8, 0.3)' 
        }}>
          <p className="text-yellow-50 text-xs mb-3 leading-snug font-black tracking-wide" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 0 15px rgba(251, 191, 36, 0.4)' }}>
            {t('rescue.continue_message')}
          </p>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-yellow-50 hover:text-white hover:bg-white/20 text-base h-11 px-6 font-black transition-all rounded-xl" 
            style={{ 
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)', 
              boxShadow: '0 4px 15px rgba(250, 204, 21, 0.2)' 
            }}
          >
            {t('rescue.cancel_button')}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
