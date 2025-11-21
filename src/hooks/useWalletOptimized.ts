import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WalletData {
  coins: number;
  lives: number;
  maxLives: number;
  nextLifeAt: string | null;
  speedBoostActive: boolean;
  speedBoostExpiresAt: string | null;
}

/**
 * Optimized wallet hook with React Query caching
 * Replaces polling with real-time subscriptions + cache
 */
export const useWalletOptimized = (userId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch wallet data with React Query cache
  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase.functions.invoke('get-wallet', {
        body: { userId }
      });

      if (error) throw error;
      return data as WalletData;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds (wallet data changes frequently)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Real-time subscription to profiles table
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
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('[useWalletOptimized] Profile updated:', payload);
          
          // Optimistic update - immediately update cache with new data
          if (payload.new && typeof payload.new === 'object') {
            queryClient.setQueryData(['wallet', userId], (old: WalletData | null) => {
              if (!old) return null;
              
              const newData = payload.new as any;
              return {
                ...old,
                coins: newData.coins ?? old.coins,
                lives: newData.lives ?? old.lives,
                maxLives: newData.max_lives ?? old.maxLives,
              };
            });
          }
          
          // Invalidate query to trigger refetch (backup for full sync)
          queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Listen for wallet_ledger changes (coins/lives transactions)
  useEffect(() => {
    if (!userId) return;

    const ledgerChannel = supabase
      .channel(`wallet-ledger-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_ledger',
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log('[useWalletOptimized] Wallet transaction detected');
          // Invalidate to refetch with accurate backend state
          queryClient.invalidateQueries({ queryKey: ['wallet', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ledgerChannel);
    };
  }, [userId, queryClient]);

  return {
    walletData,
    loading: isLoading,
    refetchWallet: () => queryClient.invalidateQueries({ queryKey: ['wallet', userId] }),
  };
};
