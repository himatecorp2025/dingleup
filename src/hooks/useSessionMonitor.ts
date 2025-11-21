import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const useSessionMonitor = () => {
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Public pages that don't require session monitoring
    const publicPaths = ['/', '/desktop', '/account-choice', '/auth/login', '/about', '/intro', '/admin/login', '/legal/aszf', '/legal/privacy'];
    const isPublicPage = publicPaths.some(path => location.pathname === path);
    
    // Skip session monitoring on public pages
    if (isPublicPage) {
      return;
    }

    // SECURITY: Check session validity every 15 minutes (session timeout)
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
          navigate('/account-choice', { replace: true });
        }
      } catch (err) {
        console.error('[SessionMonitor] Error validating session:', err);
      } finally {
        setIsValidating(false);
      }
    };

    // Initial validation
    validateSession();

    // SECURITY: Periodic validation every 15 minutes (session timeout)
    const interval = setInterval(validateSession, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate, location.pathname, isValidating]);
};
