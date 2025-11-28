import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface MobileBrowserGuardProps {
  children: ReactNode;
}

/**
 * Platform-based access guard for game functionality
 * 
 * Rules:
 * - Desktop browser: Full access (all pages)
 * - Mobile browser (online): Only Landing Page + Admin pages
 * - PWA/Native app: Full access (all pages)
 * 
 * Blocks mobile browser users from accessing:
 * - Auth pages (/auth/*)
 * - Dashboard
 * - Game pages
 * - Profile
 * - Leaderboard
 * - All game functionality
 * 
 * Redirects mobile browser users to /install page
 */
export const MobileBrowserGuard = ({ children }: MobileBrowserGuardProps) => {
  const { isHandheld, isStandalone } = usePlatformDetection();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Mobile browser online (not PWA/native) detection
    const isMobileBrowserOnline = isHandheld && !isStandalone;
    
    if (!isMobileBrowserOnline) {
      // Desktop or PWA/Native - allow full access
      return;
    }

    // Define blocked routes for mobile browser
    const gameRoutes = [
      '/auth/choice',
      '/auth/register', 
      '/auth/login',
      '/dashboard',
      '/game',
      '/game-rules',
      '/profile',
      '/profile/game',
      '/leaderboard',
      '/registration-success',
      '/payment-success',
      '/invitation',
      '/about',
      '/gifts',
      '/popular-content'
    ];

    // Check if current path is a game route
    const isGameRoute = gameRoutes.some(route => location.pathname.startsWith(route));

    if (isGameRoute) {
      // Mobile browser trying to access game functionality → redirect to install page
      navigate('/install', { replace: true });
    }
  }, [isHandheld, isStandalone, location.pathname, navigate]);

  // Always render children - redirect happens in useEffect
  return <>{children}</>;
};
