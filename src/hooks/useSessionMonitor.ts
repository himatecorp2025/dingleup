import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

/**
 * PERFORMANCE OPTIMIZATION: Session monitoring using centralized useAuth hook
 * Eliminates duplicated session validation logic
 */
export const useSessionMonitor = () => {
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getSession } = useAuth();

  useEffect(() => {
    // Public pages that don't require session monitoring
    const publicPaths = ['/', '/desktop', '/auth/choice', '/auth/register', '/auth/login', '/about', '/intro', '/admin/login'];
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
        const session = await getSession();
        
        if (!session) {
          console.log('[SessionMonitor] Session invalid, redirecting to login');
          toast({
            title: "Munkamenet lejárt",
            description: "Kérjük, jelentkezz be újra.",
            variant: "destructive",
            duration: 4000,
          });
          navigate('/auth/login', { replace: true });
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
  }, [navigate, location.pathname, isValidating, getSession]);
};
