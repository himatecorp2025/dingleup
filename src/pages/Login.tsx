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
  email: z.string().email("Érvénytelen email cím").max(255),
  password: z.string().min(1, "A jelszó mező kötelező"),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<LoginForm>({
    email: "",
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

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        toast({
          title: "Bejelentkezési hiba",
          description: "Helytelen email vagy jelszó",
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Sikeres bejelentkezés!",
          description: "Átirányítunk...",
        });
        
        // AudioManager handles music automatically based on user settings
        
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-poppins">
                <span className="text-transparent bg-clip-text bg-gradient-gold drop-shadow-lg">Bejelentkezés</span>
              </h1>
              <p className="text-sm sm:text-base text-white/80 drop-shadow">Add meg email címed és jelszavad a bejelentkezéshez</p>
            </div>

            <div className="space-y-3 mb-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth}>
                Bejelentkezés Google-lel
              </Button>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="h-px flex-1 bg-white/20"></span>
                <span>vagy</span>
                <span className="h-px flex-1 bg-white/20"></span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="email" className="text-white drop-shadow">Email cím</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="pl: valaki@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-destructive" : ""}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-white drop-shadow">Jelszó</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Pl: Jelszó123!"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Bejelentkezés..." : "Bejelentkezés"}
              </Button>
            </form>

            <p className="text-center text-xs sm:text-sm text-white/70 mt-4 sm:mt-6 drop-shadow">
              Még nincs fiókod?{" "}
              <Link to="/register" className="text-accent hover:underline font-semibold">
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
