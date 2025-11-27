import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveLootbox {
  id: string;
  status: string;
  open_cost_gold: number;
  expires_at: string | null;
  source: string;
  created_at: string;
  activated_at: string | null;
}

interface UseActiveLootboxReturn {
  activeLootbox: ActiveLootbox | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useActiveLootbox = (userId?: string | undefined): UseActiveLootboxReturn => {
  const [activeLootbox, setActiveLootbox] = useState<ActiveLootbox | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveLootbox = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get fresh session with explicit refresh if needed
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        setActiveLootbox(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase.functions.invoke('lootbox-active', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (fetchError) {
        console.error('[useActiveLootbox] Fetch error:', fetchError);
        setError(fetchError.message);
        setActiveLootbox(null);
      } else {
        setActiveLootbox(data?.activeLootbox || null);
      }
    } catch (err) {
      console.error('[useActiveLootbox] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActiveLootbox(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLootbox();
    
    // Poll every 30 seconds to check for new drops
    const interval = setInterval(fetchActiveLootbox, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    activeLootbox,
    loading,
    error,
    refetch: fetchActiveLootbox
  };
};
