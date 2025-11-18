import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WalletData {
  livesCurrent: number;
  livesMax: number;
  coinsCurrent: number;
  nextLifeAt: string | null;
  regenIntervalSec: number;
  regenMinutes: number;
  ledger: any[];
}

export const useWallet = (userId: string | undefined) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverDriftMs, setServerDriftMs] = useState(0);

  const fetchWallet = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If no valid session, try to refresh it
      if (sessionError || !session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('[useWallet] Session refresh failed:', refreshError);
          setLoading(false);
          return;
        }
      }

      // Get fresh session token for the request
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        console.error('[useWallet] No valid access token available');
        setLoading(false);
        return;
      }

      const requestTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('get-wallet', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      if (error) {
        console.error('[useWallet] Error fetching wallet:', error);
        setLoading(false);
        return;
      }

      const responseTime = Date.now();
      const roundTripTime = responseTime - requestTime;
      
      // Estimate server time (assuming symmetric latency)
      const estimatedServerTime = responseTime - (roundTripTime / 2);
      const clientServerDrift = estimatedServerTime - Date.now();
      setServerDriftMs(clientServerDrift);

      setWalletData(data);
    } catch (err) {
      console.error('[useWallet] Exception fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    
    fetchWallet();

    // Real-time subscription for instant wallet changes (SINGLE subscription)
    const channel = supabase
      .channel(`wallet_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload: any) => {
          if (payload.new && typeof payload.new === 'object') {
            setWalletData(prev => prev ? {
              ...prev,
              coinsCurrent: payload.new.coins ?? prev.coinsCurrent,
              livesCurrent: payload.new.lives ?? prev.livesCurrent,
              livesMax: payload.new.max_lives ?? prev.livesMax,
            } : null);
          }
        }
      )
      .subscribe();

    // Polling fallback every 10 seconds (reduced from 5s)
    const intervalId = setInterval(() => {
      fetchWallet();
    }, 10000);

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchWallet]);

  return {
    walletData,
    loading,
    serverDriftMs,
    refetchWallet: fetchWallet
  };
};
