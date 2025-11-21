import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const DEVICE_ID_KEY = 'dingleup_device_id';

export const useAutoRegister = () => {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const autoRegister = async () => {
      try {
        // Check if user already has session - this is fast
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsReady(true);
          return;
        }

        // Get or create device_id - this is instant
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        // Set ready immediately for better UX - registration continues in background
        setIsReady(true);

        // Call auto-register edge function with short timeout
        const { data, error } = await supabase.functions.invoke('auto-register-device', {
          body: { device_id: deviceId },
        });

        if (error) {
          console.error('[useAutoRegister] Registration error:', error);
          return;
        }

        if (data?.success && data?.email) {
          // Sign in with device_id as password
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: deviceId,
          });

          if (signInError) {
            console.error('[useAutoRegister] Sign in error:', signInError);
          }
        }
      } catch (err) {
        console.error('[useAutoRegister] Unexpected error:', err);
        setIsReady(true);
      }
    };

    autoRegister();
  }, [navigate]);

  return { isReady };
};
