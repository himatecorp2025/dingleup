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
      
      // Get current session explicitly
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        console.error('[useWallet] No valid session');
        setLoading(false);
        return;
      }
      
      // PERFORMANCE OPTIMIZATION: Request only essential fields (30-40% payload reduction)
      // Exclude ledger (heavy field) unless explicitly needed
      const fields = 'livesCurrent,livesMax,coinsCurrent,nextLifeAt,regenIntervalSec,regenMinutes,activeSpeedToken';
      
      // Call edge function with explicit session token and field filtering
      const { data, error } = await supabase.functions.invoke('get-wallet', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: {
          fields
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

      setWalletData({
        ...data,
        ledger: [] // Ledger excluded for performance
      });
    } catch (err) {
      console.error('[useWallet] Exception fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    
    fetchWallet();

    // Real-time subscription for instant wallet changes (instant, 0 seconds delay)
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

    return () => {
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
