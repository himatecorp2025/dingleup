import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = loginSchema.parse(formData);

      // Kérjük le az email címet felhasználónév alapján az edge functionből
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

      // Jelentkezzünk be az email+jelszó párossal
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
        toast({
          title: "Sikeres bejelentkezés!",
          description: "Átirányítunk...",
        });
        
        navigate("/intro?next=/dashboard");
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
    <div className="min-h-screen fixed inset-0 flex justify-center items-start sm:items-center px-4 pt-3 pb-4 sm:py-12 overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-secondary/10 pointer-events-none"></div>

      {/* Floating elements - hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 sm:mb-8 transition-colors drop-shadow-lg">
          <ArrowLeft className="w-4 h-4" />
          Vissza a főoldalra
        </Link>

        <div className="relative" style={{ perspective: '1200px' }}>
          {/* BASE SHADOW */}
          <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(8px, 8px)', filter: 'blur(12px)' }} aria-hidden />
          
          {/* OUTER FRAME */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-95 border-4 border-purple-500/60 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
          
          {/* MIDDLE FRAME */}
          <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.6)', transform: 'translateZ(15px)' }} aria-hidden />
          
          {/* INNER LAYER */}
          <div className="absolute inset-[8px] rounded-2xl bg-gradient-to-br from-black/80 to-black/90" style={{ boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.1), inset 0 -16px 32px rgba(0,0,0,0.5)', transform: 'translateZ(30px)' }} aria-hidden />
          
          {/* SPECULAR HIGHLIGHT */}
          <div className="absolute inset-[8px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 35%, transparent 75%)', transform: 'translateZ(45px)' }} aria-hidden />
          
          <div className="relative p-6 sm:p-8 max-h-[calc(100svh-6rem)] sm:max-h-none overflow-y-auto rounded-2xl" style={{ transform: 'translateZ(60px)' }}>
              <div className="text-center mb-6 sm:mb-8">
              <img src={logo} alt="Dingle UP!" className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 drop-shadow-2xl" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 font-poppins px-2">
                <span className="text-transparent bg-clip-text bg-gradient-gold drop-shadow-lg">Bejelentkezés</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/80 drop-shadow px-2">Add meg felhasználóneved és jelszavad</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="relative" style={{ perspective: '800px' }}>
                <div className="absolute inset-0 bg-black/70 rounded-xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-80 border-2 border-purple-500/50 shadow-lg" style={{ transform: 'translateZ(0px)' }} aria-hidden />
                <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
                <div className="absolute inset-[5px] rounded-xl bg-gradient-to-br from-white/10 to-black/20" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="relative w-full hover:scale-105 transition-all bg-white text-gray-900 border-0 hover:bg-white/90 text-xs sm:text-sm md:text-base py-2 sm:py-3" 
                  onClick={handleGoogleAuth}
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="truncate">Bejelentkezés Google-lel</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="h-px flex-1 bg-white/20"></span>
                <span>vagy</span>
                <span className="h-px flex-1 bg-white/20"></span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="username" className="text-white drop-shadow">Felhasználónév</Label>
                <div className="relative mt-1" style={{ perspective: '800px' }}>
                  <div className="absolute inset-0 bg-black/70 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700/40 via-purple-600/40 to-purple-900/40 border border-purple-500/30 shadow-md" style={{ transform: 'translateZ(0px)' }} aria-hidden />
                  <div className="absolute inset-[2px] rounded-xl bg-gradient-to-b from-black/30 to-black/50" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)', transform: 'translateZ(5px)' }} aria-hidden />
                  
                  <Input
                    id="username"
                    type="text"
                    placeholder="pl: JohnDoe123"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`relative bg-black/60 border-0 ${errors.username ? "ring-2 ring-destructive" : ""}`}
                    disabled={isLoading}
                    autoComplete="username"
                    style={{ transform: 'translateZ(10px)' }}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.username}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-white drop-shadow">Jelszó</Label>
                <div className="relative mt-1" style={{ perspective: '800px' }}>
                  <div className="absolute inset-0 bg-black/70 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700/40 via-purple-600/40 to-purple-900/40 border border-purple-500/30 shadow-md" style={{ transform: 'translateZ(0px)' }} aria-hidden />
                  <div className="absolute inset-[2px] rounded-xl bg-gradient-to-b from-black/30 to-black/50" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)', transform: 'translateZ(5px)' }} aria-hidden />
                  
                  <div className="relative" style={{ transform: 'translateZ(10px)' }}>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Pl: Jelszó123!"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`bg-black/60 border-0 pr-10 ${errors.password ? "ring-2 ring-destructive" : ""}`}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.password}</p>
                )}
              </div>

              <div className="relative" style={{ perspective: '800px' }}>
                <div className="absolute inset-0 bg-black/70 rounded-xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-900 opacity-90 border-2 border-yellow-500/60 shadow-lg" style={{ transform: 'translateZ(0px)' }} aria-hidden />
                <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
                <div className="absolute inset-[5px] rounded-xl bg-gradient-to-br from-yellow-600/30 to-yellow-700/30" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.15), inset 0 -8px 16px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
                
                <Button
                  type="submit"
                  className="relative w-full bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all border-0 hover:scale-105 text-sm sm:text-base py-2 sm:py-3"
                  disabled={isLoading}
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <span className="truncate">{isLoading ? "Bejelentkezés..." : "Bejelentkezés"}</span>
                </Button>
              </div>
            </form>

            <p className="text-center text-xs sm:text-sm text-white/70 mt-4 sm:mt-6 drop-shadow px-2">
              Még nincs fiókod?{" "}
              <Link to="/register" className="text-accent hover:underline font-semibold whitespace-nowrap">
                Regisztráció
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
