import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const useSessionMonitor = () => {
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check session validity every 5 minutes
    const validateSession = async () => {
      if (isValidating) return;
      
      setIsValidating(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.log('[SessionMonitor] Session invalid, redirecting to login');
          toast({
            title: "Munkamenet lejárt",
            description: "Kérjük, jelentkezz be újra.",
            variant: "destructive",
            duration: 4000,
          });
          
          await supabase.auth.signOut();
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('[SessionMonitor] Error validating session:', err);
      } finally {
        setIsValidating(false);
      }
    };

    // Initial validation
    validateSession();

    // Periodic validation every 2 minutes
    const interval = setInterval(validateSession, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate, isValidating]);
};
