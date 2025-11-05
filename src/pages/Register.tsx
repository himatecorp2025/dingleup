import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";

const registerSchema = z.object({
  username: z.string()
    .min(3, "A felhasználónév legalább 3 karakter hosszú legyen")
    .max(50, "A felhasználónév maximum 50 karakter lehet"),
  email: z.string()
    .email("Érvénytelen email cím")
    .max(255, "Az email cím túl hosszú"),
  password: z.string()
    .min(8, "A jelszónak legalább 8 karakter hosszúnak kell lennie")
    .regex(/[a-z]/, "A jelszónak tartalmaznia kell kisbetűt")
    .regex(/[A-Z]/, "A jelszónak tartalmaznia kell nagybetűt")
    .regex(/[^a-zA-Z0-9]/, "A jelszónak tartalmaznia kell speciális karaktert"),
  passwordConfirm: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "El kell fogadnod az ÁSZF-et",
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "A két jelszó nem egyezik",
  path: ["passwordConfirm"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const invitationCode = searchParams.get('code') || '';
  
  const [formData, setFormData] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Platform detection for conditional padding
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
  const [inviterCode, setInviterCode] = useState(invitationCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = registerSchema.parse(formData);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            username: validated.username,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("User already registered")) {
          toast({
            title: "Hiba",
            description: "Sajnáljuk, de ez az emailcím már foglalt.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Hiba",
            description: authError.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (authData.user) {
        // Handle invitation if code exists
        if (inviterCode) {
          try {
            // Validate invitation using edge function
            const { data: validationData, error: validationError } = await supabase.functions.invoke(
              'validate-invitation',
              {
                body: {
                  invitationCode: inviterCode,
                  invitedEmail: validated.email,
                },
              }
            );

            if (validationError || !validationData.valid) {
              toast({
                title: 'Figyelmeztetés',
                description: validationData?.error || 'Érvénytelen meghívókód, de a regisztráció sikeres volt',
                variant: 'default',
              });
            } else {
              // Accept invitation using edge function
              const { data: acceptData, error: acceptError } = await supabase.functions.invoke(
                'accept-invitation',
                {
                  body: {
                    inviterId: validationData.inviterId,
                    invitedUserId: authData.user.id,
                    invitedEmail: validated.email,
                    invitationCode: inviterCode,
                  },
                }
              );

              if (acceptError) {
                if (import.meta.env.DEV) {
                  console.error('Error accepting invitation:', acceptError);
                }
              } else if (acceptData) {
                // Show reward information to the inviter
                if (import.meta.env.DEV) {
                  console.log('Invitation accepted, inviter rewarded:', acceptData);
                }
              }
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('Error processing invitation:', error);
            }
          }
        }

        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RegisterForm, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterForm] = err.message;
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
    <div className="min-h-screen min-h-dvh fixed inset-0 flex justify-center px-4 overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]" style={{
      paddingTop: isStandalone ? '10vh' : '1rem',
      paddingBottom: '1rem',
      alignItems: 'flex-start'
    }}>
      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-secondary/10 pointer-events-none"></div>

      {/* Floating elements - animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-500 rounded-full opacity-20 animate-float blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500 rounded-full opacity-20 animate-float blur-xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-red-500 rounded-full opacity-15 animate-float blur-xl" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Animated border lights */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 animate-pulse"></div>
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 animate-pulse"></div>

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
                <span className="text-transparent bg-clip-text bg-gradient-gold drop-shadow-lg">Regisztráció</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/80 drop-shadow px-2">Csatlakozz és kezdd el a játékot!</p>
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
                  <span className="truncate">Regisztráció Google-lel</span>
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
                    placeholder="Pl: Jatekos123"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`relative bg-black/60 border-0 ${errors.username ? "ring-2 ring-destructive" : ""}`}
                    disabled={isLoading}
                    style={{ transform: 'translateZ(10px)' }}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.username}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-white drop-shadow">Email cím</Label>
                <div className="relative mt-1" style={{ perspective: '800px' }}>
                  <div className="absolute inset-0 bg-black/70 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700/40 via-purple-600/40 to-purple-900/40 border border-purple-500/30 shadow-md" style={{ transform: 'translateZ(0px)' }} aria-hidden />
                  <div className="absolute inset-[2px] rounded-xl bg-gradient-to-b from-black/30 to-black/50" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)', transform: 'translateZ(5px)' }} aria-hidden />
                  
                  <Input
                    id="email"
                    type="email"
                    placeholder="pl: valaki@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`relative bg-black/60 border-0 ${errors.email ? "ring-2 ring-destructive" : ""}`}
                    disabled={isLoading}
                    style={{ transform: 'translateZ(10px)' }}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="inviterCode" className="text-white drop-shadow">Meghívó kód (opcionális)</Label>
                <div className="relative mt-1" style={{ perspective: '800px' }}>
                  <div className="absolute inset-0 bg-black/70 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700/40 via-purple-600/40 to-purple-900/40 border border-purple-500/30 shadow-md" style={{ transform: 'translateZ(0px)' }} aria-hidden />
                  <div className="absolute inset-[2px] rounded-xl bg-gradient-to-b from-black/30 to-black/50" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)', transform: 'translateZ(5px)' }} aria-hidden />
                  
                  <Input
                    id="inviterCode"
                    type="text"
                    value={inviterCode}
                    onChange={(e) => setInviterCode(e.target.value.toUpperCase())}
                    placeholder="Pl: ABC12345"
                    disabled={isLoading}
                    className="relative bg-black/60 border-0"
                    style={{ transform: 'translateZ(10px)' }}
                  />
                </div>
                <p className="text-xs text-white/70 mt-1 drop-shadow">
                  Ha van meghívó kódod, itt add meg
                </p>
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
                <p className="text-xs text-white/70 mt-1 drop-shadow">
                  Min. 8 karakter, kis- és nagybetű, speciális karakter
                </p>
              </div>

              <div>
                <Label htmlFor="passwordConfirm" className="text-white drop-shadow">Jelszó megerősítése</Label>
                <div className="relative mt-1" style={{ perspective: '800px' }}>
                  <div className="absolute inset-0 bg-black/70 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700/40 via-purple-600/40 to-purple-900/40 border border-purple-500/30 shadow-md" style={{ transform: 'translateZ(0px)' }} aria-hidden />
                  <div className="absolute inset-[2px] rounded-xl bg-gradient-to-b from-black/30 to-black/50" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)', transform: 'translateZ(5px)' }} aria-hidden />
                  
                  <div className="relative" style={{ transform: 'translateZ(10px)' }}>
                    <Input
                      id="passwordConfirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="Pl: Jelszó123!"
                      value={formData.passwordConfirm}
                      onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                      className={`bg-black/60 border-0 pr-10 ${errors.passwordConfirm ? "ring-2 ring-destructive" : ""}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                    >
                      {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {errors.passwordConfirm && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.passwordConfirm}</p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, termsAccepted: checked as boolean })
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="terms" className="text-xs sm:text-sm leading-relaxed cursor-pointer text-white drop-shadow">
                  Elfogadom az{" "}
                  <a href="#" className="text-accent hover:underline">
                    Általános Szerződési Feltételeket
                  </a>
                </Label>
              </div>
              {errors.termsAccepted && (
                <p className="text-sm text-destructive drop-shadow">{errors.termsAccepted}</p>
              )}

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
                  <span className="truncate">{isLoading ? "Regisztráció..." : "Regisztráció"}</span>
                </Button>
              </div>
            </form>

            <p className="text-center text-xs sm:text-sm text-white/70 mt-4 sm:mt-6 drop-shadow px-2">
              Van már fiókod?{" "}
              <Link to="/login" className="text-accent hover:underline font-semibold whitespace-nowrap">
                Bejelentkezés
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
