import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BoosterState {
  instantPremiumEnabled: boolean;
  hasPendingPremium: boolean;
  loading: boolean;
}

export function useBoosterState(userId: string | undefined) {
  const [state, setState] = useState<BoosterState>({
    instantPremiumEnabled: false,
    hasPendingPremium: false,
    loading: true
  });

  useEffect(() => {
    if (!userId) {
      setState({ instantPremiumEnabled: false, hasPendingPremium: false, loading: false });
      return;
    }

    async function fetchBoosterState() {
      try {
        // Fetch user purchase settings
        const { data: settings } = await supabase
          .from('user_purchase_settings')
          .select('instant_premium_booster_enabled')
          .eq('user_id', userId)
          .single();

        // Fetch premium booster state
        const { data: premiumState } = await supabase
          .from('user_premium_booster_state')
          .select('has_pending_premium_booster')
          .eq('user_id', userId)
          .single();

        setState({
          instantPremiumEnabled: settings?.instant_premium_booster_enabled || false,
          hasPendingPremium: premiumState?.has_pending_premium_booster || false,
          loading: false
        });
      } catch (error) {
        console.error('[useBoosterState] Error fetching state:', error);
        setState({ instantPremiumEnabled: false, hasPendingPremium: false, loading: false });
      }
    }

    fetchBoosterState();

    // Set up real-time subscription for state changes
    const settingsChannel = supabase
      .channel('booster-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_purchase_settings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            setState(prev => ({
              ...prev,
              instantPremiumEnabled: (payload.new as any).instant_premium_booster_enabled || false
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_premium_booster_state',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            setState(prev => ({
              ...prev,
              hasPendingPremium: (payload.new as any).has_pending_premium_booster || false
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, [userId]);

  return state;
}
