import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const DEVICE_ID_KEY = 'dingleup_device_id';

export const useAutoRegister = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const autoRegister = async () => {
      try {
        console.log('[useAutoRegister] Starting...');
        
        // Check if user already has session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('[useAutoRegister] Session already exists:', session.user.id);
          if (mounted) setIsReady(true);
          return;
        }

        // Get or create device_id
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
          console.log('[useAutoRegister] Created new device_id:', deviceId.substring(0, 8) + '...');
        } else {
          console.log('[useAutoRegister] Using existing device_id:', deviceId.substring(0, 8) + '...');
        }

        console.log('[useAutoRegister] Calling auto-register-device function...');

        // Call auto-register edge function with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const { data, error } = await supabase.functions.invoke('auto-register-device', {
            body: { device_id: deviceId },
            headers: {
              'Content-Type': 'application/json',
            },
          });

          clearTimeout(timeoutId);

          if (error) {
            console.error('[useAutoRegister] Registration error:', error);
            if (mounted) {
              setError('Regisztrációs hiba történt');
              setIsReady(true);
            }
            return;
          }

          console.log('[useAutoRegister] Edge function response:', data);

          if (data?.success && data?.email) {
            console.log('[useAutoRegister] Registration successful, email:', data.email);
            console.log('[useAutoRegister] Attempting sign in...');
            
            // Sign in with device_id as password
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: deviceId,
            });

            if (signInError) {
              console.error('[useAutoRegister] Sign in error:', signInError);
              if (mounted) {
                setError('Bejelentkezési hiba történt');
                setIsReady(true);
              }
              return;
            }

            console.log('[useAutoRegister] Sign in successful:', signInData.user?.id);

            // Wait for session to be established
            const { data: { session: newSession } } = await supabase.auth.getSession();
            if (newSession) {
              console.log('[useAutoRegister] Session established successfully:', newSession.user.id);
            } else {
              console.warn('[useAutoRegister] Session not found after sign in');
            }
          } else {
            console.warn('[useAutoRegister] Unexpected response from edge function:', data);
          }

          if (mounted) setIsReady(true);
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            console.error('[useAutoRegister] Request timeout');
            if (mounted) {
              setError('A regisztráció túl sokáig tartott');
              setIsReady(true);
            }
          } else {
            throw err;
          }
        }
      } catch (err) {
        console.error('[useAutoRegister] Unexpected error:', err);
        if (mounted) {
          setError('Váratlan hiba történt');
          setIsReady(true);
        }
      }
    };

    autoRegister();

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
};
