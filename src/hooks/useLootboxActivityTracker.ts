import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const { enabled = true, heartbeatIntervalSeconds = 30 } = options;
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeat = useRef<Date | null>(null);

  const sendHeartbeat = useCallback(async () => {
    try {
      // Get fresh session with explicit token validation
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.log('[Lootbox Heartbeat] No valid session, skipping');
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
        return null;
      }

      if (data?.drop_created) {
        console.log('[Lootbox Heartbeat] ✅ New drop created!', data.lootbox);
        console.log('[Lootbox Heartbeat] 📊 Plan status:', {
          delivered: data.plan.delivered_count,
          target: data.plan.target_count,
          pending: data.plan.pending_slots
        });
      } else if (data?.has_active_drop) {
        console.log('[Lootbox Heartbeat] ⏳ Active drop already exists');
      } else if (data?.no_pending_slots) {
        console.log('[Lootbox Heartbeat] ⌛ No pending slots due yet');
      }

      return data;
    } catch (err) {
      console.error('[Lootbox Heartbeat] Unexpected error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Send initial heartbeat on mount
    sendHeartbeat();

    // Set up periodic heartbeat
    heartbeatInterval.current = setInterval(() => {
      sendHeartbeat();
    }, heartbeatIntervalSeconds * 1000);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
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

  return { trackActivity, sendHeartbeat };
};
