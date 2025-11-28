import { ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { isAppEnvironment } from '@/lib/appEnvironment';

interface AppEnvironmentGuardProps {
  children: ReactNode;
}

/**
 * Universal app environment guard for all devices (desktop, mobile, tablet)
 * 
 * Rules:
 * - Landing page (/) always accessible
 * - Install page (/install) always accessible
 * - Admin pages (/admin/*) always accessible
 * - All other routes: ONLY accessible in PWA standalone or native app mode
 * 
 * If user tries to access game routes in a regular browser (not PWA/native),
 * redirects to /install page
 */
export const AppEnvironmentGuard = ({ children }: AppEnvironmentGuardProps) => {
  const location = useLocation();

  // Always allow these routes regardless of environment
  const publicRoutes = ['/', '/install', '/aszf', '/adatkezeles'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isPublicRoute || isAdminRoute) {
    return <>{children}</>;
  }

  // Check if running in app environment (PWA standalone or native)
  const isAppEnv = isAppEnvironment();

  if (!isAppEnv) {
    // Regular browser (not PWA/native) trying to access game routes → redirect to /install
    return <Navigate to="/install" replace />;
  }

  // App environment (PWA or native) - allow access
  return <>{children}</>;
};
