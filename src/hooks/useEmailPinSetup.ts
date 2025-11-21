import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const EMAIL_PIN_SETUP_DELAY_MS = 3 * 60 * 1000; // 3 perc

export const useEmailPinSetup = (userId: string | undefined) => {
  const [showEmailPinSetup, setShowEmailPinSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const checkEmailPinStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email_pin_setup_completed, first_login_age_gate_completed, age_verified')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('[useEmailPinSetup] Error fetching status:', error);
          setLoading(false);
          return;
        }

        // Csak akkor dobjuk fel a popup-ot, ha:
        // - age-gate completed
        // - age verified
        // - email+PIN még nincs beállítva
        if (
          data?.first_login_age_gate_completed &&
          data?.age_verified &&
          !data?.email_pin_setup_completed
        ) {
          // 3 perc késleltetés
          const timeoutId = setTimeout(() => {
            setShowEmailPinSetup(true);
          }, EMAIL_PIN_SETUP_DELAY_MS);

          setLoading(false);

          return () => clearTimeout(timeoutId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[useEmailPinSetup] Unexpected error:', err);
        setLoading(false);
      }
    };

    checkEmailPinStatus();
  }, [userId]);

  return { showEmailPinSetup, loading, hideEmailPinSetup: () => setShowEmailPinSetup(false) };
};
