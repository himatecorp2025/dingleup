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
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'GOLD_SAVER' },
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
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'INSTANT_RESCUE' },
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] border-2 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-center bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Majdnem kiestél… megmentsük a játékodat? 😈
          </DialogTitle>
          <p className="text-center text-white/80 text-base mb-6">
            Az életed vagy az aranyad elfogyott. Válassz egy mentőcsomagot, és ott folytathatod, ahol abbahagytad!
          </p>
        </DialogHeader>

        {/* Current Status Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 mb-6">
          <h3 className="text-white font-bold text-lg mb-3">Jelenlegi állapotod</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💚</span>
              <div>
                <p className="text-white/60 text-sm">Élet</p>
                <p className="text-white font-bold text-xl">{currentLives}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <div>
                <p className="text-white/60 text-sm">Arany</p>
                <p className="text-white font-bold text-xl">{currentGold}</p>
              </div>
            </div>
          </div>
          <p className="text-white/40 text-xs mt-2">Az értékek valós időben frissülnek a fiókodban.</p>
        </div>

        {/* Booster Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Gold Saver Booster */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-3xl p-6 hover:scale-[1.02] transition-transform duration-300 shadow-2xl hover:shadow-yellow-500/30">
            <div className="text-center mb-4">
              <span className="text-5xl mb-2 block">🟡</span>
              <h3 className="text-2xl font-black text-yellow-300 mb-2">Gold Saver Booster</h3>
              <p className="text-white/80 text-sm mb-4">
                Kicsi áldozat, nagy mentés: elköltesz 500 aranyat, de azonnal visszakapsz 250 aranyat és +15 életet.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-green-400">✓</span>
                <span>+250 arany</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-green-400">✓</span>
                <span>+15 élet</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <span className="text-red-400">❌</span>
                <span>Nincs Speed – csak azonnali mentés</span>
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-3 mb-4">
              <p className="text-yellow-300 font-bold text-center text-xl">💸 500 arany</p>
            </div>

            {!hasEnoughGold && (
              <p className="text-red-400 text-xs text-center mb-3">
                Nincs elég aranyad ehhez a boosterhez. Próbáld ki az Instant Rescue Booster-t!
              </p>
            )}

            <Button
              onClick={handleGoldSaverPurchase}
              disabled={!hasEnoughGold || loadingGoldSaver}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-lg py-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-500/50 transition-all"
            >
              {loadingGoldSaver ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Feldolgozás...
                </>
              ) : hasEnoughGold ? (
                'Megmentem arannyal (500)'
              ) : (
                'Nincs elég aranyam'
              )}
            </Button>
          </div>

          {/* Instant Rescue Booster */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border-2 border-red-500/50 rounded-3xl p-6 hover:scale-[1.02] transition-transform duration-300 shadow-2xl hover:shadow-red-500/30 animate-pulse-slow">
            <div className="text-center mb-4">
              <span className="text-5xl mb-2 block">🔴</span>
              <h3 className="text-2xl font-black text-red-300 mb-2">Instant Rescue Booster</h3>
              <p className="text-white/80 text-sm mb-4">
                Nem akarod itt elveszíteni ezt a kört? Egy apró összegért azonnal visszahozzuk a játékod.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-green-400">✓</span>
                <span>+1000 arany</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-green-400">✓</span>
                <span>+25 élet</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <span className="text-red-400">❌</span>
                <span>Nincs Speed – tiszta, azonnali mentés</span>
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-3 mb-4">
              <p className="text-red-300 font-bold text-center text-xl">💳 1,49 $</p>
            </div>

            <Button
              onClick={handleInstantRescuePurchase}
              disabled={loadingInstantRescue}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white font-bold text-lg py-6 rounded-2xl shadow-lg hover:shadow-red-500/50 transition-all"
            >
              {loadingInstantRescue ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Feldolgozás...
                </>
              ) : (
                'Megmentem a játékot – 1,49 $'
              )}
            </Button>

            <p className="text-white/40 text-[10px] text-center mt-3 leading-tight">
              A vásárlás digitális szolgáltatásnak minősül.
              A jutalmakat azonnal jóváírjuk a fiókodon, ezért a 14 napos elállási jog nem gyakorolható.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-white/70 text-sm">
            A játékod nem szakad meg – a mentőcsomag után pontosan ott folytatod, ahol abbahagytad.
          </p>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white/50 hover:text-white/80 hover:bg-white/5"
          >
            Most inkább kihagyom
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
