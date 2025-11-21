import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEVICE_ID_KEY = 'dingleup_device_id';

export const useAutoRegister = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const register = async () => {
      console.log('[useAutoRegister] Starting auto-registration flow');
      
      try {
        // 1. Check existing session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          console.log('[useAutoRegister] Session already exists, user:', sessionData.session.user.id);
          if (mounted) {
            setUserId(sessionData.session.user.id);
            setIsReady(true);
          }
          return;
        }

        // 2. Get/create device ID
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
          console.log('[useAutoRegister] New device_id created:', deviceId.substring(0, 8) + '...');
        } else {
          console.log('[useAutoRegister] Existing device_id found:', deviceId.substring(0, 8) + '...');
        }

        // 3. Call edge function to create/get user
        console.log('[useAutoRegister] Calling auto-register-device edge function');
        const { data, error: fnError } = await supabase.functions.invoke('auto-register-device', {
          body: { device_id: deviceId },
        });

        console.log('[useAutoRegister] Edge function response:', { data, error: fnError });

        if (fnError) {
          console.error('[useAutoRegister] Edge function error:', fnError);
          if (mounted) {
            setError('Fiók létrehozási hiba: ' + (fnError.message || 'Ismeretlen hiba'));
            setIsReady(true);
          }
          return;
        }

        if (!data?.success) {
          console.error('[useAutoRegister] Edge function returned no success');
          if (mounted) {
            setError('Nem sikerült létrehozni a fiókot');
            setIsReady(true);
          }
          return;
        }

        // 4. Sign in with temp credentials
        console.log('[useAutoRegister] Attempting sign in with email:', data.email);
        const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: deviceId,
        });

        if (signInError) {
          console.error('[useAutoRegister] Sign in error:', signInError);
          if (mounted) {
            setError('Bejelentkezési hiba: ' + signInError.message);
            setIsReady(true);
          }
          return;
        }

        console.log('[useAutoRegister] Sign in successful, user:', signInData.user?.id);

        if (mounted) {
          setUserId(signInData.user?.id || null);
          setIsReady(true);
        }
      } catch (err) {
        console.error('[useAutoRegister] Unexpected error:', err);
        if (mounted) {
          setError('Váratlan hiba történt');
          setIsReady(true);
        }
      }
    };

    register();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error, userId };
};
