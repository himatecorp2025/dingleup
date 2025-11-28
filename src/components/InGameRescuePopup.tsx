import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { LifeIcon3D } from '@/components/icons/LifeIcon3D';
import { CoinIcon3D } from '@/components/icons/CoinIcon3D';
import { DiamondIcon3D } from '@/components/icons/DiamondIcon3D';
import { GoldRewardCoin3D } from '@/components/icons/GoldRewardCoin3D';
import { LoadingSpinner3D } from '@/components/icons/LoadingSpinner3D';
import { SlotMachine3D } from '@/components/icons/SlotMachine3D';
import { trackConversionEvent } from '@/lib/analytics';
import { useDebounce } from '@/hooks/useDebounce';
import { useMobilePayment } from '@/hooks/useMobilePayment';

interface InGameRescuePopupProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason: 'NO_LIFE' | 'NO_GOLD';
  currentLives: number;
  currentGold: number;
  onStateRefresh: () => Promise<void>;
  onGameEnd?: () => void;
}

export const InGameRescuePopup: React.FC<InGameRescuePopupProps> = ({
  isOpen,
  onClose,
  triggerReason,
  currentLives,
  currentGold,
  onStateRefresh,
  onGameEnd,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loadingGoldSaver, setLoadingGoldSaver] = useState(false);
  const [loadingInstantRescue, setLoadingInstantRescue] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const { startPayment } = useMobilePayment();

  // Track product_view when popup opens
  useEffect(() => {
    const trackProductView = async () => {
      if (isOpen && !hasTrackedView) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await trackConversionEvent(
            session.user.id,
            'product_view',
            'booster_rescue',
            triggerReason,
            { trigger_reason: triggerReason }
          );
          setHasTrackedView(true);
        }
      }
    };
    trackProductView();
  }, [isOpen, hasTrackedView, triggerReason]);

  // Reset tracking flag when popup closes
  useEffect(() => {
    if (!isOpen) {
      setHasTrackedView(false);
    }
  }, [isOpen]);

  const handleGoldSaverPurchaseRaw = async () => {
    if (currentGold < 500) {
      toast.error(t('rescue.insufficient_gold'));
      return;
    }

    setLoadingGoldSaver(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('rescue.not_logged_in'));
        setLoadingGoldSaver(false);
        return;
      }

      // Track add_to_cart
      await trackConversionEvent(
        session.user.id,
        'add_to_cart',
        'booster',
        'GOLD_SAVER',
        { price: 500, currency: 'gold' }
      );
      
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'GOLD_SAVER' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(t('rescue.free_success'));
        await onStateRefresh();
        onClose();
      } else {
        // Sikertelen vásárlás - egységes hibaüzenet
        toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
        onClose();
        if (onGameEnd) onGameEnd();
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Gold Saver purchase error:', error);
      // Sikertelen vásárlás - egységes hibaüzenet
      toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
      onClose();
      if (onGameEnd) onGameEnd();
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } finally {
      setLoadingGoldSaver(false);
    }
  };

  /**
   * INSTANT RESCUE VÁSÁRLÁS - NATÍV MOBILFIZETÉSSEL
   * 
   * Játék közben elérhető fizetős mentés (Apple Pay / Google Pay).
   * Fallback: Stripe kártyás fizetés.
   */
  const handleInstantRescuePurchaseRaw = async () => {
    setLoadingInstantRescue(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('rescue.not_logged_in'));
        setLoadingInstantRescue(false);
        return;
      }

      // Track add_to_cart
      await trackConversionEvent(
        session.user.id,
        'add_to_cart',
        'booster',
        'INSTANT_RESCUE',
        { price: 0, currency: 'real_money' }
      );
      
      // Natív mobilfizetés indítása
      await startPayment({
        productType: 'instant_rescue',
        amount: 149, // $1.49
        currency: 'usd',
        displayName: t('rescue.instant_rescue_title'),
        metadata: { 
          game_session_id: 'GAME_SESSION_ID_HERE' // TODO: Ha van gameSessionId prop, ide kell
        },
        onSuccess: async () => {
          toast.success(t('rescue.premium_success'));
          await onStateRefresh();
          onClose();
        },
        onError: (error) => {
          console.error('Instant Rescue payment error:', error);
          toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
          onClose();
          if (onGameEnd) onGameEnd();
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      });
    } catch (error) {
      console.error('Instant Rescue purchase error:', error);
      toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
      onClose();
      if (onGameEnd) onGameEnd();
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } finally {
      setLoadingInstantRescue(false);
    }
  };

  // Debounced versions to prevent double-click
  const [handleGoldSaverPurchase, isGoldSaverDebouncing] = useDebounce(handleGoldSaverPurchaseRaw, 500);
  const [handleInstantRescuePurchase, isInstantRescueDebouncing] = useDebounce(handleInstantRescuePurchaseRaw, 500);

  const hasEnoughGold = currentGold >= 500;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[75vw] w-full h-[80vh] sm:h-[75vh] md:h-[70vh] overflow-y-auto bg-gradient-to-br from-red-900/50 via-purple-900/70 to-red-900/50 border-[4px] sm:border-[5px] md:border-[6px] border-yellow-400 p-3 sm:p-4 md:p-5 shadow-2xl rounded-[20px] !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !m-0" style={{ boxShadow: '0 0 50px rgba(250, 204, 21, 0.7), 0 25px 80px rgba(0, 0, 0, 0.8), inset 0 4px 20px rgba(0, 0, 0, 0.5), inset 0 -4px 20px rgba(250, 204, 21, 0.2)' }}>
        {/* Close button - top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-all duration-200 hover:scale-110"
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
        </button>

        {/* Animated background stars */}
        <div className="absolute inset-0 overflow-hidden rounded-[20px] pointer-events-none">
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
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-600/30 via-yellow-500/20 to-transparent rounded-t-[20px]" style={{ boxShadow: 'inset 0 3px 15px rgba(234, 179, 8, 0.4)' }}></div>
          <div className="absolute inset-0 bg-gradient-radial from-yellow-400/10 via-transparent to-transparent rounded-t-[20px]"></div>
          
          <DialogTitle className="relative text-lg sm:text-xl md:text-2xl font-black text-center text-yellow-50 leading-tight tracking-wider" style={{ textShadow: '0 4px 15px rgba(0, 0, 0, 0.9), 0 6px 25px rgba(0, 0, 0, 0.8)', filter: 'drop-shadow(0 6px 15px rgba(0, 0, 0, 0.8))' }}>
            {t('rescue.title')}
          </DialogTitle>
          <p className="relative text-center text-yellow-50 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2" style={{ textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 0 20px rgba(251, 191, 36, 0.4)' }}>
            {t('rescue.last_chance')}
            <DiamondIcon3D size={20} className="drop-shadow-2xl sm:w-6 sm:h-6" />
          </p>
        </DialogHeader>

        {/* Current Status with 3D icons */}
        <div className="relative bg-gradient-to-r from-blue-900/70 via-purple-900/80 to-blue-900/70 border-[3px] sm:border-[4px] border-blue-400/60 rounded-[20px] p-2 sm:p-3 mb-2 sm:mb-3 mt-4 sm:mt-6 shadow-xl" style={{ boxShadow: 'inset 0 5px 20px rgba(0, 0, 0, 0.6), inset 0 -3px 15px rgba(59, 130, 246, 0.3), 0 8px 30px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3), 0 15px 50px rgba(0, 0, 0, 0.8)' }}>
          {/* Multi-layer glow effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 rounded-[20px] pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-600/10 to-blue-600/10 rounded-[20px] pointer-events-none"></div>
          
          <div className="relative grid grid-cols-2 gap-4">
            {/* Life indicator */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/30 rounded-full blur-md"></div>
                <LifeIcon3D size={32} className="relative drop-shadow-2xl sm:w-10 sm:h-10" />
              </div>
              <div className="flex flex-col items-center text-center">
                <p className="text-blue-100 text-[10px] sm:text-xs font-bold tracking-wide" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>{t('rescue.life_label')}</p>
                <p className="text-white font-black text-xl sm:text-2xl" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(59, 130, 246, 0.5)' }}>{currentLives}</p>
              </div>
            </div>
            
            {/* Gold indicator */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/30 rounded-full blur-md"></div>
                <CoinIcon3D size={32} className="relative drop-shadow-2xl sm:w-10 sm:h-10" />
              </div>
              <div className="flex flex-col items-center text-center">
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
            <div className="relative bg-gradient-to-br from-blue-800 via-blue-700 to-purple-800 border-[4px] sm:border-[5px] md:border-[6px] border-yellow-300 rounded-[20px] p-2 sm:p-3 shadow-2xl flex-1 flex flex-col min-h-[260px] sm:min_h-[280px] md:min_h-[300px]" style={{ boxShadow: 'inset 0 6px 25px rgba(0, 0, 0, 0.6), inset 0 -6px 25px rgba(234, 179, 8, 0.4)' }}>
              {/* Inner highlight layer */}
              <div className="absolute inset-[5px] sm:inset-[6px] rounded-[20px] sm:rounded-[20px] bg-gradient-to-br from-blue-600/20 via-transparent to-purple-700/20 pointer-events-none"></div>
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-t from-transparent via-yellow-400/5 to-yellow-300/10 pointer-events-none"></div>
              {/* Large coin icon at top */}
              <div className="flex justify-center -mt-6 sm:-mt-8 mb-auto">
                <div className="relative">
                  {/* Vivid 3D circle with inner shading only */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-700 flex items-center justify-center" style={{ boxShadow: 'inset 0 -14px 40px rgba(0, 0, 0, 0.75), inset 0 14px 40px rgba(255, 255, 255, 0.9), inset 0 0 30px rgba(255, 255, 255, 0.7)' }}>
                    <GoldRewardCoin3D size={44} className="drop-shadow-2xl relative z-10 sm:w-14 sm:h-14" />
                  </div>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-center bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-100 bg-clip-text text-transparent mb-0.5 sm:mb-1 leading-tight tracking-wider">
                {t('rescue.gold_saver_title_line1')}<br />{t('rescue.gold_saver_title_line2')}
              </h3>

              <p className="text-blue-50 text-[9px] sm:text-[10px] text-center mb-3 sm:mb-4 font-semibold leading-snug px-1" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)' }}>
                {t('rescue.gold_saver_description')}
              </p>

              {/* Enhanced red highlight bar for rewards */}
              <div className="relative bg-gradient-to-r from-red-800 via-orange-600 to-red-800 border-[2px] sm:border-[3px] border-red-300/80 rounded-[12px] p-1.5 sm:p-2.5 mb-3 sm:mb-4 shadow-xl" style={{ boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 -2px 8px rgba(255, 165, 0, 0.3), 0 6px 20px rgba(239, 68, 68, 0.7), 0 0 30px rgba(239, 68, 68, 0.5), 0 8px 30px rgba(0, 0, 0, 0.6)' }}>
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

              <Button
                onClick={handleGoldSaverPurchase}
                disabled={!hasEnoughGold || loadingGoldSaver}
                className="w-full bg-gradient-to-b from-green-400 via-green-500 to-green-700 hover:from-green-300 hover:via-green-400 hover:to-green-600 text-white font-black text-xs sm:text-sm py-2 sm:py-3 rounded-[12px] disabled:opacity-50 border-[2px] sm:border-[3px] border-green-300 shadow-2xl transition-all" style={{ textShadow: '0 3px 8px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5)', boxShadow: 'inset 0 4px 10px rgba(255, 255, 255, 0.5), 0 8px 25px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.5), 0 12px 40px rgba(0, 0, 0, 0.6)' }}
              >
                {loadingGoldSaver ? (
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <LoadingSpinner3D size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs">{t('rescue.processing')}</span>
                  </div>
                ) : hasEnoughGold ? (
                  <span className="text-sm sm:text-base tracking-wider">500 {t('rescue.currency_gold')}</span>
                ) : (
                  <span className="text-xs sm:text-sm">{t('rescue.not_enough_short')}</span>
                )}
              </Button>

              {!hasEnoughGold && (
                <p className="text-yellow-200 text-[8px] sm:text-[9px] text-center mt-1 sm:mt-1.5 font-bold leading-snug" style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>
                  {t('rescue.not_enough_warning')}
                </p>
              )}
            </div>
          </div>

          {/* Instant Rescue Booster - Premium Enhanced 3D */}
          <div className="relative flex flex-col h-full">
            
            {/* Main card with multiple depth layers */}
            <div className="relative bg-gradient-to-br from-purple-800 via-pink-700 to-purple-800 border-[4px] sm:border-[5px] md:border-[6px] border-cyan-300 rounded-[20px] p-2 sm:p-3 shadow-2xl flex-1 flex flex-col min-h-[260px] sm:min-h-[280px] md:min-h-[300px]" style={{ boxShadow: 'inset 0 6px 25px rgba(0, 0, 0, 0.6), inset 0 -6px 25px rgba(6, 182, 212, 0.4)' }}>
              {/* Inner highlight layer */}
              <div className="absolute inset-[5px] sm:inset-[6px] rounded-[20px] sm:rounded-[20px] bg-gradient-to-br from-purple-600/20 via-transparent to-pink-700/20 pointer-events-none"></div>
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-t from-transparent via-cyan-400/5 to-blue-300/10 pointer-events-none"></div>
              {/* Large diamond icon at top */}
              <div className="flex justify-center -mt-6 sm:-mt-8 mb-auto">
                <div className="relative">
                  {/* Vivid 3D circle with inner shading only */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-700 flex items-center justify-center" style={{ boxShadow: 'inset 0 -14px 40px rgba(0, 0, 0, 0.75), inset 0 14px 40px rgba(255, 255, 255, 0.9), inset 0 0 30px rgba(255, 255, 255, 0.7)' }}>
                    <DiamondIcon3D size={88} className="drop-shadow-2xl relative z-10 sm:w-28 sm:h-28" />
                  </div>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-center bg-gradient-to-r from-cyan-100 via-blue-50 to-cyan-100 bg-clip-text text-transparent mb-0.5 sm:mb-1 leading-tight tracking-wider">
                {t('rescue.instant_rescue_title_line1')}<br />{t('rescue.instant_rescue_title_line2')}
              </h3>

              <p className="text-cyan-50 text-[9px] sm:text-[10px] text-center mb-3 sm:mb-4 font-semibold leading-snug px-1" style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)' }}>
                {t('rescue.instant_rescue_description')}
              </p>

              {/* Enhanced red highlight bar for rewards */}
              <div className="relative bg-gradient-to-r from-red-800 via-orange-600 to-red-800 border-[2px] sm:border-[3px] border-red-300/80 rounded-[12px] p-1.5 sm:p-2.5 mb-3 sm:mb-4 shadow-xl" style={{ boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 -2px 8px rgba(255, 165, 0, 0.3), 0 6px 20px rgba(239, 68, 68, 0.7), 0 0 30px rgba(239, 68, 68, 0.5), 0 8px 30px rgba(0, 0, 0, 0.6)' }}>
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

              <Button
                onClick={handleInstantRescuePurchase}
                disabled={loadingInstantRescue}
                className="w-full bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 hover:from-yellow-200 hover:via-yellow-300 hover:to-yellow-500 text-black font-black text-xs sm:text-sm py-2 sm:py-3 rounded-[12px] border-[2px] sm:border-[3px] border-yellow-200 shadow-2xl transition-all animate-[pulse-grow_0.8s_ease-in-out_infinite]" style={{ textShadow: '0 1px 3px rgba(255, 255, 255, 0.5)', boxShadow: 'inset 0 4px 10px rgba(255, 255, 255, 0.6), 0 8px 25px rgba(234, 179, 8, 0.9), 0 0 40px rgba(234, 179, 8, 0.6), 0 12px 40px rgba(0, 0, 0, 0.6)' }}
              >
                {loadingInstantRescue ? (
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <LoadingSpinner3D size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs">{t('rescue.processing')}</span>
                  </div>
                ) : (
                  <span className="text-base sm:text-xl tracking-wider">{t('rescue.only_price_prefix')} $1.49</span>
                )}
              </Button>

              <p className="text-cyan-100/70 text-[8px] sm:text-[9px] text-center mt-1 sm:mt-1.5 leading-snug font-bold" style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)' }}>
                {t('rescue.instant_credit')}
              </p>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
