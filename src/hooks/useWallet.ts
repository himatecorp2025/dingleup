import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WalletData {
  isSubscriber: boolean;
  livesCurrent: number;
  livesMax: number;
  coinsCurrent: number;
  nextLifeAt: string | null;
  regenIntervalSec: number;
  regenMinutes: number;
  ledger: any[];
  subscriberRenewAt?: string | null;
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
    fetchWallet();

    // Refresh every 3 seconds for immediate updates
    const intervalId = setInterval(() => {
      fetchWallet();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [userId]);

  return {
    walletData,
    loading,
    serverDriftMs,
    refetchWallet: fetchWallet
  };
};
