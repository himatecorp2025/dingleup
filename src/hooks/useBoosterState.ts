import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BoosterState {
  instantPremiumEnabled: boolean;
  hasPendingPremium: boolean;
  pendingSpeedTokensCount: number;
  activeSpeedToken: {
    id: string;
    expiresAt: string;
    durationMinutes: number;
    source: string;
  } | null;
  loading: boolean;
}

export function useBoosterState(userId: string | undefined) {
  const [state, setState] = useState<BoosterState>({
    instantPremiumEnabled: false,
    hasPendingPremium: false,
    pendingSpeedTokensCount: 0,
    activeSpeedToken: null,
    loading: true
  });

  useEffect(() => {
    if (!userId) {
      setState({ 
        instantPremiumEnabled: false, 
        hasPendingPremium: false, 
        pendingSpeedTokensCount: 0,
        activeSpeedToken: null,
        loading: false 
      });
      return;
    }

    async function fetchBoosterState() {
      try {
        // Fetch user purchase settings
        const { data: settings } = await supabase
          .from('user_purchase_settings')
          .select('instant_premium_booster_enabled')
          .eq('user_id', userId)
          .maybeSingle();

        // Fetch premium booster state
        const { data: premiumState } = await supabase
          .from('user_premium_booster_state')
          .select('has_pending_premium_booster')
          .eq('user_id', userId)
          .maybeSingle();

        // Fetch pending speed tokens (unused)
        const { count: pendingCount } = await supabase
          .from('speed_tokens')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('used_at', null);

        // Fetch active speed token (used and not expired)
        const { data: activeTokens } = await supabase
          .from('speed_tokens')
          .select('*')
          .eq('user_id', userId)
          .not('used_at', 'is', null)
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1);

        setState({
          instantPremiumEnabled: settings?.instant_premium_booster_enabled || false,
          hasPendingPremium: premiumState?.has_pending_premium_booster || false,
          pendingSpeedTokensCount: pendingCount || 0,
          activeSpeedToken: activeTokens && activeTokens.length > 0 ? {
            id: activeTokens[0].id,
            expiresAt: activeTokens[0].expires_at,
            durationMinutes: activeTokens[0].duration_minutes,
            source: activeTokens[0].source
          } : null,
          loading: false
        });
      } catch (error) {
        console.error('[useBoosterState] Error fetching state:', error);
        setState({ 
          instantPremiumEnabled: false, 
          hasPendingPremium: false,
          pendingSpeedTokensCount: 0,
          activeSpeedToken: null,
          loading: false 
        });
      }
    }

    fetchBoosterState();

    // Set up real-time subscription for state changes
    const channel = supabase
      .channel(`booster-state-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_purchase_settings',
          filter: `user_id=eq.${userId}`
        },
        () => fetchBoosterState()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_premium_booster_state',
          filter: `user_id=eq.${userId}`
        },
        () => fetchBoosterState()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'speed_tokens',
          filter: `user_id=eq.${userId}`
        },
        () => fetchBoosterState()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return state;
}
