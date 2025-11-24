import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";

const AuthChoice = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://');
      setIsStandalone(isPWA);
    };
    checkStandalone();
  }, []);

  return (
    <div 
      className="min-h-dvh min-h-svh relative overflow-hidden bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] flex items-center justify-center px-4 sm:px-6 md:px-8"
      style={{
        paddingTop: isStandalone ? 'env(safe-area-inset-top)' : '0',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              <img 
                src="/logo.png" 
                alt="DingleUP! Logo" 
                className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 transform group-hover:scale-110 transition-transform duration-300" 
              />
            </div>
          </div>

          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-center mb-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] break-words hyphens-auto px-2">
            {t('auth.choice.title')}
          </h1>
          <p className="text-center text-white/70 mb-8 text-xs xs:text-sm sm:text-base font-medium break-words px-4">
            {t('auth.choice.subtitle')}
          </p>

          <div className="space-y-4">
            <Button
              onClick={() => navigate('/auth/register')}
              className="w-full h-12 xs:h-14 sm:h-16 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300 text-sm xs:text-base sm:text-lg truncate"
            >
              <UserPlus className="w-5 h-5 xs:w-6 xs:h-6 mr-2 flex-shrink-0" />
              <span className="truncate">{t('auth.choice.no_account')}</span>
            </Button>

            <Button
              onClick={() => navigate('/auth/login')}
              variant="outline"
              className="w-full h-12 xs:h-14 sm:h-16 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 text-sm xs:text-base sm:text-lg truncate"
            >
              <LogIn className="w-5 h-5 xs:w-6 xs:h-6 mr-2 flex-shrink-0" />
              <span className="truncate">{t('auth.choice.have_account')}</span>
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-white/60 hover:text-white/90 text-sm transition-colors underline"
            >
              {t('auth.choice.back')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthChoice;
