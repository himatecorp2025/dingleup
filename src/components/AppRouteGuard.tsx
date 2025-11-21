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

  // Check session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Standalone intro-first guard (no landing page in app)
  const isStandalone = (() => {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
    } catch {
      return false;
    }
  })();

  // Clear intro flag when app starts in standalone mode to ensure intro plays on every app launch
  useEffect(() => {
    if (isStandalone) {
      try {
        sessionStorage.removeItem('app_intro_shown');
      } catch {}
    }
  }, [isStandalone]);

  const introShown = typeof window !== 'undefined' 
    ? sessionStorage.getItem('app_intro_shown') === '1' 
    : false;

  // Mobile/tablet: skip landing page, go directly to intro or auth/dashboard based on session
  if (isMobileOrTablet && location.pathname === '/') {
    if (hasSession === null) {
      // Still checking session - show nothing
      return null;
    }

    if (!introShown) {
      return <Navigate to="/intro" replace />;
    }

    if (hasSession) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/auth/choice" replace />;
    }
  }

  // Mobile/tablet standalone: redirect to /intro ONLY on first load (from root)
  if (isMobileOrTablet && isStandalone && !introShown && 
      (location.pathname === '/' || location.pathname === '/desktop')) {
    return <Navigate to="/intro" replace />;
  }

  // Admin pages always accessible
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Desktop: only landing and admin pages accessible
  if (!isMobileOrTablet && location.pathname !== '/' && location.pathname !== '/desktop' && !location.pathname.startsWith('/admin')) {
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

  return <>{children}</>;
};
