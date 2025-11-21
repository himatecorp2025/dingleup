import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";

interface AppRouteGuardProps {
  children: React.ReactNode;
}

export const AppRouteGuard = ({ children }: AppRouteGuardProps) => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
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

  // Mobile/tablet: handle root path navigation
  if (isMobileOrTablet && location.pathname === '/') {
    // Always go to account-choice first, let that page handle the flow
    return <Navigate to="/account-choice" replace />;
  }

  // Mobile/tablet standalone: redirect to /intro ONLY on first load (from root or desktop)
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
