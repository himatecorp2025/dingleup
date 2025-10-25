import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface BroadcastMessage {
  type: string;
  payload: any;
  timestamp: number;
}

interface UseBroadcastChannelOptions {
  channelName: string;
  onMessage: (message: BroadcastMessage) => void;
  enabled?: boolean;
}

/**
 * Broadcast channel for instant cross-client communication
 * Perfect for admin announcements, game events, etc.
 * Much faster than database polling!
 */
export const useBroadcastChannel = ({ 
  channelName, 
  onMessage, 
  enabled = true 
}: UseBroadcastChannelOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleBroadcast = useCallback((payload: any) => {
    console.log('[Broadcast] Received:', payload);
    onMessage(payload);
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    console.log('[Broadcast] Setting up channel:', channelName);

    channelRef.current = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, handleBroadcast)
      .subscribe((status) => {
        console.log('[Broadcast] Status:', status);
      });

    return () => {
      console.log('[Broadcast] Cleaning up channel:', channelName);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelName, enabled, handleBroadcast]);

  // Send broadcast message
  const broadcast = useCallback(async (type: string, payload: any) => {
    if (!channelRef.current) {
      console.warn('[Broadcast] Channel not ready');
      return false;
    }

    const message: BroadcastMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: message,
      });
      console.log('[Broadcast] Sent:', message);
      return true;
    } catch (error) {
      console.error('[Broadcast] Send failed:', error);
      return false;
    }
  }, []);

  return {
    broadcast,
    isConnected: channelRef.current?.state === 'joined',
  };
};
