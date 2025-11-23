import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

/**
 * PERFORMANCE OPTIMIZATION: Centralized auth hook
 * Consolidates all session validation and user data fetching
 * Eliminates duplicated auth.getSession() calls across components
 * Single source of truth for authentication state
 */

interface UseAuthReturn {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  getSession: () => Promise<Session | null>;
  getUser: () => Promise<User | null>;
}

export const useAuth = (): UseAuthReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized session fetch with caching
  const getSession = useCallback(async (): Promise<Session | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[useAuth] Session fetch error:', error);
        return null;
      }
      setSession(session);
      return session;
    } catch (err) {
      console.error('[useAuth] Session fetch exception:', err);
      return null;
    }
  }, []);

  // Centralized user fetch with caching
  const getUser = useCallback(async (): Promise<User | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('[useAuth] User fetch error:', error);
        return null;
      }
      setUser(user);
      return user;
    } catch (err) {
      console.error('[useAuth] User fetch exception:', err);
      return null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    getSession().finally(() => setIsLoading(false));
  }, [getSession]);

  // Listen for auth state changes (login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    getSession,
    getUser,
  };
};
