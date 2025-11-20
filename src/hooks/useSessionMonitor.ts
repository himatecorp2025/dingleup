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
    const publicPaths = ['/', '/desktop', '/login', '/register', '/about', '/intro', '/admin/login', '/login-username'];
    const isPublicPage = publicPaths.some(path => location.pathname === path);
    
    // Skip session monitoring on public pages
    if (isPublicPage) {
      return;
    }

    // Check session validity every 5 minutes for protected pages
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
  }, [navigate, location.pathname, isValidating]);
};
