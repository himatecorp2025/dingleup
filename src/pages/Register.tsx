import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, Trophy, Calendar } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";

// Schema will use translated messages via t() in component
const getRegisterSchema = (t: any) => z.object({
  username: z.string().min(3, t('auth.usernameMin')).max(50),
  email: z.string().email(t('auth.invalidEmail')).max(255),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    return actualAge >= 16;
  }, t('auth.ageRestriction')),
  password: z.string().min(8, t('auth.passwordMin'))
    .regex(/[a-z]/, t('auth.passwordLowercase'))
    .regex(/[A-Z]/, t('auth.passwordUppercase'))
    .regex(/[^a-zA-Z0-9]/, t('auth.passwordSpecial')),
  passwordConfirm: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, { message: t('auth.termsRequired') }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: t('auth.passwordMismatch'),
  path: ["passwordConfirm"],
});

type RegisterForm = Omit<z.infer<ReturnType<typeof getRegisterSchema>>, 'termsAccepted'> & { termsAccepted: boolean };

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const invitationCode = searchParams.get('code') || '';
  
  const [formData, setFormData] = useState<RegisterForm>({
    username: "", email: "", birthDate: "", password: "", passwordConfirm: "", termsAccepted: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [inviterCode, setInviterCode] = useState(invitationCode);
  
  useEffect(() => {
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://');
      setIsStandalone(isPWA);
    };
    checkStandalone();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const registerSchema = getRegisterSchema(t);
      const validated = registerSchema.parse(formData);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: { username: validated.username, birthDate: validated.birthDate },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        toast({
          title: t('common.error'),
          description: authError.message.includes("already registered") ? t('auth.emailTaken') : authError.message,
          variant: "destructive",
        });
        return;
      }

      if (authData.user) {
        // Create profile via edge function
        const { data: geoData, error: geoError } = await supabase.functions.invoke('register-with-geolocation', {
          body: { 
            userId: authData.user.id, 
            birthDate: validated.birthDate,
            email: validated.email,
            username: validated.username
          }
        });

        if (geoError) {
          console.error('Profile creation failed:', geoError);
          toast({
            title: t('common.error'),
            description: t('auth.profileCreationFailed'),
            variant: "destructive",
          });
          return;
        }

        // Process invitation if provided
        if (inviterCode) {
          try {
            const { error: inviteError } = await supabase.functions.invoke('accept-invitation', {
              body: { invitationCode: inviterCode }
            });

            if (inviteError) {
              console.error('Invitation processing failed:', inviteError);
            }
          } catch (inviteError) {
            console.error('Invitation processing failed:', inviteError);
          }
        }

        // Successfully registered
        toast({
          title: t('auth.registrationSuccess'),
          description: t('auth.welcomeToDingleUp'),
        });
        
        // Listen for auth state change and navigate when session is ready
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            navigate("/dashboard");
          }
        });
      }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Partial<Record<keyof RegisterForm, string>> = {};
      error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterForm] = err.message;
          
          // Special toast notification for age restriction
          if (err.path[0] === 'birthDate') {
            toast({
              title: t('auth.registrationBlocked'),
              description: t('auth.ageRestriction'),
              variant: "destructive",
            });
          }
        }
      });
      setErrors(fieldErrors);
    }
  } finally {
    setIsLoading(false);
  }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast({ title: t('common.error'), description: t('auth.googleSignInFailed'), variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-dvh min-h-svh relative overflow-hidden bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] flex items-center justify-center px-4 sm:px-6 md:px-8" style={{
      paddingTop: isStandalone ? 'calc(env(safe-area-inset-top) + 1rem)' : '1rem',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
    }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-yellow-200 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 my-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <button onClick={() => navigate('/')} className="absolute left-4 top-4 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors duration-200 group z-10 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Vissza">
            <ArrowLeft className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
          </button>

          {/* Logo inside box */}
          <div className="flex justify-center mb-4 mt-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
              <img src="/logo.png" alt="DingleUP! Logo" className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 transform group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-center mb-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400 animate-pulse" />
            {t('auth.register')}
          </h1>
          <p className="text-center text-white/70 mb-6 text-sm font-medium">{t('auth.joinCommunity')} 🎯</p>

          <Button type="button" onClick={handleGoogleAuth} variant="outline" className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 mb-6 text-base" disabled={isLoading}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('auth.registerWithGoogle')}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-transparent text-white/60">{t('auth.or')}</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.username')}</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base" placeholder={t('auth.chooseUsername')} disabled={isLoading} />
              </div>
              {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.email')}</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base" placeholder={t('auth.emailPlaceholder')} disabled={isLoading} />
              </div>
              {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.birthDate')}</Label>
              <div className="relative group w-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors pointer-events-none z-10" />
                <Input 
                  type="date" 
                  value={formData.birthDate} 
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} 
                  className="h-12 w-full pl-10 pr-3 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base [&::-webkit-date-and-time-value]:text-left [&::-webkit-calendar-picker-indicator]:ml-auto" 
                  disabled={isLoading} 
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]} 
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' } as React.CSSProperties}
                />
              </div>
              {errors.birthDate && <p className="text-sm text-red-400">{errors.birthDate}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.password')}</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-12 pl-10 pr-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base" placeholder={t('auth.passwordPlaceholder')} disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.confirmPassword')}</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input type={showPasswordConfirm ? "text" : "password"} value={formData.passwordConfirm} onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })} className="h-12 pl-10 pr-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base" placeholder={t('auth.confirmPasswordPlaceholder')} disabled={isLoading} />
                <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={showPasswordConfirm ? t('auth.hidePassword') : t('auth.showPassword')}>
                  {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.passwordConfirm && <p className="text-sm text-red-400">{errors.passwordConfirm}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">{t('auth.invitationCode')}</Label>
              <Input type="text" value={inviterCode} onChange={(e) => setInviterCode(e.target.value)} className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20 text-base" placeholder={t('auth.invitationCodePlaceholder')} disabled={isLoading} />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox id="terms" checked={formData.termsAccepted} onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked as boolean })} className="mt-1 border-white/20 data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400" disabled={isLoading} />
              <label htmlFor="terms" className="text-sm text-white/70 leading-tight">
                {t('auth.acceptTermsStart')} <a href="/terms" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline">{t('auth.termsOfService')}</a> {t('auth.and')} <a href="/privacy" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline">{t('auth.privacyPolicy')}</a>. {t('auth.dataDeclaration')}
              </label>
            </div>
            {errors.termsAccepted && <p className="text-sm text-red-400">{errors.termsAccepted}</p>}

             <Button type="submit" className="w-full h-12 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300 text-base" disabled={isLoading}>
               {isLoading ? t('auth.registering') : t('auth.registerButton')}
             </Button>
          </form>

          <p className="text-center text-white/60 mt-6 text-sm">
            {t('auth.alreadyHaveAccount')} <button onClick={() => navigate('/login')} className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">{t('auth.signInNow')}</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
