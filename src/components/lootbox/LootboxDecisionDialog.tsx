import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoldLootboxIcon } from './GoldLootboxIcon';
import { useI18n } from '@/i18n';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LootboxDecisionDialogProps {
  open: boolean;
  onClose: () => void;
  lootboxId: string;
  userGold: number;
  storedCount: number;
  onSuccess: (decision: 'open_now' | 'store') => void;
}

export const LootboxDecisionDialog = ({
  open,
  onClose,
  lootboxId,
  userGold,
  storedCount,
  onSuccess
}: LootboxDecisionDialogProps) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const OPEN_COST = 150;
  const MAX_STORED = 10;

  const canOpenNow = userGold >= OPEN_COST;
  const canStore = storedCount < MAX_STORED;

  const handleDecision = async (decision: 'open_now' | 'store') => {
    if (loading) return;

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('errors.not_logged_in'));
        return;
      }

      const { data, error } = await supabase.functions.invoke('lootbox-decide', {
        body: {
          lootboxId,
          decision
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('[LootboxDecision] Error:', error);
        toast.error(t('errors.unknown'));
        return;
      }

      if (data.error === 'NOT_ENOUGH_GOLD') {
        toast.error(t('lootbox.not_enough_gold'));
        return;
      }

      if (data.error === 'STORAGE_FULL') {
        toast.error(t('lootbox.storage_full'));
        return;
      }

      if (decision === 'open_now' && data.rewards) {
        // Show reward animation
        toast.success(
          `${t('lootbox.won')}: +${data.rewards.gold} ${t('common.gold')}, +${data.rewards.life} ${t('common.life')}`,
          {
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
              color: '#000',
              fontSize: '18px',
              fontWeight: 'bold',
              border: '2px solid #d4af37',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.6)',
            },
          }
        );
      } else if (decision === 'store') {
        toast.success(t('lootbox.stored_success'));
      }

      onSuccess(decision);
      onClose();
    } catch (err) {
      console.error('[LootboxDecision] Unexpected error:', err);
      toast.error(t('errors.unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[90vw] sm:max-w-[400px] bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-2 border-yellow-500/60 backdrop-blur-md"
        style={{
          maxHeight: '80vh',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: "0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-yellow-400 font-bold text-xl drop-shadow-[0_2px_8px_rgba(234,179,8,0.6)]">
            {t('lootbox.decision_title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* Lootbox icon with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full" />
            <GoldLootboxIcon size={100} />
          </div>

          {/* Description with matching style */}
          <p className="text-white/90 text-center text-sm px-3 leading-snug">
            {t('lootbox.decision_description')}
          </p>

          {/* Buttons with 3D frame effects matching Gifts page */}
          <div className="flex flex-col gap-3 w-full px-3">
            {/* Store for later */}
            <div className="relative">
              {/* 3D Frame Effects */}
              <div className="absolute rounded-xl bg-black/40 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
              <div className={`absolute inset-0 rounded-xl border-2 shadow-[0_0_20px_rgba(168,85,247,0.4),0_8px_25px_rgba(0,0,0,0.5)] ${canStore ? 'bg-gradient-to-br from-purple-700/60 via-purple-600/50 to-purple-900/60 border-purple-500/40' : 'bg-gradient-to-br from-gray-700/40 via-gray-600/30 to-gray-900/40 border-gray-500/30'}`} aria-hidden />
              <div className={`absolute inset-[3px] rounded-xl bg-gradient-to-b ${canStore ? 'from-purple-600/40 via-purple-500/30 to-purple-800/40' : 'from-gray-600/30 via-gray-500/20 to-gray-800/30'}`} style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
              <div className="absolute rounded-xl bg-gradient-to-b from-black/50 via-black/60 to-black/70" style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)' }} aria-hidden />
              
              <button
                onClick={() => handleDecision('store')}
                disabled={!canStore || loading}
                className="relative z-10 w-full rounded-xl font-bold text-white py-3 px-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <span className="text-base">{t('lootbox.store_later')}</span>
                )}
              </button>
            </div>
            {!canStore && (
              <p className="text-xs text-red-400 text-center -mt-1">
                {t('lootbox.storage_full_hint')}
              </p>
            )}

            {/* Open now */}
            <div className="relative">
              {/* 3D Frame Effects */}
              <div className="absolute rounded-xl bg-black/40 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
              <div className={`absolute inset-0 rounded-xl border-2 shadow-[0_0_20px_rgba(234,179,8,0.5),0_8px_25px_rgba(0,0,0,0.5)] ${canOpenNow ? 'bg-gradient-to-br from-yellow-700/60 via-yellow-600/50 to-yellow-900/60 border-yellow-500/40' : 'bg-gradient-to-br from-gray-700/40 via-gray-600/30 to-gray-900/40 border-gray-500/30'}`} aria-hidden />
              <div className={`absolute inset-[3px] rounded-xl bg-gradient-to-b ${canOpenNow ? 'from-yellow-600/40 via-yellow-500/30 to-yellow-800/40' : 'from-gray-600/30 via-gray-500/20 to-gray-800/30'}`} style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
              <div className="absolute rounded-xl bg-gradient-to-b from-black/50 via-black/60 to-black/70" style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)' }} aria-hidden />
              
              <button
                onClick={() => handleDecision('open_now')}
                disabled={!canOpenNow || loading}
                className="relative z-10 w-full rounded-xl font-bold py-3 px-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                style={{ color: canOpenNow ? '#000' : '#6b7280' }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <span className="text-base">{t('lootbox.open_now')}</span>
                )}
              </button>
            </div>
            {!canOpenNow && (
              <p className="text-xs text-red-400 text-center -mt-1">
                {t('lootbox.not_enough_gold_hint')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
