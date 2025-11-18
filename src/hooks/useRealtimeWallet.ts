import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface WalletUpdate {
  coins?: number;
  lives?: number;
  maxLives?: number;
}

interface UseRealtimeWalletOptions {
  userId: string | undefined;
  onWalletUpdate: (update: WalletUpdate) => void;
  enabled?: boolean;
}

/**
 * Realtime wallet updates for instant coin/lives synchronization
 * Listens to profiles table changes for the current user
 */
export const useRealtimeWallet = ({ 
  userId, 
  onWalletUpdate, 
  enabled = true 
}: UseRealtimeWalletOptions) => {
  const handleWalletChange = useCallback((payload: any) => {
    if (!payload.new) return;

    const update: WalletUpdate = {};
    
    // Only update changed fields
    if (payload.old?.coins !== payload.new?.coins) {
      update.coins = payload.new.coins;
    }
    
    if (payload.old?.lives !== payload.new?.lives) {
      update.lives = payload.new.lives;
    }
    
    if (payload.old?.max_lives !== payload.new?.max_lives) {
      update.maxLives = payload.new.max_lives;
    }

    if (Object.keys(update).length > 0) {
      onWalletUpdate(update);
    }
  }, [onWalletUpdate]);

  useEffect(() => {
    if (!userId || !enabled) return;

    const channel: RealtimeChannel = supabase
      .channel(`wallet-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, handleWalletChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, handleWalletChange]);
};
