import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Lock, Eye, EyeOff, Fingerprint } from "lucide-react";
import { z } from "zod";
import { useI18n } from "@/i18n";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { BiometricSetupModal } from "@/components/BiometricSetupModal";

const createLoginSchema = (t: (key: string) => string) => z.object({
  username: z.string().trim().min(1, t('auth.login.validationUsernameRequired')).regex(/^[^\s]+$/, t('auth.login.validationUsernameNoSpaces')),
  pin: z.string().regex(/^\d{6}$/, t('auth.login.validationPinFormat')),
});

const LoginNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  
  const loginSchema = createLoginSchema(t);
  type LoginForm = z.infer<typeof loginSchema>;
  const [formData, setFormData] = useState<LoginForm>({
    username: "",
    pin: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricAttempted, setBiometricAttempted] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const { authenticateBiometric, checkBiometricAvailable, isSupported } = useWebAuthn();

  useEffect(() => {
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://');
      setIsStandalone(isPWA);
      return isPWA;
    };
    
    const isPWA = checkStandalone();

    // Check if biometric is available for saved username
    const checkBiometric = async () => {
      const savedUsername = localStorage.getItem('lastUsername');
      if (savedUsername && isSupported) {
        const isAvailable = await checkBiometricAvailable(savedUsername);
        setBiometricAvailable(isAvailable);
        
        // PWA módban automatikus biometrikus login minden betöltéskor
        // Web módban csak első alkalommal próbálkozunk
        if (isAvailable && (!biometricAttempted || isPWA)) {
          setBiometricAttempted(true);
          handleBiometricLogin(savedUsername);
        }
      }
    };

    checkBiometric();
  }, []);

  const handleBiometricLogin = async (username?: string) => {
    setIsBiometricLoading(true);
    try {
      const savedUsername = username || localStorage.getItem('lastUsername');
      if (!savedUsername) {
        toast({
          title: "Hiba",
          description: t('auth.login.noSavedUsername'),
          variant: "destructive",
        });
        return;
      }

      await authenticateBiometric(savedUsername);
      navigate('/dashboard');
    } catch (error) {
      console.error('Biometric login failed:', error);
      toast({
        title: "Hiba",
        description: t('auth.login.biometricFailed'),
        variant: "destructive",
      });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = loginSchema.parse(formData);

      // Call login edge function
      const { data: loginData, error: loginError } = await supabase.functions.invoke('login-with-username-pin', {
        body: {
          username: validated.username,
          pin: validated.pin,
        },
      });

      if (loginError || loginData?.error) {
        toast({
          title: "Hiba",
          description: loginData?.error || t('auth.login.errorLoginFailed'),
          variant: "destructive",
        });
        return;
      }

      if (!loginData?.success || !loginData?.user?.email || !loginData?.passwordVariants) {
        toast({
          title: "Hiba",
          description: t('auth.login.errorLoginUnsuccessful'),
          variant: "destructive",
        });
        return;
      }

      // Try signing in with password variants (handles migration edge cases)
      let signInSuccess = false;
      for (const password of loginData.passwordVariants) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginData.user.email,
          password,
        });

        if (!signInError) {
          signInSuccess = true;
          break;
        }
      }

      if (!signInSuccess) {
        toast({
          title: "Hiba",
          description: t('auth.login.errorInvalidCredentials'),
          variant: "destructive",
        });
        return;
      }

      // Save username for biometric login
      localStorage.setItem('lastUsername', validated.username);

      // Check if biometric should be offered on new device
      if (isSupported) {
        const isAvailable = await checkBiometricAvailable(validated.username);
        if (!isAvailable) {
          // Offer biometric setup on new device
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setFormData({ username: validated.username, pin: '' });
            setShowBiometricModal(true);
            return;
          }
        }
      }

      const loginToast = toast({
        title: "🎉 Sikeres bejelentkezés! 🎉",
        description: "Örülünk, hogy újra látunk! Indulhat a játék?",
        className: "bg-gradient-to-r from-green-500/90 to-emerald-500/90 border-green-400/50 text-white shadow-2xl shadow-green-500/50",
      });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        loginToast.dismiss();
      }, 3000);
      
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginForm, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginForm] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Login error:', error);
        toast({
          title: "Hiba",
          description: t('auth.login.errorUnexpected'),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 relative">
          <button 
            onClick={() => navigate('/auth/choice')} 
            className="absolute left-4 top-4 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors duration-200 group z-10 min-w-[44px] min-h-[44px] flex items-center justify-center" 
            aria-label={t('auth.login.backButton')}
          >
            <ArrowLeft className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-4 mt-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              <img 
                src="/logo.png" 
                alt="DingleUP! Logo" 
                className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 transform group-hover:scale-110 transition-transform duration-300" 
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-center mb-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">
            {t('auth.login.title')}
          </h1>
          <p className="text-center text-white/70 mb-6 text-sm font-medium">
            {t('auth.login.subtitle')}
          </p>

          {/* Biometric Login Button - csak web módban látható */}
          {biometricAvailable && !isStandalone && (
            <div className="mb-4">
              <Button
                type="button"
                onClick={() => handleBiometricLogin()}
                disabled={isBiometricLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 text-base flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                {isBiometricLoading ? t('auth.login.biometricAuthenticating') : t('auth.login.biometricLogin')}
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] px-2 text-white/60">
                    {t('auth.login.orWithPin')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PWA módban biometrikus azonosítás visszajelzés */}
          {isStandalone && isBiometricLoading && (
            <div className="mb-4 text-center">
              <div className="inline-flex items-center gap-2 text-purple-400 animate-pulse">
                <Fingerprint className="w-6 h-6" />
                <span className="font-medium">{t('auth.login.biometricAuthenticating')}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.login.usernameLabel')}</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base"
                  placeholder={t('auth.login.usernamePlaceholder')}
                  disabled={isLoading}
                />
              </div>
              {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.login.pinLabel')}</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="h-12 pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base"
                  placeholder={t('auth.login.pinPlaceholder')}
                  disabled={isLoading}
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  aria-label={showPin ? t('auth.login.hidePin') : t('auth.login.showPin')}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.pin && <p className="text-sm text-red-400">{errors.pin}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300 text-base"
              disabled={isLoading}
            >
              {isLoading ? t('auth.login.submittingButton') : t('auth.login.submitButton')}
            </Button>
          </form>

          <p className="text-center text-white/60 mt-6 text-sm">
            {t('auth.login.noAccountYet')}{' '}
            <button
              onClick={() => navigate('/auth/register')}
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              {t('auth.login.registerLink')}
            </button>
          </p>
        </div>
      </div>

      {/* Biometric Setup Modal for new device */}
      {showBiometricModal && formData.username && (
        <BiometricSetupModal
          open={showBiometricModal}
          onClose={() => {
            setShowBiometricModal(false);
            navigate("/dashboard");
          }}
          username={formData.username}
          userId="" // Will be fetched from session
          onSuccess={() => {
            const loginToast = toast({
              title: "🎉 Sikeres bejelentkezés! 🎉",
              description: "Örülünk, hogy újra látunk! Indulhat a játék?",
              className: "bg-gradient-to-r from-green-500/90 to-emerald-500/90 border-green-400/50 text-white shadow-2xl shadow-green-500/50",
            });
            
            // Auto-dismiss after 3 seconds
            setTimeout(() => {
              loginToast.dismiss();
            }, 3000);
          }}
        />
      )}
    </div>
  );
};

export default LoginNew;
