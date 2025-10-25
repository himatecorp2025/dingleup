import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeAdminOptions {
  onDataChange: () => void;
  enabled?: boolean;
}

/**
 * Optimized realtime hook for admin dashboard
 * Uses single channel with multiple table listeners for better performance
 */
export const useRealtimeAdmin = ({ onDataChange, enabled = true }: UseRealtimeAdminOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Throttled callback to prevent rapid refetches
  const throttledCallback = useCallback(() => {
    if (throttleTimeoutRef.current) {
      return; // Already pending
    }

    throttleTimeoutRef.current = setTimeout(() => {
      onDataChange();
      throttleTimeoutRef.current = null;
    }, 1000); // Max 1 refetch per second
  }, [onDataChange]);

  useEffect(() => {
    if (!enabled) return;

    console.log('[RealtimeAdmin] Setting up optimized realtime subscriptions...');

    // Single channel for all admin data - much more efficient
    channelRef.current = supabase
      .channel('admin-dashboard-all')
      // Profiles changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('[RealtimeAdmin] Profile changed:', payload.eventType);
        throttledCallback();
      })
      // Purchases changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchases'
      }, (payload) => {
        console.log('[RealtimeAdmin] Purchase changed:', payload.eventType);
        throttledCallback();
      })
      // Invitations changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invitations'
      }, (payload) => {
        console.log('[RealtimeAdmin] Invitation changed:', payload.eventType);
        throttledCallback();
      })
      // Reports changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reports'
      }, (payload) => {
        console.log('[RealtimeAdmin] Report changed:', payload.eventType);
        throttledCallback();
      })
      // Friendships changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships'
      }, (payload) => {
        console.log('[RealtimeAdmin] Friendship changed:', payload.eventType);
        throttledCallback();
      })
      .subscribe((status) => {
        console.log('[RealtimeAdmin] Subscription status:', status);
      });

    return () => {
      console.log('[RealtimeAdmin] Cleaning up realtime subscriptions');
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enabled, throttledCallback]);

  return {
    isConnected: channelRef.current?.state === 'joined',
  };
};
