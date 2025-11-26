import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Automatically detects and saves user's device timezone to profile
 * Runs once on app initialization for authenticated users
 */
export function useTimezoneDetection() {
  useEffect(() => {
    const detectAndSaveTimezone = async () => {
      try {
        // Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Detect device timezone using native browser API
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        if (!detectedTimezone) {
          console.warn('[TIMEZONE] Could not detect timezone, using default');
          return;
        }

        console.log('[TIMEZONE] Detected timezone:', detectedTimezone);

        // Get current profile timezone
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('user_timezone')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('[TIMEZONE] Error fetching profile:', fetchError);
          return;
        }

        // Only update if timezone has changed or not set
        if (!profile?.user_timezone || profile.user_timezone !== detectedTimezone) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ user_timezone: detectedTimezone })
            .eq('id', user.id);

          if (updateError) {
            console.error('[TIMEZONE] Error updating timezone:', updateError);
          } else {
            console.log('[TIMEZONE] Timezone saved successfully:', detectedTimezone);
          }
        } else {
          console.log('[TIMEZONE] Timezone already up to date');
        }
      } catch (error) {
        console.error('[TIMEZONE] Error in timezone detection:', error);
      }
    };

    detectAndSaveTimezone();
  }, []);
}
