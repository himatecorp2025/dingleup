import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEVICE_ID_KEY = 'dingleup_device_id';

// Simplified auto-register hook with better error handling
export const useAutoRegister = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useAutoRegister] Hook starting...');
    
    const register = async () => {
      try {
        // Check existing session first
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          console.log('[useAutoRegister] ✓ Existing session found');
          setIsReady(true);
          return;
        }

        // Get/create device ID
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
          console.log('[useAutoRegister] Created device_id');
        }

        console.log('[useAutoRegister] Calling edge function...');
        
        // Call edge function
        const { data, error: fnError } = await supabase.functions.invoke('auto-register-device', {
          body: { device_id: deviceId },
        });

        if (fnError || !data?.success) {
          console.error('[useAutoRegister] Edge function error:', fnError || data);
          setError('Regisztrációs hiba');
          setIsReady(true);
          return;
        }

        console.log('[useAutoRegister] ✓ Registration OK, signing in...');

        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: deviceId,
        });

        if (signInError) {
          console.error('[useAutoRegister] Sign in error:', signInError);
          setError('Bejelentkezési hiba');
        }

        setIsReady(true);
      } catch (err) {
        console.error('[useAutoRegister] Unexpected error:', err);
        setError('Hiba történt');
        setIsReady(true);
      }
    };

    register();
  }, []);

  return { isReady, error };
};
