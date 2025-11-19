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
  activeSpeedToken?: {
    id: string;
    expiresAt: string;
    durationMinutes: number;
    source: string;
  } | null;
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
      const requestTime = Date.now();
      
      // supabase.functions.invoke automatically includes the current session token
      const { data, error } = await supabase.functions.invoke('get-wallet');

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
