import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { isAppEnvironment } from '@/lib/appEnvironment';
import { Download, Smartphone } from 'lucide-react';
import { useI18n } from '@/i18n';

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
 * shows install prompt instead
 */
export const AppEnvironmentGuard = ({ children }: AppEnvironmentGuardProps) => {
  const location = useLocation();
  const { t } = useI18n();

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
    // Regular browser (not PWA/native) trying to access game routes → show install prompt
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
              {t('install.pwa_required_title') || 'Telepítsd a DingleUP! appot!'}
            </h1>

            {/* Description */}
            <p className="text-white/70 text-sm leading-relaxed">
              {t('install.pwa_required_description') || 
                'A DingleUP! játék kizárólag alkalmazásként érhető el. Telepítsd PWA-ként vagy natív appként a telefonodra!'}
            </p>

            {/* Install Button */}
            <Link
              to="/install"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold text-lg rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/50"
            >
              <Download className="w-6 h-6" />
              {t('install.install_now') || 'Telepítés most'}
            </Link>

            {/* Home Link */}
            <Link
              to="/"
              className="text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              {t('install.back_to_home') || 'Vissza a főoldalra'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // App environment (PWA or native) - allow access
  return <>{children}</>;
};
