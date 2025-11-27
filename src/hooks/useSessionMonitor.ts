import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n';

export const useSessionMonitor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.log('[SessionMonitor] Session invalid, redirecting to login');
          toast({
            title: t('session.expired_title'),
            description: t('session.expired_description'),
            variant: "destructive",
            duration: 4000,
          });
          
          await supabase.auth.signOut();
          navigate('/auth/login', { replace: true });
        }
      } catch (err) {
        console.error('[SessionMonitor] Error validating session:', err);
      }
    };

    // Initial validation
    validateSession();

    // Periodic validation every 5 minutes (less aggressive)
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate, location.pathname, t]);
};
