import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Lock, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useI18n } from "@/i18n";
import { getCountryFromTimezone } from "@/lib/utils";
import type { LangCode } from "@/i18n/types";
import loadingLogo from '@/assets/dingleup-loading-logo.png';

const createRegisterSchema = (t: (key: string) => string) => z.object({
  username: z.string()
    .trim()
    .min(3, t('auth.register.validationUsernameMinLength'))
    .max(30, t('auth.register.validationUsernameMaxLength'))
    .regex(/^[a-zA-Z0-9_áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+$/, t('auth.register.validationUsernameNoSpaces')),
  pin: z.string()
    .regex(/^\d{6}$/, t('auth.register.validationPinFormat')),
  pinConfirm: z.string(),
  invitationCode: z.string().optional()
}).refine(data => data.pin === data.pinConfirm, {
  message: t('auth.register.validationPinMismatch'),
  path: ["pinConfirm"],
}).refine(data => {
  const pin = data.pin;
  if (pin.length !== 6) return true;
  
  // 1. Nem kezdődhet 20-szal vagy 19-cel
  if (pin.startsWith('20') || pin.startsWith('19')) {
    return false;
  }
  
  // 2. Nem lehet három egymást követően ugyanaz a szám
  for (let i = 0; i < pin.length - 2; i++) {
    if (pin[i] === pin[i+1] && pin[i+1] === pin[i+2]) {
      return false;
    }
  }
  
  // 3. Nem lehet növekvő vagy csökkenő sorrendben (három egymást követő szám)
  for (let i = 0; i < pin.length - 2; i++) {
    const a = parseInt(pin[i]);
    const b = parseInt(pin[i+1]);
    const c = parseInt(pin[i+2]);
    
    // Növekvő sorrend ellenőrzése (pl. 1-2-3, 2-3-4)
    if (b === a + 1 && c === b + 1) {
      return false;
    }
    
    // Csökkenő sorrend ellenőrzése (pl. 7-6-5, 6-5-4)
    if (b === a - 1 && c === b - 1) {
      return false;
    }
  }
  
  return true;
}, {
  message: "A PIN kód nem felel meg a biztonsági követelményeknek: nem kezdődhet 19-cel vagy 20-szal, nem tartalmazhat három azonos számot egymás után, és nem lehet növekvő vagy csökkenő sorrendben",
  path: ["pin"]
});

const RegisterNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, setLang, isLoading: i18nLoading } = useI18n();
  
  const registerSchema = createRegisterSchema(t);
  type RegisterForm = z.infer<typeof registerSchema>;
  const [formData, setFormData] = useState<RegisterForm>({
    username: "",
    pin: "",
    pinConfirm: "",
    invitationCode: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://');
      setIsStandalone(isPWA);
    };
    checkStandalone();

    // Read invitation code from URL (?code=ABC123)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setFormData(prev => ({ ...prev, invitationCode: code }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = registerSchema.parse(formData);

      // Call register edge function with optional invitation code
      const { data: regData, error: regError } = await supabase.functions.invoke('register-with-username-pin', {
        body: {
          username: validated.username,
          pin: validated.pin,
          invitationCode: validated.invitationCode || null,
        },
      });

      if (regError || regData?.error) {
        toast({
          title: t('auth.register.error_title'),
          description: regData?.error || t('auth.register.errorRegisterFailed'),
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      if (!regData?.success || !regData?.user) {
        toast({
          title: t('auth.register.error_title'),
          description: t('auth.register.errorRegisterUnsuccessful'),
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      // Auto-login after successful registration
      const autoEmail = `${validated.username.toLowerCase()}@dingleup.auto`;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: autoEmail,
        password: validated.pin + validated.username,
      });

      if (signInError) {
        console.error('Auto-login error:', signInError);
        toast({
          title: t('auth.register.success_title'),
          description: t('auth.register.successPleaseLogin'),
          duration: 3000,
        });
        navigate('/auth/login');
        return;
      }

      toast({
        title: t('auth.register.success_title'),
        description: t('auth.register.successMessage'),
        duration: 3000,
      });
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RegisterForm, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterForm] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Registration error:', error);
        toast({
          title: t('auth.register.error_title'),
          description: t('auth.register.errorUnexpected'),
          variant: "destructive",
          duration: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Removed i18n loading screen - translations load instantly with static import

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
            aria-label={t('auth.register.backButton')}
          >
            <ArrowLeft className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-4 mt-2">
            <img 
              src={loadingLogo} 
              alt="DingleUP! Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain" 
            />
          </div>

          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-center mb-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] break-words hyphens-auto px-2">
            {t('auth.register.title')}
          </h1>
          <p className="text-center text-white/70 mb-6 text-xs xs:text-sm sm:text-base font-medium break-words px-4">
            {t('auth.register.subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.register.usernameLabel')}</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base"
                  placeholder={t('auth.register.usernamePlaceholder')}
                  disabled={isLoading}
                  maxLength={30}
                />
              </div>
              {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.register.pinLabel')}</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="h-12 pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base"
                  placeholder={t('auth.register.pinPlaceholder')}
                  disabled={isLoading}
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  aria-label={showPin ? t('auth.register.hidePin') : t('auth.register.showPin')}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.pin && <p className="text-sm text-red-400">{errors.pin}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.register.pinConfirmLabel')}</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  type={showPinConfirm ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.pinConfirm}
                  onChange={(e) => setFormData({ ...formData, pinConfirm: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="h-12 pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base"
                  placeholder={t('auth.register.pinPlaceholder')}
                  disabled={isLoading}
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPinConfirm(!showPinConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  aria-label={showPinConfirm ? t('auth.register.hidePin') : t('auth.register.showPin')}
                >
                  {showPinConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.pinConfirm && <p className="text-sm text-red-400">{errors.pinConfirm}</p>}
            </div>

            {/* Invitation Code (Optional) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <span>{t('auth.register.invitationCodeLabel')}</span>
                <span className="text-xs text-white/50">({t('auth.register.optional')})</span>
              </Label>
              <div className="relative group">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <Input
                  type="text"
                  value={formData.invitationCode}
                  onChange={(e) => setFormData({ ...formData, invitationCode: e.target.value.toUpperCase().trim() })}
                  className="h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base uppercase"
                  placeholder={t('auth.register.invitationCodePlaceholder')}
                  disabled={isLoading}
                  maxLength={8}
                />
              </div>
              <p className="text-xs text-white/50">{t('auth.register.invitationCodeHint')}</p>
            </div>

            <p className="text-center text-white/60 text-xs sm:text-sm mb-3 px-2">
              {t('auth.register.termsPrefix')}{' '}
              <a 
                href="/aszf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
              >
                {t('auth.register.termsLink')}
              </a>
              {' '}{t('auth.register.termsAnd')}{' '}
              <a 
                href="/adatkezeles" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 underline transition-colors"
              >
                {t('auth.register.privacyLink')}
              </a>
              .
            </p>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300 text-base"
              disabled={isLoading}
            >
              {isLoading ? t('auth.register.submittingButton') : t('auth.register.submitButton')}
            </Button>
          </form>

          <p className="text-center text-white/60 mt-6 text-xs xs:text-sm break-words px-2">
            {t('auth.register.alreadyHaveAccount')}{' '}
            <button
              onClick={() => navigate('/auth/login')}
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              {t('auth.register.loginLink')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterNew;
