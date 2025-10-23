import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWeeklyLogin = (userId: string | undefined) => {
  const [hasChecked, setHasChecked] = useState(false);
  const [loginState, setLoginState] = useState<{
    loginIndex: number;
    goldAwarded: number;
    livesAwarded: number;
  } | null>(null);

  useEffect(() => {
    if (!userId || hasChecked) return;

    const checkAndAwardLogin = async () => {
      try {
        console.log('[WEEKLY-LOGIN-HOOK] Checking weekly login reward');
        
        const { data, error } = await supabase.functions.invoke('weekly-login-reward');
        
        if (error) throw error;

        if (data?.success && !data?.throttled) {
          console.log('[WEEKLY-LOGIN-HOOK] Reward awarded:', data);
          setLoginState({
            loginIndex: data.login_index,
            goldAwarded: data.gold_awarded,
            livesAwarded: data.lives_awarded
          });

          // Show success toast
          toast.success(
            `🎉 ${data.login_index}. heti belépés! +${data.gold_awarded} arany${data.lives_awarded > 0 ? ` +${data.lives_awarded} élet` : ''}`,
            { duration: 5000 }
          );
        } else if (data?.throttled) {
          console.log('[WEEKLY-LOGIN-HOOK] Throttled:', data.message);
        }

        setHasChecked(true);
      } catch (error: any) {
        console.error('[WEEKLY-LOGIN-HOOK] Error:', error);
      }
    };

    // Check after a short delay to ensure user is fully authenticated
    const timeout = setTimeout(checkAndAwardLogin, 1000);
    return () => clearTimeout(timeout);
  }, [userId, hasChecked]);

  return { loginState };
};