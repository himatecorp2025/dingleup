import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { LifeIcon3D } from '@/components/icons/LifeIcon3D';
import { CoinIcon3D } from '@/components/icons/CoinIcon3D';
import { DiamondIcon3D } from '@/components/icons/DiamondIcon3D';
import { GoldRewardCoin3D } from '@/components/icons/GoldRewardCoin3D';
import { LoadingSpinner3D } from '@/components/icons/LoadingSpinner3D';
import { SlotMachine3D } from '@/components/icons/SlotMachine3D';

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[75vw] w-full h-[80vh] sm:h-[75vh] md:h-[70vh] overflow-y-auto bg-gradient-to-br from-red-900/50 via-purple-900/70 to-red-900/50 border-[4px] sm:border-[5px] md:border-[6px] border-yellow-400 p-3 sm:p-4 md:p-5 shadow-2xl rounded-2xl sm:rounded-3xl !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !m-0" style={{ boxShadow: '0 0 50px rgba(250, 204, 21, 0.7), 0 25px 80px rgba(0, 0, 0, 0.8), inset 0 4px 20px rgba(0, 0, 0, 0.5), inset 0 -4px 20px rgba(250, 204, 21, 0.2)' }}>
        {/* Animated background stars */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.7,
              }}
            />
          ))}
        </div>
        {/* Header with enhanced 3D styling */}
        <DialogHeader className="space-y-1 mb-2 sm:mb-3 relative mt-[3%] sm:mt-[5%]">
          {/* Multi-layer header background */}
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-600/30 via-yellow-500/20 to-transparent rounded-t-3xl" style={{ boxShadow: 'inset 0 3px 15px rgba(234, 179, 8, 0.4)' }}></div>
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/10 via-transparent to-transparent"></div>
          
          <DialogTitle className="relative text-lg sm:text-xl md:text-2xl font-black text-center bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent leading-tight tracking-wider" style={{ textShadow: '0 4px 15px rgba(234, 179, 8, 0.9), 0 8px 30px rgba(234, 179, 8, 0.6), 0 0 40px rgba(234, 179, 8, 0.7), 0 2px 5px rgba(0, 0, 0, 0.8)', filter: 'drop-shadow(0 6px 15px rgba(234, 179, 8, 0.5))' }}>
            {t('rescue.title')}
          </DialogTitle>
          <p className="relative text-center text-yellow-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2" style={{ textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(251, 191, 36, 0.4)' }}>
            Ott folytatod, ahol abbahagytad
            <DiamondIcon3D size={20} className="drop-shadow-2xl sm:w-6 sm:h-6" />
          </p>
        </DialogHeader>

        {/* Current Status with 3D icons */}
        <div className="relative bg-gradient-to-r from-blue-900/70 via-purple-900/80 to-blue-900/70 border-[3px] sm:border-[4px] border-blue-400/60 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-2 sm:mb-3 mt-4 sm:mt-6 shadow-xl" style={{ boxShadow: 'inset 0 5px 20px rgba(0, 0, 0, 0.6), inset 0 -3px 15px rgba(59, 130, 246, 0.3), 0 8px 30px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3), 0 15px 50px rgba(0, 0, 0, 0.8)' }}>
          {/* Multi-layer glow effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 rounded-2xl pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-600/10 to-blue-600/10 rounded-2xl pointer-events-none"></div>
          
          <div className="relative flex items-center justify-around">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 rounded-full blur-md"></div>
                <LifeIcon3D size={32} className="relative drop-shadow-2xl sm:w-10 sm:h-10" />
              </div>
              <div>
                <p className="text-blue-100 text-[10px] sm:text-xs font-bold tracking-wide" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>{t('rescue.life_label')}</p>
                <p className="text-white font-black text-xl sm:text-2xl" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(59, 130, 246, 0.5)' }}>{currentLives}</p>
              </div>
            </div>
            
            <div className="h-8 sm:h-10 w-[2px] bg-gradient-to-b from-transparent via-blue-300/40 to-transparent"></div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/30 rounded-full blur-md"></div>
                <CoinIcon3D size={32} className="relative drop-shadow-2xl sm:w-10 sm:h-10" />
              </div>
              <div>
                <p className="text-yellow-100 text-[10px] sm:text-xs font-bold tracking-wide" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>{t('rescue.gold_label')}</p>
                <p className="text-white font-black text-xl sm:text-2xl" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(234, 179, 8, 0.5)' }}>{currentGold}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booster Options - Enhanced 3D styling */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3 items-stretch mt-[5%]">
          {/* Gold Saver Booster - Enhanced 3D */}
          <div className="relative flex flex-col h-full">
            
            {/* Main card with multiple depth layers */}
            <div className="relative bg-gradient-to-br from-blue-800 via-blue-700 to-purple-800 border-[4px] sm:border-[5px] md:border-[6px] border-yellow-300 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-2xl flex-1 flex flex-col min-h-[260px] sm:min-h-[280px] md:min-h-[300px]" style={{ boxShadow: 'inset 0 6px 25px rgba(0, 0, 0, 0.6), inset 0 -6px 25px rgba(234, 179, 8, 0.4)' }}>
              {/* Inner highlight layer */}
              <div className="absolute inset-1 rounded-3xl bg-gradient-to-br from-blue-600/20 via-transparent to-purple-700/20 pointer-events-none"></div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-yellow-400/5 to-yellow-300/10 pointer-events-none"></div>
              {/* Large coin icon at top */}
              <div className="flex justify-center -mt-6 sm:-mt-8 mb-3 sm:mb-3.5">
                <div className="relative">
                  {/* 3D circle with multiple shadow layers */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-600 flex items-center justify-center" style={{ boxShadow: '0 15px 40px rgba(202, 138, 4, 0.9), 0 8px 20px rgba(202, 138, 4, 0.7), inset 0 -6px 20px rgba(0, 0, 0, 0.5), inset 0 6px 20px rgba(255, 255, 255, 0.6), inset 0 0 30px rgba(234, 179, 8, 0.4)' }}>
                    {/* Inner ring for depth */}
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-100/40 to-transparent" style={{ boxShadow: 'inset 0 2px 8px rgba(255, 255, 255, 0.5)' }}></div>
                    <GoldRewardCoin3D size={44} className="drop-shadow-2xl relative z-10 sm:w-14 sm:h-14" />
                  </div>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-black text-center bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-100 bg-clip-text text-transparent mb-0.5 sm:mb-1 leading-tight tracking-wider" style={{ textShadow: '0 2px 10px rgba(234, 179, 8, 0.8)' }}>
                Gold Saver
              </h3>

              <p className="text-blue-50 text-[9px] sm:text-[10px] text-center mb-1.5 sm:mb-2 font-semibold leading-snug px-1" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>
                {t('rescue.gold_saver_description')}
              </p>

              {/* Enhanced red highlight bar for rewards */}
              <div className="relative bg-gradient-to-r from-red-800 via-orange-600 to-red-800 border-[2px] sm:border-[3px] border-red-300/80 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 mb-1.5 sm:mb-2.5 shadow-xl" style={{ boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 -2px 8px rgba(255, 165, 0, 0.3), 0 6px 20px rgba(239, 68, 68, 0.7), 0 0 30px rgba(239, 68, 68, 0.5), 0 8px 30px rgba(0, 0, 0, 0.6)' }}>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <GoldRewardCoin3D size={18} className="drop-shadow-2xl sm:w-[22px] sm:h-[22px]" />
                    <span className="text-yellow-50 text-[10px] sm:text-xs font-black" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(234, 179, 8, 0.5)' }}>+250</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <LifeIcon3D size={18} className="drop-shadow-2xl sm:w-[22px] sm:h-[22px]" />
                    <span className="text-green-50 text-[10px] sm:text-xs font-black" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(34, 197, 94, 0.5)' }}>+15</span>
                  </div>
                </div>
              </div>

              <div className="flex-1"></div>

              <Button
                onClick={handleGoldSaverPurchase}
                disabled={!hasEnoughGold || loadingGoldSaver}
                className="w-full bg-gradient-to-b from-green-400 via-green-500 to-green-700 hover:from-green-300 hover:via-green-400 hover:to-green-600 text-white font-black text-xs sm:text-sm py-2 sm:py-3 rounded-lg sm:rounded-xl disabled:opacity-50 border-[2px] sm:border-[3px] border-green-300 shadow-2xl transition-all" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5)', boxShadow: 'inset 0 4px 10px rgba(255, 255, 255, 0.5), 0 8px 25px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.5), 0 12px 40px rgba(0, 0, 0, 0.6)' }}
              >
                {loadingGoldSaver ? (
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <LoadingSpinner3D size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs">{t('rescue.processing')}</span>
                  </div>
                ) : hasEnoughGold ? (
                  <span className="text-xs sm:text-sm tracking-wider">500 ARANY</span>
                ) : (
                  <span className="text-[10px] sm:text-xs">{t('rescue.not_enough_short')}</span>
                )}
              </Button>

              {!hasEnoughGold && (
                <p className="text-yellow-200 text-[8px] sm:text-[9px] text-center mt-1 sm:mt-1.5 font-bold" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>
                  {t('rescue.not_enough_warning')}
                </p>
              )}
            </div>
          </div>

          {/* Instant Rescue Booster - Premium Enhanced 3D */}
          <div className="relative flex flex-col h-full">
            
            {/* Main card with multiple depth layers */}
            <div className="relative bg-gradient-to-br from-purple-800 via-pink-700 to-purple-800 border-[4px] sm:border-[5px] md:border-[6px] border-cyan-300 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-2xl flex-1 flex flex-col min-h-[260px] sm:min-h-[280px] md:min-h-[300px]" style={{ boxShadow: 'inset 0 6px 25px rgba(0, 0, 0, 0.6), inset 0 -6px 25px rgba(6, 182, 212, 0.4)' }}>
              {/* Inner highlight layer */}
              <div className="absolute inset-1 rounded-3xl bg-gradient-to-br from-purple-600/20 via-transparent to-pink-700/20 pointer-events-none"></div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-cyan-400/5 to-blue-300/10 pointer-events-none"></div>
              {/* Large diamond icon at top */}
              <div className="flex justify-center -mt-6 sm:-mt-8 mb-3 sm:mb-3.5">
                <div className="relative">
                  {/* 3D circle with multiple shadow layers */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-cyan-200 via-blue-300 to-blue-600 flex items-center justify-center" style={{ boxShadow: '0 15px 40px rgba(6, 182, 212, 0.9), 0 8px 20px rgba(59, 130, 246, 0.7), inset 0 -6px 20px rgba(0, 0, 0, 0.5), inset 0 6px 20px rgba(255, 255, 255, 0.6), inset 0 0 30px rgba(6, 182, 212, 0.4)' }}>
                    {/* Inner ring for depth */}
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-100/40 to-transparent" style={{ boxShadow: 'inset 0 2px 8px rgba(255, 255, 255, 0.5)' }}></div>
                    <DiamondIcon3D size={88} className="drop-shadow-2xl relative z-10 sm:w-28 sm:h-28" />
                  </div>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-black text-center bg-gradient-to-r from-cyan-100 via-blue-50 to-cyan-100 bg-clip-text text-transparent mb-0.5 sm:mb-1 leading-tight tracking-wider" style={{ textShadow: '0 3px 12px rgba(6, 182, 212, 0.9), 0 0 20px rgba(59, 130, 246, 0.6)' }}>
                Instant Rescue
              </h3>

              <p className="text-cyan-50 text-[9px] sm:text-[10px] text-center mb-1.5 sm:mb-2 font-semibold leading-snug px-1" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)' }}>
                {t('rescue.instant_rescue_description')}
              </p>

              {/* Enhanced red highlight bar for rewards */}
              <div className="relative bg-gradient-to-r from-red-800 via-orange-600 to-red-800 border-[2px] sm:border-[3px] border-red-300/80 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 mb-1.5 sm:mb-2.5 shadow-xl" style={{ boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 -2px 8px rgba(255, 165, 0, 0.3), 0 6px 20px rgba(239, 68, 68, 0.7), 0 0 30px rgba(239, 68, 68, 0.5), 0 8px 30px rgba(0, 0, 0, 0.6)' }}>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <GoldRewardCoin3D size={18} className="drop-shadow-2xl sm:w-[22px] sm:h-[22px]" />
                    <span className="text-yellow-50 text-[10px] sm:text-xs font-black" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(234, 179, 8, 0.5)' }}>+1500</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <LifeIcon3D size={18} className="drop-shadow-2xl sm:w-[22px] sm:h-[22px]" />
                    <span className="text-green-50 text-[10px] sm:text-xs font-black" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.9), 0 0 15px rgba(34, 197, 94, 0.5)' }}>+50</span>
                  </div>
                </div>
              </div>

              <div className="flex-1"></div>

              <Button
                onClick={handleInstantRescuePurchase}
                disabled={loadingInstantRescue}
                className="w-full bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 hover:from-yellow-200 hover:via-yellow-300 hover:to-yellow-500 text-black font-black text-xs sm:text-sm py-2 sm:py-3 rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-yellow-200 shadow-2xl transition-all" style={{ textShadow: '0 1px 3px rgba(255, 255, 255, 0.5)', boxShadow: 'inset 0 4px 10px rgba(255, 255, 255, 0.6), 0 8px 25px rgba(234, 179, 8, 0.9), 0 0 40px rgba(234, 179, 8, 0.6), 0 12px 40px rgba(0, 0, 0, 0.6)' }}
              >
                {loadingInstantRescue ? (
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <LoadingSpinner3D size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs">{t('rescue.processing')}</span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm tracking-wider">1,49 $</span>
                )}
              </Button>

              <p className="text-cyan-100/70 text-[7px] sm:text-[8px] text-center mt-1 sm:mt-1.5 leading-snug font-medium" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)' }}>
                Azonnali jóváírás
              </p>
            </div>
          </div>
        </div>

        {/* Footer with enhanced 3D styling */}
        <div className="relative text-center pt-2 sm:pt-3 border-t-[2px] sm:border-t-[3px] border-yellow-400/40" style={{ boxShadow: '0 -4px 15px rgba(234, 179, 8, 0.3), inset 0 2px 10px rgba(234, 179, 8, 0.2)' }}>
          {/* Footer background layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-600/10 via-transparent to-transparent"></div>
          
          <p className="relative text-yellow-50 text-[9px] sm:text-[10px] mb-1.5 sm:mb-2 leading-snug font-semibold" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9), 0 0 15px rgba(251, 191, 36, 0.3)' }}>
            {t('rescue.continue_message')}
          </p>
          <Button
            onClick={onClose}
            variant="ghost"
            className="relative text-yellow-100 hover:text-yellow-50 hover:bg-white/15 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 font-bold transition-all" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}
          >
            {t('rescue.cancel_button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
