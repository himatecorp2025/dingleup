import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { Download, Smartphone } from 'lucide-react';
import { useI18n } from '@/i18n';

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
 * Shows InstallPrompt instead of blocked content
 */
export const MobileBrowserGuard = ({ children }: MobileBrowserGuardProps) => {
  const { isHandheld, isStandalone } = usePlatformDetection();
  const location = useLocation();
  const { t } = useI18n();

  // Mobile browser online (not PWA/native) detection
  const isMobileBrowserOnline = isHandheld && !isStandalone;
  
  if (!isMobileBrowserOnline) {
    // Desktop or PWA/Native - allow full access
    return <>{children}</>;
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
    // Mobile browser trying to access game functionality → show install prompt
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <div className="flex flex-col items-center text-center gap-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-purple-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white">
              {t('install.pwa_required_title') || 'Install DingleUP!'}
            </h1>

            {/* Description */}
            <p className="text-white/70 text-sm leading-relaxed">
              {t('install.pwa_required_description') || 
                'To play DingleUP!, you need to install the app on your device. The game is only available as a PWA or native app, not in mobile browsers.'}
            </p>

            {/* Install Button */}
            <Link
              to="/install"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold text-lg rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/50"
            >
              <Download className="w-6 h-6" />
              {t('install.install_now') || 'Install Now'}
            </Link>

            {/* Home Link */}
            <Link
              to="/"
              className="text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              {t('install.back_to_home') || 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not a game route - allow access
  return <>{children}</>;
};
