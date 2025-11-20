import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [loadingGoldSaver, setLoadingGoldSaver] = useState(false);
  const [loadingInstantRescue, setLoadingInstantRescue] = useState(false);

  const handleGoldSaverPurchase = async () => {
    if (currentGold < 500) {
      toast.error('⚠️ Nincs elég aranyad a Gold Saver Boosterhez.');
      return;
    }

    setLoadingGoldSaver(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nem vagy bejelentkezve');
        setLoadingGoldSaver(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'GOLD_SAVER' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('✅ Gold Saver Booster aktiválva!\n+250 aranyat és +15 életet írtunk jóvá. Folytasd a játékot!');
        await onStateRefresh();
        onClose();
      } else {
        toast.error(data?.error || '❌ Nem sikerült a vásárlás');
      }
    } catch (error) {
      console.error('Gold Saver purchase error:', error);
      toast.error('❌ Hiba történt a vásárlás során');
    } finally {
      setLoadingGoldSaver(false);
    }
  };

  const handleInstantRescuePurchase = async () => {
    setLoadingInstantRescue(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nem vagy bejelentkezve');
        setLoadingInstantRescue(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'INSTANT_RESCUE' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('✅ Instant Rescue sikeres!\n+1000 arany és +25 élet jóváírva. A kört azonnal folytathatod.');
        await onStateRefresh();
        onClose();
      } else {
        if (data?.error === 'PAYMENT_FAILED') {
          toast.error('❌ A fizetés nem sikerült. Nem vontunk le összeget, és nem írtunk jóvá jutalmat.');
        } else {
          toast.error(data?.error || '❌ Nem sikerült a vásárlás');
        }
      }
    } catch (error) {
      console.error('Instant Rescue purchase error:', error);
      toast.error('❌ Hiba történt a vásárlás során');
    } finally {
      setLoadingInstantRescue(false);
    }
  };

  const hasEnoughGold = currentGold >= 500;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[75vh] overflow-y-auto bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] border-2 border-gold-500/40 p-5 sm:p-6">
        {/* Header */}
        <DialogHeader className="space-y-2 mb-4">
          <DialogTitle className="text-2xl sm:text-3xl font-black text-center bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg leading-tight">
            Majdnem kiestél... 🎰
          </DialogTitle>
          <p className="text-center text-white/90 text-sm sm:text-base font-medium leading-snug">
            Válassz egy mentőcsomagot!
          </p>
        </DialogHeader>

        {/* Current Status - Minimal & Elegant */}
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-400/30 rounded-xl p-3 mb-4 backdrop-blur-sm">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💚</span>
              <div>
                <p className="text-white/60 text-xs font-medium">Élet</p>
                <p className="text-white font-black text-xl">{currentLives}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <div>
                <p className="text-white/60 text-xs font-medium">Arany</p>
                <p className="text-white font-black text-xl">{currentGold}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booster Options */}
        <div className="space-y-3 mb-4">
          {/* Gold Saver Booster */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all"></div>
            <div className="relative bg-gradient-to-br from-amber-900/60 to-orange-900/40 border-2 border-yellow-500/60 rounded-2xl p-4 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/50">
                  🟡
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-yellow-300 mb-1 leading-tight">Gold Saver Booster</h3>
                  <p className="text-white/80 text-xs leading-snug">
                    500 aranyért visszakapsz 250 aranyat + 15 életet
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 bg-black/30 rounded-lg p-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-white text-sm font-bold">+250 🪙</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-white text-sm font-bold">+15 💚</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-red-400 text-sm">✗</span>
                  <span className="text-white/60 text-xs">Speed</span>
                </div>
              </div>

              {!hasEnoughGold && (
                <p className="text-red-400 text-xs text-center mb-2 font-medium">
                  ⚠️ Nincs elég aranyad
                </p>
              )}

              <Button
                onClick={handleGoldSaverPurchase}
                disabled={!hasEnoughGold || loadingGoldSaver}
                className="w-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-400 text-gray-900 font-black text-base py-6 rounded-xl disabled:opacity-50 shadow-xl shadow-yellow-500/30 hover:shadow-yellow-400/50 transition-all border-2 border-yellow-300/50"
              >
                {loadingGoldSaver ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Feldolgozás...
                  </>
                ) : hasEnoughGold ? (
                  '💸 Vásárlás - 500 arany'
                ) : (
                  'Nincs elég aranyam'
                )}
              </Button>
            </div>
          </div>

          {/* Instant Rescue Booster - Premium */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded-2xl blur-md group-hover:blur-lg transition-all animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-red-900/70 to-pink-900/50 border-2 border-red-500/70 rounded-2xl p-4 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-red-500/50 animate-pulse">
                  🔴
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-red-300 mb-1 leading-tight">Instant Rescue 💎</h3>
                  <p className="text-white/80 text-xs leading-snug">
                    Azonnal visszamentsz! +1000 arany + 25 élet
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 bg-black/30 rounded-lg p-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-white text-sm font-bold">+1000 🪙</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-400 text-sm">✓</span>
                  <span className="text-white text-sm font-bold">+25 💚</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-red-400 text-sm">✗</span>
                  <span className="text-white/60 text-xs">Speed</span>
                </div>
              </div>

              <Button
                onClick={handleInstantRescuePurchase}
                disabled={loadingInstantRescue}
                className="w-full bg-gradient-to-r from-red-500 via-pink-500 to-red-500 hover:from-red-400 hover:via-pink-400 hover:to-red-400 text-white font-black text-base py-6 rounded-xl shadow-xl shadow-red-500/40 hover:shadow-red-400/60 transition-all border-2 border-red-300/50"
              >
                {loadingInstantRescue ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Feldolgozás...
                  </>
                ) : (
                  '💳 Megmentem - 1,49 $'
                )}
              </Button>

              <p className="text-white/40 text-[9px] text-center mt-2 leading-tight">
                Digitális szolgáltatás • Azonnali jóváírás • Elállási jog nem gyakorolható
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-white/10">
          <p className="text-white/60 text-xs mb-2 leading-snug">
            Ott folytatod, ahol abbahagytad! 🎮
          </p>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white/50 hover:text-white/80 hover:bg-white/5 text-sm h-9 px-4"
          >
            Mégsem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
