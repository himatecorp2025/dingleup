import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useCallback } from 'react';

export interface WalletData {
  coins: number;
  coinsCurrent: number; // Alias for backward compatibility
  lives: number;
  livesCurrent: number; // Alias for backward compatibility
  maxLives: number;
  livesMax: number; // Alias for backward compatibility
  nextLifeAt: string | null;
  serverDriftMs: number;
  activeSpeedToken?: {
    speedCount: number;
    speedDurationMinutes: number;
    expiresAt: string;
  } | null;
}

const WALLET_QUERY_KEY = (userId: string) => ['wallet', userId];

async function fetchWallet(userId: string): Promise<WalletData> {
  const requestTime = Date.now();
  
  const response = await supabase.functions.invoke('get-wallet', {
    body: { userId }
  });

  const responseTime = Date.now();
  const roundTripTime = responseTime - requestTime;
  const estimatedServerTime = responseTime - (roundTripTime / 2);
  const clientServerDrift = estimatedServerTime - Date.now();

  if (response.error) throw response.error;
  if (!response.data?.success) throw new Error(response.data?.error || 'Failed to fetch wallet');

  const data = response.data;
  return {
    coins: data.coins,
    coinsCurrent: data.coins, // Backward compatibility
    lives: data.lives,
    livesCurrent: data.lives, // Backward compatibility
    maxLives: data.maxLives,
    livesMax: data.maxLives, // Backward compatibility
    nextLifeAt: data.nextLifeAt,
    serverDriftMs: clientServerDrift,
    activeSpeedToken: data.activeSpeedToken || null,
  };
}

export function useWalletQuery(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: WALLET_QUERY_KEY(userId || ''),
    queryFn: () => fetchWallet(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds - wallet data stays fresh
    gcTime: 1000 * 60 * 5, // 5 minutes - cache kept in memory
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Manual refetch function
  const refetchWallet = useCallback(async () => {
    if (!userId) return;
    await queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY(userId) });
  }, [userId, queryClient]);

  // Real-time subscription for instant wallet updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`wallet-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          // Optimistic update for coins/lives changes
          if (payload.new) {
            queryClient.setQueryData(
              WALLET_QUERY_KEY(userId),
              (old: WalletData | undefined) => {
                if (!old) return old;
                return {
                  ...old,
                  coins: payload.new.coins ?? old.coins,
                  lives: payload.new.lives ?? old.lives,
                  maxLives: payload.new.max_lives ?? old.maxLives,
                };
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_ledger',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch on wallet ledger changes
          refetchWallet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, refetchWallet]);

  return {
    walletData: query.data,
    loading: query.isLoading,
    refetchWallet,
    serverDriftMs: query.data?.serverDriftMs ?? 0,
  };
}

// Prefetch wallet data before navigation
export function prefetchWallet(userId: string, queryClient: any) {
  return queryClient.prefetchQuery({
    queryKey: WALLET_QUERY_KEY(userId),
    queryFn: () => fetchWallet(userId),
    staleTime: 1000 * 30,
  });
}
