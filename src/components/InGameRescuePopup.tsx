import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';

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
      toast.error(t('rescue.not_enough_gold'));
      return;
    }

    setLoadingGoldSaver(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('auth.login.not_logged_in'));
        setLoadingGoldSaver(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'GOLD_SAVER' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(t('rescue.gold_saver_success'));
        await onStateRefresh();
        onClose();
      } else {
        toast.error(data?.error || t('rescue.purchase_failed'));
      }
    } catch (error) {
      console.error('Gold Saver purchase error:', error);
      toast.error(t('rescue.purchase_error'));
    } finally {
      setLoadingGoldSaver(false);
    }
  };

  const handleInstantRescuePurchase = async () => {
    setLoadingInstantRescue(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('auth.login.not_logged_in'));
        setLoadingInstantRescue(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'INSTANT_RESCUE' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(t('rescue.instant_rescue_success'));
        await onStateRefresh();
        onClose();
      } else {
        if (data?.error === 'PAYMENT_FAILED') {
          toast.error(t('rescue.payment_failed'));
        } else {
          toast.error(data?.error || t('rescue.purchase_failed'));
        }
      }
    } catch (error) {
      console.error('Instant Rescue purchase error:', error);
      toast.error(t('rescue.purchase_error'));
    } finally {
      setLoadingInstantRescue(false);
    }
  };

  const hasEnoughGold = currentGold >= 500;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full h-[50vh] overflow-y-auto bg-gradient-to-br from-red-900/40 via-purple-900/60 to-red-900/40 border-[3px] border-yellow-500/80 p-3 shadow-2xl shadow-yellow-500/50 rounded-xl !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !m-0">
        {/* Header */}
        <DialogHeader className="space-y-0.5 mb-2">
          <DialogTitle className="text-xl font-black text-center bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(234,179,8,0.8)] leading-tight tracking-wide" style={{ textShadow: '0 2px 10px rgba(234,179,8,0.6), 0 0 20px rgba(234,179,8,0.4)' }}>
            {t('rescue.title')}
          </DialogTitle>
          <p className="text-center text-yellow-100 text-xs font-bold drop-shadow-lg">
            {t('rescue.subtitle')}
          </p>
        </DialogHeader>

        {/* Current Status */}
        <div className="bg-gradient-to-r from-blue-900/60 via-purple-900/70 to-blue-900/60 border-2 border-blue-400/50 rounded-lg p-2 mb-2 shadow-lg shadow-blue-500/30" style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(59,130,246,0.3)' }}>
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl drop-shadow-lg">💚</span>
              <div>
                <p className="text-blue-200 text-[9px] font-bold">{t('rescue.lives_label')}</p>
                <p className="text-white font-black text-xl drop-shadow-lg">{currentLives}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-blue-300/30"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl drop-shadow-lg">🪙</span>
              <div>
                <p className="text-yellow-200 text-[9px] font-bold">{t('rescue.gold_label')}</p>
                <p className="text-white font-black text-xl drop-shadow-lg">{currentGold}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booster Options - Side by Side */}
        <div className="grid grid-cols-2 gap-2 mb-2 items-stretch">
          {/* Gold Saver Booster */}
          <div className="relative flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/40 to-orange-600/40 rounded-xl blur-sm"></div>
            <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-purple-700 border-[3px] border-yellow-400 rounded-xl p-2 shadow-xl flex-1 flex flex-col" style={{ boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3), 0 6px 20px rgba(234,179,8,0.4)' }}>
              {/* Large coin icon at top */}
              <div className="flex justify-center -mt-6 mb-1">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-2xl" style={{ boxShadow: '0 8px 20px rgba(202,138,4,0.6), inset 0 -3px 8px rgba(0,0,0,0.3), inset 0 3px 8px rgba(255,255,255,0.4)' }}>
                  <span className="text-3xl drop-shadow-lg">🪙</span>
                </div>
              </div>

              <h3 className="text-xs font-black text-center bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 bg-clip-text text-transparent mb-1 drop-shadow-lg leading-tight tracking-wide">
                {t('rescue.gold_saver_title')}
              </h3>

              <p className="text-blue-100 text-[9px] text-center mb-2 font-semibold leading-tight px-1">
                {t('rescue.gold_saver_description')}
              </p>

              {/* Red highlight bar for rewards */}
              <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 border border-red-400/50 rounded-lg p-1.5 mb-2 shadow-lg" style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3), 0 3px 10px rgba(239,68,68,0.4)' }}>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-yellow-100 text-xs font-black drop-shadow-lg">+250🪙</span>
                  <span className="text-green-100 text-xs font-black drop-shadow-lg">+15💚</span>
                </div>
              </div>

              <div className="flex-1"></div>

              {!hasEnoughGold && (
                <p className="text-yellow-300 text-[8px] text-center mb-1.5 font-bold drop-shadow-md">
                  {t('rescue.not_enough_gold_warning')}
                </p>
              )}

              <Button
                onClick={handleGoldSaverPurchase}
                disabled={!hasEnoughGold || loadingGoldSaver}
                className="w-full bg-gradient-to-b from-green-500 via-green-600 to-green-700 hover:from-green-400 hover:via-green-500 hover:to-green-600 text-white font-black text-xs py-2.5 rounded-lg disabled:opacity-50 border-2 border-green-400 shadow-xl transition-all" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 12px rgba(34,197,94,0.6)' }}
              >
                {loadingGoldSaver ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    <span className="text-[9px]">{t('rescue.processing')}</span>
                  </>
                ) : hasEnoughGold ? (
                  <span className="text-xs tracking-wide">{t('rescue.gold_saver_price')}</span>
                ) : (
                  <span className="text-[9px]">{t('rescue.not_enough_button')}</span>
                )}
              </Button>
            </div>
          </div>

          {/* Instant Rescue Booster - Premium */}
          <div className="relative flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/40 to-purple-600/40 rounded-xl blur-sm animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-700 via-pink-600 to-purple-700 border-[3px] border-pink-400 rounded-xl p-2 shadow-xl flex-1 flex flex-col" style={{ boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3), 0 6px 20px rgba(236,72,153,0.5)' }}>
              {/* Large diamond icon at top */}
              <div className="flex justify-center -mt-6 mb-1">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-300 via-pink-400 to-red-600 flex items-center justify-center shadow-2xl animate-pulse" style={{ boxShadow: '0 8px 20px rgba(219,39,119,0.7), inset 0 -3px 8px rgba(0,0,0,0.3), inset 0 3px 8px rgba(255,255,255,0.4)' }}>
                  <span className="text-3xl drop-shadow-lg">💎</span>
                </div>
              </div>

              <h3 className="text-xs font-black text-center bg-gradient-to-r from-pink-200 via-pink-100 to-pink-200 bg-clip-text text-transparent mb-1 drop-shadow-lg leading-tight tracking-wide">
                {t('rescue.instant_rescue_title')}
              </h3>

              <p className="text-pink-100 text-[9px] text-center mb-2 font-semibold leading-tight px-1">
                {t('rescue.instant_rescue_description')}
              </p>

              {/* Red highlight bar for rewards */}
              <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 border border-red-400/50 rounded-lg p-1.5 mb-2 shadow-lg" style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3), 0 3px 10px rgba(239,68,68,0.4)' }}>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-yellow-100 text-xs font-black drop-shadow-lg">+1000🪙</span>
                  <span className="text-green-100 text-xs font-black drop-shadow-lg">+25💚</span>
                </div>
              </div>

              <div className="flex-1"></div>

              <Button
                onClick={handleInstantRescuePurchase}
                disabled={loadingInstantRescue}
                className="w-full bg-gradient-to-b from-green-500 via-green-600 to-green-700 hover:from-green-400 hover:via-green-500 hover:to-green-600 text-white font-black text-xs py-2.5 rounded-lg border-2 border-green-400 shadow-xl transition-all" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 12px rgba(34,197,94,0.6)' }}
              >
                {loadingInstantRescue ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    <span className="text-[9px]">{t('rescue.processing')}</span>
                  </>
                ) : (
                  <span className="text-xs tracking-wide">{t('rescue.instant_rescue_price')}</span>
                )}
              </Button>

              <p className="text-pink-200/60 text-[7px] text-center mt-1 leading-tight font-medium">
                {t('rescue.instant_credit')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-1.5 border-t border-yellow-500/20">
          <p className="text-yellow-100/80 text-[9px] mb-1 leading-snug font-semibold drop-shadow-md">
            {t('rescue.continue_message')}
          </p>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-yellow-200/70 hover:text-yellow-100 hover:bg-white/10 text-xs h-7 px-3 font-bold"
          >
            {t('rescue.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
