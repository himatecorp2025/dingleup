import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEVICE_ID_KEY = 'dingleup_device_id';

// Helper function to get or create device ID
const getOrCreateDeviceId = (): string => {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('[DeviceID] Created new device_id:', deviceId.substring(0, 8) + '...');
    } else {
      console.log('[DeviceID] Using existing device_id:', deviceId.substring(0, 8) + '...');
    }
    return deviceId;
  } catch (err) {
    console.error('[DeviceID] Error accessing localStorage:', err);
    return crypto.randomUUID(); // Fallback without storage
  }
};

export const useAutoRegister = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useAutoRegister] Hook mounted and useEffect running');
    let mounted = true;

    const autoRegister = async () => {
      try {
        console.log('[useAutoRegister] Starting auto-registration process...');
        
        // Check if user already has session
        console.log('[useAutoRegister] Checking for existing session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[useAutoRegister] Session check error:', sessionError);
        }
        
        if (session) {
          console.log('[useAutoRegister] ✓ Session already exists:', session.user.id);
          if (mounted) setIsReady(true);
          return;
        }

        console.log('[useAutoRegister] No existing session, proceeding with registration...');

        // Get or create device_id
        const deviceId = getOrCreateDeviceId();
        console.log('[useAutoRegister] Device ID ready:', deviceId.substring(0, 8) + '...');

        console.log('[useAutoRegister] Invoking auto-register-device function...');

        // Call auto-register edge function
        const { data, error: invokeError } = await supabase.functions.invoke('auto-register-device', {
          body: { device_id: deviceId },
        });

        if (invokeError) {
          console.error('[useAutoRegister] ✗ Edge function invocation error:', invokeError);
          if (mounted) {
            setError('Regisztrációs hiba történt');
            setIsReady(true);
          }
          return;
        }

        console.log('[useAutoRegister] ✓ Edge function response:', data);

        if (!data?.success) {
          console.error('[useAutoRegister] ✗ Registration failed:', data);
          if (mounted) {
            setError('A regisztráció sikertelen volt');
            setIsReady(true);
          }
          return;
        }

        if (!data?.email) {
          console.error('[useAutoRegister] ✗ No email in response:', data);
          if (mounted) {
            setError('Nincs email a válaszban');
            setIsReady(true);
          }
          return;
        }

        console.log('[useAutoRegister] ✓ Registration successful! Email:', data.email);
        console.log('[useAutoRegister] Signing in with credentials...');
        
        // Sign in with device_id as password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: deviceId,
        });

        if (signInError) {
          console.error('[useAutoRegister] ✗ Sign in error:', signInError);
          if (mounted) {
            setError('Bejelentkezési hiba történt');
            setIsReady(true);
          }
          return;
        }

        console.log('[useAutoRegister] ✓ Sign in successful! User:', signInData.user?.id);

        // Verify session was established
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession) {
          console.log('[useAutoRegister] ✓✓ Session established successfully!');
        } else {
          console.warn('[useAutoRegister] ⚠ Session not found after sign in');
        }

        if (mounted) {
          console.log('[useAutoRegister] Setting isReady to true');
          setIsReady(true);
        }
      } catch (err) {
        console.error('[useAutoRegister] ✗✗ Unexpected error:', err);
        if (mounted) {
          setError('Váratlan hiba történt');
          setIsReady(true);
        }
      }
    };

    // Start auto-registration
    autoRegister();

    return () => {
      console.log('[useAutoRegister] Hook unmounting');
      mounted = false;
    };
  }, []);

  console.log('[useAutoRegister] Rendering with isReady:', isReady, 'error:', error);

  return { isReady, error };
};
