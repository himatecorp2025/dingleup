import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBroadcastChannel } from './useOptimizedRealtime';
import { toast } from 'sonner';

/**
 * Real-time updates for game-related changes (coins, lives, purchases)
 * Uses broadcast for instant cross-tab synchronization
 */
export const useGameRealtimeUpdates = (
  userId: string | undefined,
  onCoinsUpdate: (newCoins: number) => void,
  onLivesUpdate: (newLives: number) => void
) => {
  // Listen for wallet updates via broadcast (faster than database polling)
  const { broadcast: broadcastWalletUpdate } = useBroadcastChannel(
    `wallet-updates-${userId}`,
    'wallet_changed',
    useCallback((payload: any) => {
      console.log('[Game RT] Wallet update received:', payload);
      
      if (payload.coins !== undefined) {
        onCoinsUpdate(payload.coins);
      }
      if (payload.lives !== undefined) {
        onLivesUpdate(payload.lives);
      }

      // Show toast for significant changes
      if (payload.source === 'purchase' || payload.source === 'reward') {
        if (payload.coins > 0) {
          toast.success(`+${payload.coins} érme! 💰`);
        }
        if (payload.lives > 0) {
          toast.success(`+${payload.lives} élet! ❤️`);
        }
      }
    }, [onCoinsUpdate, onLivesUpdate])
  );

  // Direct profile updates (fallback to database changes)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, (payload) => {
        console.log('[Game RT] Profile DB update:', payload);
        
        const newProfile = payload.new as any;
        
        if (newProfile.coins !== undefined) {
          onCoinsUpdate(newProfile.coins);
        }
        if (newProfile.lives !== undefined) {
          onLivesUpdate(newProfile.lives);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onCoinsUpdate, onLivesUpdate]);

  return { broadcastWalletUpdate };
};

/**
 * Broadcast wallet changes to all connected clients
 * Call this after successful purchases, rewards, or game completions
 */
export const broadcastWalletChange = async (
  userId: string,
  coins: number,
  lives: number,
  source: string
) => {
  const channel = supabase.channel(`wallet-updates-${userId}`);
  
  await channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.send({
        type: 'broadcast',
        event: 'wallet_changed',
        payload: { coins, lives, source, timestamp: Date.now() }
      });
      
      console.log('[Game RT] Wallet change broadcasted:', { coins, lives, source });
    }
  });

  // Clean up after broadcast
  setTimeout(() => supabase.removeChannel(channel), 1000);
};
