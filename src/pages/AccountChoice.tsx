import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { UserPlus, LogIn } from 'lucide-react';

export default function AccountChoice() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleNoAccount = () => {
    // Auto-registration már megtörtént a useAutoRegister hook által
    // Csak navigáljunk a dashboardra, ahol az age-gate modal megjelenik
    navigate('/dashboard');
  };

  const handleHasAccount = () => {
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
        {/* Logo */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 drop-shadow-lg">
            DingleUP!
          </h1>
          <h2 className="text-2xl font-bold text-white">
            {t('auth.accountChoice.title')}
          </h2>
          <p className="text-white/70 text-sm">
            {t('auth.accountChoice.description')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleNoAccount}
            className="w-full h-20 text-base font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/50 transition-all transform hover:scale-105 flex items-center justify-start px-6"
          >
            <UserPlus className="mr-3 h-6 w-6 flex-shrink-0" />
            <span className="text-left leading-tight">
              {t('auth.accountChoice.noAccountButton')}
            </span>
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
