import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Lock, User, Sparkles } from "lucide-react";
import { z } from "zod";
import { MusicControls } from '@/components/MusicControls';

const loginSchema = z.object({
  username: z.string().trim().min(1, "A felhasználónév mező kötelező").max(100),
  password: z.string().min(1, "A jelszó mező kötelező"),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<LoginForm>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = loginSchema.parse(formData);

      const { data: fnData, error: fnError } = await supabase.functions.invoke('login-with-username', {
        body: {
          username: validated.username,
          password: validated.password,
        },
      });

      if (fnError || fnData?.error || !fnData?.email) {
        toast({
          title: "Bejelentkezési hiba",
          description: fnData?.error || "Helytelen felhasználónév vagy jelszó",
          variant: "destructive",
        });
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fnData.email,
        password: validated.password,
      });

      if (signInError) {
        toast({
          title: "Bejelentkezési hiba",
          description: "Helytelen felhasználónév vagy jelszó",
          variant: "destructive",
        });
        return;
      }

      if (signInData.user) {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginForm, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginForm] = err.message;
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
      toast({ title: 'Hiba', description: 'Google bejelentkezés sikertelen', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-dvh min-h-svh relative overflow-hidden bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] flex items-center justify-center p-4" style={{
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
      </div>

      <div className="w-full max-w-md relative z-10">
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

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 relative">
          <button 
            onClick={() => navigate('/')}
            className="absolute left-4 top-4 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors duration-200 group"
            aria-label="Vissza"
          >
            <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
          </button>

          <h1 className="text-3xl sm:text-4xl font-black text-center mb-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            Bejelentkezés
          </h1>
          <p className="text-center text-white/70 mb-6 sm:mb-8 text-sm font-medium">
            Lépj be a kvízjáték világába! ⚡
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">Felhasználónév</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20"
                  placeholder="Írd be a felhasználóneved"
                  disabled={isLoading}
                />
              </div>
              {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/80">Jelszó</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-yellow-400 transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400 focus:ring-yellow-400/20"
                  placeholder="Írd be a jelszavad"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Bejelentkezés..." : "Bejelentkezés 🎮"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/60">vagy</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleAuth}
            variant="outline"
            className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Bejelentkezés Google-lal
          </Button>

          <p className="text-center text-white/60 mt-6 text-sm">
            Még nincs fiókod?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              Regisztrálj itt! 🚀
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
