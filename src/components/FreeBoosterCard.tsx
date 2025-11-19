import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Heart, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface FreeBoosterCardProps {
  currentGold: number;
  pendingSpeedTokensCount: number;
  onPurchaseSuccess: () => void;
  onActivateSuccess: () => void;
}

export function FreeBoosterCard({ currentGold, pendingSpeedTokensCount, onPurchaseSuccess, onActivateSuccess }: FreeBoosterCardProps) {
  const [purchasing, setPurchasing] = useState(false);
  const [activating, setActivating] = useState(false);

  const handlePurchase = async () => {
    if (currentGold < 900) {
      toast.error('Nincs elég aranyad a Free Booster megvásárlásához');
      return;
    }

    setPurchasing(true);
    try {
      toast.loading('Free Booster vásárlás...', { id: 'free-booster' });
      
      const { data, error } = await supabase.functions.invoke('purchase-booster', {
        body: { boosterCode: 'FREE' }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Sikeres Free Booster vásárlás! +${data.grantedRewards?.gold} arany, +${data.grantedRewards?.lives} élet és ${data.grantedRewards?.speedCount}× ${data.grantedRewards?.speedDurationMinutes} perces Speed Booster jóváírva.`, { 
          id: 'free-booster',
          duration: 6000 
        });
        onPurchaseSuccess();
      } else {
        throw new Error(data?.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      console.error('Free booster purchase error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Hiba történt a vásárlás során';
      toast.error(errorMsg, { id: 'free-booster' });
    } finally {
      setPurchasing(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      toast.loading('Speed Booster aktiválás...', { id: 'speed-activate' });
      
      const { data, error } = await supabase.functions.invoke('activate-speed-token');

      if (error) throw error;

      if (data?.success) {
        toast.success(`Speed Booster aktiválva! ${data.activeSpeedToken?.durationMinutes} perc gyorsított életregenerálás.`, { 
          id: 'speed-activate',
          duration: 4000 
        });
        onActivateSuccess();
      } else {
        throw new Error(data?.error || 'Aktiválási hiba');
      }
    } catch (error) {
      console.error('Speed token activation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Hiba történt az aktiválás során';
      toast.error(errorMsg, { id: 'speed-activate' });
    } finally {
      setActivating(false);
    }
  };

  const canAfford = currentGold >= 900;
  const hasPendingTokens = pendingSpeedTokensCount > 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-2 border-yellow-500/30 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-yellow-400">Free Booster (aranyért)</h3>
        </div>
        
        <p className="text-sm text-gray-300 leading-relaxed">
          900 aranyért Free Boostert vásárolhatsz, amely +300 aranyat, +15 életet és 4× 30 perces Speed Boostert ad.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-black/30 p-3 rounded-lg border border-yellow-500/20 text-center">
            <Coins className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Arany</p>
            <p className="text-lg font-bold text-yellow-400">+300</p>
          </div>
          <div className="bg-black/30 p-3 rounded-lg border border-red-500/20 text-center">
            <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Élet</p>
            <p className="text-lg font-bold text-red-400">+15</p>
          </div>
          <div className="bg-black/30 p-3 rounded-lg border border-blue-500/20 text-center">
            <Zap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Speed</p>
            <p className="text-lg font-bold text-blue-400">4× 30'</p>
          </div>
        </div>

        <div className="pt-2">
          {hasPendingTokens ? (
            <Button
              onClick={handleActivate}
              disabled={activating}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold"
            >
              {activating ? 'Aktiválás...' : `Aktiválom (${pendingSpeedTokensCount} token)`}
            </Button>
          ) : (
            <>
              <Button
                onClick={handlePurchase}
                disabled={!canAfford || purchasing}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold disabled:opacity-50"
              >
                {!canAfford ? 'Nincs elég aranyad' : purchasing ? 'Vásárlás...' : 'Megveszem 900 aranyért'}
              </Button>
              {!canAfford && (
                <p className="text-xs text-red-400 mt-2 text-center">
                  Még {900 - currentGold} arany szükséges a vásárláshoz
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
