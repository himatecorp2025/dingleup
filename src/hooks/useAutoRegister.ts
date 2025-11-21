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
        // Check if user already has session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('[useAutoRegister] Existing session found');
          setIsReady(true);
          return;
        }

        // Get or create device_id
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
          console.log('[useAutoRegister] Created new device_id');
        } else {
          console.log('[useAutoRegister] Existing device_id found');
        }

        // Call auto-register edge function
        const { data, error } = await supabase.functions.invoke('auto-register-device', {
          body: { device_id: deviceId },
        });

        if (error) {
          console.error('[useAutoRegister] Registration error:', error);
          setIsReady(true);
          return;
        }

        if (data?.success && data?.email) {
          console.log('[useAutoRegister] Registration successful:', data.existing ? 'existing' : 'new');
          
          // Sign in with device_id as password
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: deviceId,
          });

          if (signInError) {
            console.error('[useAutoRegister] Sign in error:', signInError);
          } else {
            console.log('[useAutoRegister] Signed in successfully');
          }
        }
      } catch (err) {
        console.error('[useAutoRegister] Unexpected error:', err);
      } finally {
        setIsReady(true);
      }
    };

    autoRegister();
  }, [navigate]);

  return { isReady };
};
