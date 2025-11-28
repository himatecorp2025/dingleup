import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AppRouteGuardProps {
  children: React.ReactNode;
}

export const AppRouteGuard = ({ children }: AppRouteGuardProps) => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const location = useLocation();

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobileOrTablet(width <= 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Optimized session check - only check once on mount, then rely on auth state changes
  useEffect(() => {
    // Single session check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Admin pages always accessible
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Desktop: only landing and admin pages accessible
  // CRITICAL: This message must ONLY appear on desktop, never on mobile/tablet
  if (!isMobileOrTablet && location.pathname !== '/' && location.pathname !== '/desktop' && !location.pathname.startsWith('/admin')) {
    // Extra safety check: verify screen width to ensure we're on desktop
    const screenWidth = window.innerWidth;
    if (screenWidth > 1024) {
      return (
        <div className="h-dvh h-svh w-screen flex items-center justify-center bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
          <div className="text-center px-6 max-w-md">
            <h1 className="text-3xl font-black text-foreground mb-4">📱 Csak mobilon és táblagépen elérhető</h1>
            <p className="text-foreground/80 mb-6">
              Ez az alkalmazás csak telefonon és táblagépen használható. 
              Kérjük, nyisd meg mobil eszközön!
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold rounded-lg hover:brightness-110 transition-all"
            >
              Vissza a főoldalra
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
