import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEVICE_ID_KEY = 'dingleup_device_id';

export const useAutoRegister = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const register = async () => {
      try {
        // 1. Check existing session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          if (mounted) {
            setIsReady(true);
          }
          return;
        }

        // 2. Get/create device ID
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        // 3. Call edge function
        const { data, error: fnError } = await supabase.functions.invoke('auto-register-device', {
          body: { device_id: deviceId },
        });

        if (fnError || !data?.success) {
          if (mounted) {
            setError('Regisztrációs hiba');
            setIsReady(true);
          }
          return;
        }

        // 4. Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: deviceId,
        });

        if (signInError) {
          if (mounted) {
            setError('Bejelentkezési hiba');
          }
        }

        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError('Hiba történt');
          setIsReady(true);
        }
      }
    };

    register();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
};
