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
        className="max-w-[320px] bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 border-2 border-yellow-500/30"
        style={{
          height: '70vh',
          maxHeight: '70vh',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-yellow-400 font-bold text-xl">
            {t('lootbox.decision_title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Lootbox icon */}
          <GoldLootboxIcon size={80} />

          {/* Description */}
          <p className="text-white/90 text-center text-sm">
            {t('lootbox.decision_description')}
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-2 w-full">
            {/* Store for later */}
            <button
              onClick={() => handleDecision('store')}
              disabled={!canStore || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-white py-3 px-4 shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                t('lootbox.store_later')
              )}
            </button>
            {!canStore && (
              <p className="text-xs text-red-400 text-center">
                {t('lootbox.storage_full_hint')}
              </p>
            )}

            {/* Open now */}
            <button
              onClick={() => handleDecision('open_now')}
              disabled={!canOpenNow || loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-black py-3 px-4 shadow-lg transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                t('lootbox.open_now')
              )}
            </button>
            {!canOpenNow && (
              <p className="text-xs text-red-400 text-center">
                {t('lootbox.not_enough_gold_hint')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
