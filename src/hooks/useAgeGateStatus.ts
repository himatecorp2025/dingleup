import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAgeGateStatus = (userId: string | undefined) => {
  const [needsAgeGate, setNeedsAgeGate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkAgeGateStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_login_age_gate_completed')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('[useAgeGateStatus] Error fetching status:', error);
          setNeedsAgeGate(false);
          return;
        }

        setNeedsAgeGate(!data?.first_login_age_gate_completed);
      } catch (err) {
        console.error('[useAgeGateStatus] Unexpected error:', err);
        setNeedsAgeGate(false);
      } finally {
        setLoading(false);
      }
    };

    checkAgeGateStatus();

    // Real-time subscription for profile changes
    const channel = supabase
      .channel('age-gate-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setNeedsAgeGate(!newData.first_login_age_gate_completed);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return { needsAgeGate, loading };
};
