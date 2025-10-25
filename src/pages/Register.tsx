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

        toast({
          title: "Sikeres regisztráció!",
          description: inviterCode ? "Meghívód jutalmat kapott! Köszönjük, hogy csatlakoztál!" : "Átirányítunk...",
        });
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
                <span className="text-transparent bg-clip-text bg-gradient-gold drop-shadow-lg">Regisztráció</span>
              </h1>
              <p className="text-sm sm:text-base text-white/80 drop-shadow">Csatlakozz és kezdd el a játékot!</p>
            </div>

            <div className="space-y-3 mb-4">
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth}>
                Regisztráció Google-lel
              </Button>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="h-px flex-1 bg-white/20"></span>
                <span>vagy</span>
                <span className="h-px flex-1 bg-white/20"></span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="username" className="text-white drop-shadow">Felhasználónév</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Pl: Jatekos123"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={errors.username ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.username}</p>
                )}
              </div>

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
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1 drop-shadow">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="inviterCode" className="text-white drop-shadow">Meghívó kód (opcionális)</Label>
                <Input
                  id="inviterCode"
                  type="text"
                  value={inviterCode}
                  onChange={(e) => setInviterCode(e.target.value.toUpperCase())}
                  placeholder="Pl: ABC12345"
                  disabled={isLoading}
                />
                <p className="text-xs text-white/70 mt-1 drop-shadow">
                  Ha van meghívó kódod, itt add meg
                </p>
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
                <p className="text-xs text-white/70 mt-1 drop-shadow">
                  Min. 8 karakter, kis- és nagybetű, speciális karakter
                </p>
              </div>

              <div>
                <Label htmlFor="passwordConfirm" className="text-white drop-shadow">Jelszó megerősítése</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    placeholder="Pl: Jelszó123!"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    className={errors.passwordConfirm ? "border-destructive pr-10" : "pr-10"}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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

              <Button
                type="submit"
                className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Regisztráció..." : "Regisztráció"}
              </Button>
            </form>

            <p className="text-center text-xs sm:text-sm text-white/70 mt-4 sm:mt-6 drop-shadow">
              Van már fiókod?{" "}
              <Link to="/login" className="text-accent hover:underline font-semibold">
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
