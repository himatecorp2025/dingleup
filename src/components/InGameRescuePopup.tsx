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
import { BellIcon3D } from '@/components/icons/BellIcon3D';

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
        className="max-w-[95vw] w-full h-[90vh] overflow-y-auto border-0 p-0 shadow-2xl !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !m-0" 
        style={{ 
          clipPath: 'polygon(50% 0%, 100% 4.756%, 100% 95.244%, 50% 100%, 0% 95.244%, 0% 4.756%)',
          background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
          boxShadow: 'inset 0 0 0 6px hsl(var(--dup-gold-800)), 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 60px rgba(234, 179, 8, 0.5)'
        }}
      >
        {/* Inner Gold Frame Layer */}
        <div 
          className="absolute inset-[6px]"
          style={{
            clipPath: 'polygon(50% 0.5%, 99.5% 4.756%, 99.5% 95.244%, 50% 99.5%, 0.5% 95.244%, 0.5% 4.756%)',
            background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
            boxShadow: 'inset 0 2px 0 hsl(var(--dup-gold-300))'
          }}
        />

        {/* Crystal Panel Background */}
        <div 
          className="absolute inset-[12px]"
          style={{
            clipPath: 'polygon(50% 1%, 99% 5%, 99% 95%, 50% 99%, 1% 95%, 1% 5%)',
            background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(280 95% 75%) 0%, hsl(285 90% 65%) 30%, hsl(290 85% 55%) 60%, hsl(295 78% 48%) 100%)',
            boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.3)'
          }}
        />

        {/* Animated golden stars background */}
        {starsVisible && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ clipPath: 'polygon(50% 1%, 99% 5%, 99% 95%, 50% 99%, 1% 95%, 1% 5%)' }}>
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

        {/* Main content */}
        <div className="relative z-10 p-5 h-full flex flex-col" style={{
          clipPath: 'polygon(50% 1.5%, 98.5% 5.5%, 98.5% 94.5%, 50% 98.5%, 1.5% 94.5%, 1.5% 5.5%)'
        }}>
          {/* Header */}
          <DialogHeader className="space-y-1.5 mb-4">
            <div className="flex items-center justify-center gap-2">
              <DialogTitle className="text-3xl font-black text-center text-white leading-tight tracking-wider" style={{ 
                textShadow: '0 0 30px rgba(255, 255, 255, 1), 0 0 60px rgba(255, 255, 255, 0.8), 0 4px 20px rgba(0, 0, 0, 1), 0 8px 40px rgba(0, 0, 0, 0.8)'
              }}>
                {t('rescue.title')}
              </DialogTitle>
              <BellIcon3D size={40} style={{ filter: 'drop-shadow(0 4px 12px rgba(234, 179, 8, 0.8))' }} />
            </div>
            <p className="text-center text-white text-base font-black tracking-wide" style={{ 
              textShadow: '0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(255, 255, 255, 0.6), 0 3px 15px rgba(0, 0, 0, 1), 0 6px 30px rgba(0, 0, 0, 0.8)'
            }}>
              {t('rescue.subtitle')}
            </p>
          </DialogHeader>

          {/* Current Status with hex badge border styling */}
          <div className="relative p-4 mb-4" style={{ width: '90%', margin: '0 auto' }}>
            {/* Shadow layer */}
            <div className="absolute inset-0 translate-y-1 translate-x-1"
                 style={{
                   clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                   background: 'rgba(0,0,0,0.4)',
                   filter: 'blur(4px)',
                   zIndex: -1
                 }} />
            
            {/* Outer gold frame */}
            <div className="absolute inset-0"
                 style={{
                   clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                   background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                   boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 3px 8px rgba(0,0,0,0.175)'
                 }} />
            
            {/* Inner gold highlight */}
            <div className="absolute inset-[3px]"
                 style={{
                   clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                   background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                   boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                 }} />
            
            {/* Blue crystal content area */}
            <div className="relative px-6 py-4"
                 style={{
                   clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")'
                 }}>
              <div className="absolute inset-[6px]"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(220 95% 75%) 0%, hsl(225 90% 65%) 30%, hsl(230 85% 55%) 60%, hsl(235 78% 48%) 100%)',
                     boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                   }} />
              
              <div className="absolute inset-[6px] pointer-events-none"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px)',
                     opacity: 0.7
                   }} />
              
              <div className="absolute inset-[6px] pointer-events-none" style={{
                clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
              }} />
              
              <div className="relative z-10 flex items-center justify-around">
                <div className="flex items-center gap-3">
                  <LifeIcon3D size={48} className="drop-shadow-2xl" style={{ filter: 'drop-shadow(0 8px 20px rgba(34, 197, 94, 0.6))' }} />
                  <div>
                    <p className="text-white text-sm font-black tracking-wide" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)' }}>{t('rescue.life_label')}</p>
                    <p className="text-white font-black text-3xl" style={{ textShadow: '0 3px 12px rgba(0, 0, 0, 1)' }}>{currentLives}</p>
                  </div>
                </div>
                
                <div className="h-14 w-[3px] bg-gradient-to-b from-transparent via-white/50 to-transparent"></div>
                
                <div className="flex items-center gap-3">
                  <CoinIcon3D size={48} className="drop-shadow-2xl" style={{ filter: 'drop-shadow(0 8px 20px rgba(234, 179, 8, 0.6))' }} />
                  <div>
                    <p className="text-white text-sm font-black tracking-wide" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)' }}>{t('rescue.gold_label')}</p>
                    <p className="text-white font-black text-3xl" style={{ textShadow: '0 3px 12px rgba(0, 0, 0, 1)' }}>{currentGold}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booster Options - Hex badge border styling */}
          <div className="grid grid-cols-2 gap-4 mb-4 items-stretch">
            {/* Gold Saver Booster */}
            <div className="relative flex flex-col h-full">
              {/* Shadow layer */}
              <div className="absolute inset-0 translate-y-1 translate-x-1"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     background: 'rgba(0,0,0,0.4)',
                     filter: 'blur(4px)',
                     zIndex: -1
                   }} />
              
              {/* Outer gold frame */}
              <div className="absolute inset-0"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                     boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 3px 8px rgba(0,0,0,0.175)'
                   }} />
              
              {/* Inner gold highlight */}
              <div className="absolute inset-[3px]"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                     boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                   }} />
              
              {/* Blue crystal content area */}
              <div className="relative px-4 py-6 h-full flex flex-col"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")'
                   }}>
                <div className="absolute inset-[6px]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(220 95% 75%) 0%, hsl(225 90% 65%) 30%, hsl(230 85% 55%) 60%, hsl(235 78% 48%) 100%)',
                       boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                     }} />
                
                <div className="absolute inset-[6px] pointer-events-none"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px)',
                       opacity: 0.7
                     }} />
                
                <div className="absolute inset-[6px] pointer-events-none" style={{
                  clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                  background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                }} />
                
                {/* Coin icon */}
                <div className="relative z-10 flex justify-center mb-3">
                  <CoinIcon3D size={64} style={{ filter: 'drop-shadow(0 8px 20px rgba(234, 179, 8, 0.7))' }} />
                </div>

                <h3 className="relative z-10 text-base font-black text-center text-white mb-2 leading-tight tracking-widest" style={{ textShadow: '0 3px 12px rgba(0, 0, 0, 1)' }}>
                  Gold Saver
                </h3>

                <p className="relative z-10 text-white text-xs text-center mb-3 font-bold leading-snug px-2" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)' }}>
                  {t('rescue.gold_saver_description')}
                </p>

                {/* Reward display */}
                <div className="relative z-10 flex items-center justify-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <CoinIcon3D size={24} />
                    <span className="text-white text-sm font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 1)' }}>250</span>
                  </div>
                  <span className="text-white text-sm">+</span>
                  <div className="flex items-center gap-1">
                    <LifeIcon3D size={24} />
                    <span className="text-white text-sm font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 1)' }}>3</span>
                  </div>
                </div>

                <div className="relative z-10 flex-1"></div>

                {!hasEnoughGold && (
                  <p className="relative z-10 text-white text-[10px] text-center mb-2.5 font-black" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 1)' }}>
                    {t('rescue.not_enough_warning')}
                  </p>
                )}

                <Button
                  onClick={handleGoldSaverPurchase}
                  disabled={!hasEnoughGold || loadingGoldSaver}
                  className="relative z-10 w-full bg-gradient-to-b from-green-400 via-green-600 to-green-800 hover:from-green-300 hover:via-green-500 hover:to-green-700 text-white font-black text-base py-4 rounded-xl disabled:opacity-50 transition-all" 
                  style={{ 
                    textShadow: '0 3px 8px rgba(0, 0, 0, 0.9)',
                    boxShadow: '0 6px 20px rgba(34, 197, 94, 0.6)'
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

            {/* Instant Rescue Booster */}
            <div className="relative flex flex-col h-full">
              {/* Shadow layer */}
              <div className="absolute inset-0 translate-y-1 translate-x-1"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     background: 'rgba(0,0,0,0.4)',
                     filter: 'blur(4px)',
                     zIndex: -1
                   }} />
              
              {/* Outer gold frame */}
              <div className="absolute inset-0"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                     boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 3px 8px rgba(0,0,0,0.175)'
                   }} />
              
              {/* Inner gold highlight */}
              <div className="absolute inset-[3px]"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                     boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                   }} />
              
              {/* Blue crystal content area */}
              <div className="relative px-4 py-6 h-full flex flex-col"
                   style={{
                     clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")'
                   }}>
                <div className="absolute inset-[6px]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(220 95% 75%) 0%, hsl(225 90% 65%) 30%, hsl(230 85% 55%) 60%, hsl(235 78% 48%) 100%)',
                       boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                     }} />
                
                <div className="absolute inset-[6px] pointer-events-none"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px)',
                       opacity: 0.7
                     }} />
                
                <div className="absolute inset-[6px] pointer-events-none" style={{
                  clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                  background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                }} />
                
                {/* Diamond icon */}
                <div className="relative z-10 flex justify-center mb-3">
                  <DiamondIcon3D size={64} style={{ filter: 'drop-shadow(0 8px 20px rgba(236, 72, 153, 0.7))' }} />
                </div>

                <h3 className="relative z-10 text-base font-black text-center text-white mb-2 leading-tight tracking-widest" style={{ textShadow: '0 3px 12px rgba(0, 0, 0, 1)' }}>
                  Instant Resource
                </h3>

                <p className="relative z-10 text-white text-xs text-center mb-3 font-bold leading-snug px-2" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)' }}>
                  {t('rescue.instant_rescue_description')}
                </p>

                {/* Reward display */}
                <div className="relative z-10 flex items-center justify-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <CoinIcon3D size={24} />
                    <span className="text-white text-sm font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 1)' }}>1000</span>
                  </div>
                  <span className="text-white text-sm">+</span>
                  <div className="flex items-center gap-1">
                    <LifeIcon3D size={24} />
                    <span className="text-white text-sm font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 1)' }}>50</span>
                  </div>
                </div>

                <div className="relative z-10 flex-1"></div>

                <Button
                  onClick={handleInstantRescuePurchase}
                  disabled={loadingInstantRescue}
                  className="relative z-10 w-full bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500 text-black font-black text-base py-4 rounded-xl disabled:opacity-50 transition-all" 
                  style={{ 
                    textShadow: '0 2px 4px rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 6px 20px rgba(234, 179, 8, 0.7)'
                  }}
                >
                  {loadingInstantRescue ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span className="text-sm">{t('rescue.processing')}</span>
                    </>
                  ) : (
                    <span className="text-base tracking-widest">$1.49</span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-3">
            <p className="text-white text-xs mb-3 leading-snug font-black tracking-wide" style={{ 
              textShadow: '0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(255, 255, 255, 0.6), 0 3px 15px rgba(0, 0, 0, 1)'
            }}>
              {t('rescue.continue_message')}
            </p>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20 text-base h-11 px-6 font-black transition-all rounded-xl" 
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

export default InGameRescuePopup;
