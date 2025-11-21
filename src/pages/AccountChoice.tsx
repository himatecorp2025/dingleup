import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { UserPlus, LogIn, Loader2 } from 'lucide-react';
import { useAutoRegister } from '@/hooks/useAutoRegister';
import dingleupLogo from '@/assets/dingleup-logo-circle.png';

export default function AccountChoice() {
  console.log('[AccountChoice] Component rendering');
  const navigate = useNavigate();
  
  // Safe I18n hook with error boundary
  let t: any;
  try {
    const i18n = useI18n();
    t = i18n.t;
  } catch (err) {
    console.error('[AccountChoice] I18n error:', err);
    // Fallback translation function
    t = (key: string) => {
      const fallbacks: Record<string, string> = {
        'auth.accountChoice.title': 'Üdvözlünk!',
        'auth.accountChoice.description': 'Válassz az alábbi lehetőségek közül',
        'auth.accountChoice.noAccountButton': 'Nincs fiókom - Regisztráció',
        'auth.accountChoice.hasAccountButton': 'Van fiókom - Bejelentkezés',
      };
      return fallbacks[key] || key;
    };
  }
  
  const { isReady, error } = useAutoRegister();
  
  console.log('[AccountChoice] Hook values - isReady:', isReady, 'error:', error);

  const handleNoAccount = () => {
    console.log('[AccountChoice] handleNoAccount clicked, isReady:', isReady);
    if (!isReady) {
      console.log('[AccountChoice] Button disabled, registration not ready');
      return;
    }
    console.log('[AccountChoice] Navigating to dashboard...');
    navigate('/dashboard');
  };

  const handleHasAccount = () => {
    console.log('[AccountChoice] handleHasAccount clicked');
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <img 
            src={dingleupLogo} 
            alt="DingleUP!" 
            className="w-32 h-32 mx-auto mb-4 drop-shadow-2xl"
          />
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 drop-shadow-lg">
            DingleUP!
          </h1>
          <h2 className="text-2xl font-bold text-white">
            {t('auth.accountChoice.title')}
          </h2>
          <p className="text-white/70 text-sm">
            {t('auth.accountChoice.description')}
          </p>
          
          {/* Loading indicator */}
          {!isReady && (
            <div className="flex items-center justify-center gap-2 text-white/90 py-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Előkészítés folyamatban...</span>
            </div>
          )}
          
          {/* Error indicator */}
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 py-2">
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleNoAccount}
            disabled={!isReady}
            className="w-full h-20 text-base font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/50 transition-all transform hover:scale-105 flex items-center justify-start px-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {!isReady ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 flex-shrink-0 animate-spin" />
                <span className="text-left leading-tight">
                  Fiók készítése...
                </span>
              </>
            ) : (
              <>
                <UserPlus className="mr-3 h-6 w-6 flex-shrink-0" />
                <span className="text-left leading-tight">
                  {t('auth.accountChoice.noAccountButton')}
                </span>
              </>
            )}
          </Button>

          <Button
            onClick={handleHasAccount}
            className="w-full h-20 text-base font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center justify-start px-6"
          >
            <LogIn className="mr-3 h-6 w-6 flex-shrink-0" />
            <span className="text-left leading-tight">
              {t('auth.accountChoice.hasAccountButton')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
