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
    onMessage(payload);
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    channelRef.current = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, handleBroadcast)
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelName, enabled, handleBroadcast]);

  // Send broadcast message
  const broadcast = useCallback(async (type: string, payload: any) => {
    if (!channelRef.current) {
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
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    broadcast,
    isConnected: channelRef.current?.state === 'joined',
  };
};
