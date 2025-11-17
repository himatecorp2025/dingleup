import { useState, useEffect } from 'react';
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

  const fetchWallet = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const requestTime = Date.now();
      
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
  };

  useEffect(() => {
    if (!userId) return;
    
    fetchWallet();

    // Real-time subscription for instant wallet changes
    const channel = supabase
      .channel(`wallet_optimized_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload: any) => {
          // Optimistic update with payload data
          if (payload.new && typeof payload.new === 'object') {
            setWalletData(prev => prev ? {
              ...prev,
              coinsCurrent: payload.new.coins ?? prev.coinsCurrent,
              livesCurrent: payload.new.lives ?? prev.livesCurrent,
              livesMax: payload.new.max_lives ?? prev.livesMax,
            } : null);
          }
          // Full refetch as fallback
          fetchWallet();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_ledger',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchWallet();
        }
      )
      .subscribe();

    // Refresh every 5 seconds only (reduced from 1s)
    const intervalId = setInterval(() => {
      fetchWallet();
    }, 5000);

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    walletData,
    loading,
    serverDriftMs,
    refetchWallet: fetchWallet
  };
};
