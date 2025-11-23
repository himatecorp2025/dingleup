import { useState } from 'react';
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full h-[60vh] overflow-y-auto bg-gradient-to-br from-red-900/50 via-purple-900/70 to-red-900/50 border-[4px] border-yellow-400 p-4 shadow-2xl rounded-2xl !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !m-0" style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.5), 0 20px 60px rgba(0, 0, 0, 0.7), inset 0 2px 10px rgba(0, 0, 0, 0.4)' }}>
        {/* Header with enhanced 3D styling */}
        <DialogHeader className="space-y-1 mb-3">
          <DialogTitle className="text-2xl font-black text-center bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent leading-tight tracking-wider" style={{ textShadow: '0 3px 12px rgba(234, 179, 8, 0.8), 0 6px 24px rgba(234, 179, 8, 0.5), 0 0 30px rgba(234, 179, 8, 0.6)', filter: 'drop-shadow(0 4px 10px rgba(234, 179, 8, 0.4))' }}>
            {t('rescue.title')}
          </DialogTitle>
          <p className="text-center text-yellow-50 text-sm font-bold" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(251, 191, 36, 0.3)' }}>
            {t('rescue.subtitle')}
          </p>
        </DialogHeader>

        {/* Current Status with 3D icons */}
        <div className="relative bg-gradient-to-r from-blue-900/70 via-purple-900/80 to-blue-900/70 border-[3px] border-blue-400/60 rounded-xl p-3 mb-3 shadow-xl" style={{ boxShadow: 'inset 0 3px 12px rgba(0, 0, 0, 0.4), 0 6px 20px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)' }}>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 rounded-xl pointer-events-none"></div>
          
          <div className="relative flex items-center justify-around">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 rounded-full blur-md"></div>
                <LifeIcon3D size={40} className="relative drop-shadow-2xl" />
              </div>
              <div>
                <p className="text-blue-100 text-xs font-bold tracking-wide" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>{t('rescue.life_label')}</p>
                <p className="text-white font-black text-2xl" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(59, 130, 246, 0.5)' }}>{currentLives}</p>
              </div>
            </div>
            
            <div className="h-10 w-[2px] bg-gradient-to-b from-transparent via-blue-300/40 to-transparent"></div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/30 rounded-full blur-md"></div>
                <CoinIcon3D size={40} className="relative drop-shadow-2xl" />
              </div>
              <div>
                <p className="text-yellow-100 text-xs font-bold tracking-wide" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>{t('rescue.gold_label')}</p>
                <p className="text-white font-black text-2xl" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(234, 179, 8, 0.5)' }}>{currentGold}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booster Options - Enhanced 3D styling */}
        <div className="grid grid-cols-2 gap-3 mb-3 items-stretch">
          {/* Gold Saver Booster - Enhanced 3D */}
          <div className="relative flex flex-col h-full">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/50 to-orange-500/50 rounded-2xl blur-lg"></div>
            
            <div className="relative bg-gradient-to-br from-blue-800 via-blue-700 to-purple-800 border-[4px] border-yellow-300 rounded-2xl p-3 shadow-2xl flex-1 flex flex-col" style={{ boxShadow: 'inset 0 3px 15px rgba(0, 0, 0, 0.4), 0 8px 30px rgba(234, 179, 8, 0.5), 0 0 40px rgba(234, 179, 8, 0.3)' }}>
              {/* Large coin icon at top with enhanced glow */}
              <div className="flex justify-center -mt-8 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400/50 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-600 flex items-center justify-center" style={{ boxShadow: '0 12px 30px rgba(202, 138, 4, 0.7), inset 0 -4px 12px rgba(0, 0, 0, 0.4), inset 0 4px 12px rgba(255, 255, 255, 0.5)' }}>
                    <CoinIcon3D size={56} className="drop-shadow-2xl" />
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-black text-center bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-100 bg-clip-text text-transparent mb-1.5 leading-tight tracking-wider" style={{ textShadow: '0 2px 10px rgba(234, 179, 8, 0.8)' }}>
                Gold Saver
              </h3>

              <p className="text-blue-50 text-[10px] text-center mb-2.5 font-semibold leading-snug px-1" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>
                {t('rescue.gold_saver_description')}
              </p>

              {/* Enhanced red highlight bar for rewards */}
              <div className="relative bg-gradient-to-r from-red-700 via-orange-600 to-red-700 border-[2px] border-red-400/60 rounded-xl p-2 mb-2.5 shadow-xl" style={{ boxShadow: 'inset 0 3px 8px rgba(0, 0, 0, 0.4), 0 4px 15px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)' }}>
                <div className="flex items-center justify-center gap-2.5">
                  <span className="text-yellow-50 text-xs font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)' }}>{t('rescue.gold_saver_reward_gold')}</span>
                  <span className="text-green-50 text-xs font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)' }}>{t('rescue.gold_saver_reward_lives')}</span>
                </div>
              </div>

              <div className="flex-1"></div>

              {!hasEnoughGold && (
                <p className="text-yellow-200 text-[9px] text-center mb-2 font-bold" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>
                  {t('rescue.not_enough_warning')}
                </p>
              )}

              <Button
                onClick={handleGoldSaverPurchase}
                disabled={!hasEnoughGold || loadingGoldSaver}
                className="w-full bg-gradient-to-b from-green-400 via-green-500 to-green-700 hover:from-green-300 hover:via-green-400 hover:to-green-600 text-white font-black text-sm py-3 rounded-xl disabled:opacity-50 border-[3px] border-green-300 shadow-2xl transition-all" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.6)', boxShadow: 'inset 0 3px 6px rgba(255, 255, 255, 0.4), 0 6px 20px rgba(34, 197, 94, 0.7), 0 0 30px rgba(34, 197, 94, 0.4)' }}
              >
                {loadingGoldSaver ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    <span className="text-xs">{t('rescue.processing')}</span>
                  </>
                ) : hasEnoughGold ? (
                  <span className="text-sm tracking-wider">500 ARANY</span>
                ) : (
                  <span className="text-xs">{t('rescue.not_enough_short')}</span>
                )}
              </Button>
            </div>
          </div>

          {/* Instant Rescue Booster - Premium Enhanced 3D */}
          <div className="relative flex flex-col h-full">
            {/* Outer animated glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/60 to-purple-500/60 rounded-2xl blur-lg animate-pulse"></div>
            
            <div className="relative bg-gradient-to-br from-purple-800 via-pink-700 to-purple-800 border-[4px] border-pink-300 rounded-2xl p-3 shadow-2xl flex-1 flex flex-col" style={{ boxShadow: 'inset 0 3px 15px rgba(0, 0, 0, 0.4), 0 8px 30px rgba(236, 72, 153, 0.6), 0 0 40px rgba(236, 72, 153, 0.4)' }}>
              {/* Large diamond icon at top with enhanced glow */}
              <div className="flex justify-center -mt-8 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-400/60 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-200 via-pink-300 to-pink-600 flex items-center justify-center" style={{ boxShadow: '0 12px 30px rgba(219, 39, 119, 0.8), inset 0 -4px 12px rgba(0, 0, 0, 0.4), inset 0 4px 12px rgba(255, 255, 255, 0.5)' }}>
                    <DiamondIcon3D size={56} className="drop-shadow-2xl" />
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-black text-center bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100 bg-clip-text text-transparent mb-1.5 leading-tight tracking-wider" style={{ textShadow: '0 2px 10px rgba(236, 72, 153, 0.8)' }}>
                Instant Rescue
              </h3>

              <p className="text-pink-50 text-[10px] text-center mb-2.5 font-semibold leading-snug px-1" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>
                {t('rescue.instant_rescue_description')}
              </p>

              {/* Enhanced red highlight bar for rewards */}
              <div className="relative bg-gradient-to-r from-red-700 via-orange-600 to-red-700 border-[2px] border-red-400/60 rounded-xl p-2 mb-2.5 shadow-xl" style={{ boxShadow: 'inset 0 3px 8px rgba(0, 0, 0, 0.4), 0 4px 15px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)' }}>
                <div className="flex items-center justify-center gap-2.5">
                  <span className="text-yellow-50 text-xs font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)' }}>{t('rescue.instant_rescue_reward_gold')}</span>
                  <span className="text-green-50 text-xs font-black" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)' }}>{t('rescue.instant_rescue_reward_lives')}</span>
                </div>
              </div>

              <div className="flex-1"></div>

              <Button
                onClick={handleInstantRescuePurchase}
                disabled={loadingInstantRescue}
                className="w-full bg-gradient-to-b from-green-400 via-green-500 to-green-700 hover:from-green-300 hover:via-green-400 hover:to-green-600 text-white font-black text-sm py-3 rounded-xl border-[3px] border-green-300 shadow-2xl transition-all" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.6)', boxShadow: 'inset 0 3px 6px rgba(255, 255, 255, 0.4), 0 6px 20px rgba(34, 197, 94, 0.7), 0 0 30px rgba(34, 197, 94, 0.4)' }}
              >
                {loadingInstantRescue ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    <span className="text-xs">{t('rescue.processing')}</span>
                  </>
                ) : (
                  <span className="text-sm tracking-wider">1,49 $</span>
                )}
              </Button>

              <p className="text-pink-100/70 text-[8px] text-center mt-1.5 leading-snug font-medium" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)' }}>
                {t('rescue.instant_credit')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer with enhanced styling */}
        <div className="text-center pt-2 border-t-2 border-yellow-400/30" style={{ boxShadow: '0 -2px 10px rgba(234, 179, 8, 0.2)' }}>
          <p className="text-yellow-50 text-[10px] mb-2 leading-snug font-semibold" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>
            {t('rescue.continue_message')}
          </p>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-yellow-100 hover:text-yellow-50 hover:bg-white/15 text-sm h-9 px-4 font-bold transition-all" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}
          >
            {t('rescue.cancel_button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
