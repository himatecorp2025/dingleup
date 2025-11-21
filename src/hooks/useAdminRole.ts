import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Call backend to verify admin role
        const { data, error: invocationError } = await supabase.functions.invoke(
          'admin-check-role',
          {
            headers: {
              Authorization: `Bearer ${session.session.access_token}`,
            },
          }
        );

        if (invocationError) {
          console.error('[useAdminRole] Error checking role:', invocationError);
          setError(invocationError.message);
          setIsAdmin(false);
        } else if (data?.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('[useAdminRole] Unexpected error:', err);
        setError('Failed to check admin status');
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();

    // Re-check on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, error };
};
