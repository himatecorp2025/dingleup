import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveLootbox {
  id: string;
  status: string;
  open_cost_gold: number;
  expires_at: string | null;
  source: string;
  created_at: string;
  activated_at: string | null;
}

/**
 * NEW ACTIVITY-BASED LOOTBOX DROP ENGINE
 * 
 * This hook implements the new slot-based, activity-aware lootbox system:
 * - Sends periodic heartbeat (30s interval) when app is active
 * - Backend processes pending lootbox slots based on user's activity window
 * - Ensures 10-20 drops per day for active users
 * - Slots don't expire if user is offline - they wait for next active session
 * 
 * Key Features:
 * 1. Activity Window: Uses user's historical activity pattern (last 7 days)
 * 2. Slot System: Each day has 10-20 random slot times within active window
 * 3. Pending → Delivered: Slots are processed when user is active
 * 4. No Lost Drops: Offline slots remain pending until user returns
 * 5. Catch-up Logic: If < 10 drops near end of day, accelerates delivery
 */

type ActivityType = 
  | 'daily_first_login'
  | 'quiz_started' 
  | 'quiz_completed'
  | 'answer_streak'
  | 'session_active';

interface ActivityMetadata {
  [key: string]: any;
}

interface LootboxActivityTrackerOptions {
  enabled?: boolean;
  heartbeatIntervalSeconds?: number;
}

export const useLootboxActivityTracker = (
  options: LootboxActivityTrackerOptions = {}
) => {
  const { enabled = true, heartbeatIntervalSeconds = 300 } = options;
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeat = useRef<Date | null>(null);
  const retryCount = useRef<number>(0);
  const maxRetries = 3;
  
  // State for active lootbox (unified with heartbeat response)
  const [activeLootbox, setActiveLootbox] = useState<ActiveLootbox | null>(null);
  const [loading, setLoading] = useState(true);

  const sendHeartbeat = useCallback(async () => {
    setLoading(true);
    try {
      // Get fresh session with retry logic for token refresh
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.log('[Lootbox Heartbeat] No valid session, skipping');
        setActiveLootbox(null);
        setLoading(false);
        return null;
      }

      // Call new heartbeat edge function
      const { data, error } = await supabase.functions.invoke(
        'lootbox-heartbeat',
        {
          body: {},
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      lastHeartbeat.current = new Date();

      if (error) {
        console.error('[Lootbox Heartbeat] Error:', error);
        
        // Retry logic for transient failures
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          console.log(`[Lootbox Heartbeat] Retrying (${retryCount.current}/${maxRetries})...`);
          setTimeout(() => sendHeartbeat(), 2000 * retryCount.current); // Exponential backoff
        } else {
          retryCount.current = 0;
        }
        
        setLoading(false);
        return null;
      }

      // Reset retry count on success
      retryCount.current = 0;

      // Update active lootbox state from heartbeat response
      if (data?.activeLootbox) {
        setActiveLootbox(data.activeLootbox);
        
        if (data?.drop_created) {
          console.log('[Lootbox Heartbeat] ✅ New drop created!', data.activeLootbox);
        } else if (data?.has_active_drop) {
          console.log('[Lootbox Heartbeat] ⏳ Active drop already exists');
        }
        
        console.log('[Lootbox Heartbeat] 📊 Plan status:', {
          delivered: data.plan?.delivered_count,
          target: data.plan?.target_count,
          pending: data.plan?.pending_slots
        });
      } else {
        setActiveLootbox(null);
        
        if (data?.no_pending_slots) {
          console.log('[Lootbox Heartbeat] ⌛ No pending slots due yet');
        }
      }

      setLoading(false);
      return data;
    } catch (err) {
      console.error('[Lootbox Heartbeat] Unexpected error:', err);
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Send initial heartbeat on mount
    sendHeartbeat();

    // Set up periodic heartbeat
    heartbeatInterval.current = setInterval(() => {
      sendHeartbeat();
    }, heartbeatIntervalSeconds * 1000);

    // Handle visibility change (app goes to background/foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Lootbox Heartbeat] App visible - sending immediate heartbeat');
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, heartbeatIntervalSeconds, sendHeartbeat]);

  // Legacy trackActivity for backward compatibility
  // Now just triggers an immediate heartbeat
  const trackActivity = useCallback(async (
    activityType: ActivityType,
    metadata?: ActivityMetadata
  ) => {
    if (!enabled) return null;
    console.log(`[Lootbox Activity] ${activityType} - triggering heartbeat`);
    return await sendHeartbeat();
  }, [enabled, sendHeartbeat]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    return sendHeartbeat();
  }, [sendHeartbeat]);

  return { 
    trackActivity, 
    sendHeartbeat,
    activeLootbox,
    loading,
    refetch
  };
};
