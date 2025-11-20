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
      <DialogContent className="max-w-[90vw] w-full max-h-[70vh] overflow-y-auto bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] border-2 border-purple-500/30 p-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-center bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-1">
            Majdnem kiestél… megmentsük a játékodat? 😈
          </DialogTitle>
          <p className="text-center text-white/80 text-xs mb-3">
            Az életed vagy az aranyad elfogyott. Válassz egy mentőcsomagot, és ott folytathatod, ahol abbahagytad!
          </p>
        </DialogHeader>

        {/* Current Status Card - Compact */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-3 mb-3">
          <h3 className="text-white font-bold text-sm mb-2">Jelenlegi állapotod</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💚</span>
              <div>
                <p className="text-white/60 text-xs">Élet</p>
                <p className="text-white font-bold text-lg">{currentLives}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <div>
                <p className="text-white/60 text-xs">Arany</p>
                <p className="text-white font-bold text-lg">{currentGold}</p>
              </div>
            </div>
          </div>
          <p className="text-white/40 text-[10px] mt-1">Az értékek valós időben frissülnek a fiókodban.</p>
        </div>

        {/* Booster Cards Grid - Compact */}
        <div className="grid grid-cols-1 gap-3 mb-3">
          {/* Gold Saver Booster */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl p-4 hover:scale-[1.02] transition-transform duration-300 shadow-xl hover:shadow-yellow-500/30">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🟡</span>
              <div className="flex-1">
                <h3 className="text-lg font-black text-yellow-300 mb-0.5">Gold Saver Booster</h3>
                <p className="text-white/80 text-xs">
                  Kicsi áldozat, nagy mentés: elköltesz 500 aranyat, de azonnal visszakapsz 250 aranyat és +15 életet.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="flex flex-col items-center bg-black/30 rounded-lg p-2">
                <span className="text-green-400 text-xs">✓</span>
                <span className="text-white text-xs font-bold">+250</span>
                <span className="text-white/60 text-[10px]">arany</span>
              </div>
              <div className="flex flex-col items-center bg-black/30 rounded-lg p-2">
                <span className="text-green-400 text-xs">✓</span>
                <span className="text-white text-xs font-bold">+15</span>
                <span className="text-white/60 text-[10px]">élet</span>
              </div>
              <div className="flex flex-col items-center bg-black/30 rounded-lg p-2">
                <span className="text-red-400 text-xs">❌</span>
                <span className="text-white/60 text-[10px]">Nincs</span>
                <span className="text-white/60 text-[10px]">Speed</span>
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-2 mb-2">
              <p className="text-yellow-300 font-bold text-center text-base">💸 500 arany</p>
            </div>

            {!hasEnoughGold && (
              <p className="text-red-400 text-[10px] text-center mb-2">
                Nincs elég aranyad ehhez a boosterhez. Próbáld ki az Instant Rescue Booster-t!
              </p>
            )}

            <Button
              onClick={handleGoldSaverPurchase}
              disabled={!hasEnoughGold || loadingGoldSaver}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-500/50 transition-all"
            >
              {loadingGoldSaver ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
          <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border-2 border-red-500/50 rounded-2xl p-4 hover:scale-[1.02] transition-transform duration-300 shadow-xl hover:shadow-red-500/30 animate-pulse-slow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔴</span>
              <div className="flex-1">
                <h3 className="text-lg font-black text-red-300 mb-0.5">Instant Rescue Booster</h3>
                <p className="text-white/80 text-xs">
                  Nem akarod itt elveszíteni ezt a kört? Egy apró összegért azonnal visszahozzuk a játékod.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="flex flex-col items-center bg-black/30 rounded-lg p-2">
                <span className="text-green-400 text-xs">✓</span>
                <span className="text-white text-xs font-bold">+1000</span>
                <span className="text-white/60 text-[10px]">arany</span>
              </div>
              <div className="flex flex-col items-center bg-black/30 rounded-lg p-2">
                <span className="text-green-400 text-xs">✓</span>
                <span className="text-white text-xs font-bold">+25</span>
                <span className="text-white/60 text-[10px]">élet</span>
              </div>
              <div className="flex flex-col items-center bg-black/30 rounded-lg p-2">
                <span className="text-red-400 text-xs">❌</span>
                <span className="text-white/60 text-[10px]">Nincs</span>
                <span className="text-white/60 text-[10px]">Speed</span>
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-2 mb-2">
              <p className="text-red-300 font-bold text-center text-base">💳 1,49 $</p>
            </div>

            <Button
              onClick={handleInstantRescuePurchase}
              disabled={loadingInstantRescue}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white font-bold text-sm py-3 rounded-xl shadow-lg hover:shadow-red-500/50 transition-all mb-2"
            >
              {loadingInstantRescue ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Feldolgozás...
                </>
              ) : (
                'Megmentem a játékot – 1,49 $'
              )}
            </Button>

            <p className="text-white/40 text-[9px] text-center leading-tight">
              A vásárlás digitális szolgáltatásnak minősül.
              A jutalmakat azonnal jóváírjuk a fiókodon, ezért a 14 napos elállási jog nem gyakorolható.
            </p>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="text-center space-y-2">
          <p className="text-white/70 text-xs">
            A játékod nem szakad meg – a mentőcsomag után pontosan ott folytatod, ahol abbahagytad.
          </p>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white/50 hover:text-white/80 hover:bg-white/5 text-xs py-2"
          >
            Most inkább kihagyom
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
