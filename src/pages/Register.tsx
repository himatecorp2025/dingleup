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
            // Find inviter by invitation code
            const { data: inviterProfile } = await supabase
              .from('profiles')
              .select('id, coins')
              .eq('invitation_code', inviterCode)
              .single();

            if (inviterProfile) {
              // Create invitation record
              await supabase.from('invitations').insert({
                inviter_id: inviterProfile.id,
                invited_user_id: authData.user.id,
                invited_email: validated.email,
                accepted: true,
                accepted_at: new Date().toISOString(),
                invitation_code: inviterCode
              });

              // Award 100 coins to inviter
              await supabase
                .from('profiles')
                .update({ coins: inviterProfile.coins + 100 })
                .eq('id', inviterProfile.id);
            }
          } catch (error) {
            console.error('Error processing invitation:', error);
          }
        }

        toast({
          title: "Sikeres regisztráció!",
          description: inviterCode ? "Átirányítunk a játékhoz... A meghívód 100 aranyérmét kapott!" : "Átirányítunk a játékhoz...",
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
    <div className="min-h-[100svh] flex justify-center items-start sm:items-center px-4 pt-3 pb-4 sm:py-12 relative overflow-hidden">
      {/* Modern 2025 dark blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 via-transparent to-secondary/10"></div>

      {/* Floating elements - hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Vissza a főoldalra
        </Link>

        <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-glow max-h-[calc(100svh-6rem)] sm:max-h-none overflow-y-auto">
          <div className="text-center mb-6 sm:mb-8">
            <img src={logo} alt="Dingle UP!" className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-poppins">
              <span className="text-transparent bg-clip-text bg-gradient-gold">Regisztráció</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Csatlakozz és kezdd el a játékot!</p>
          </div>

          <div className="space-y-3 mb-4">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth}>
              Regisztráció Google-lel
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border"></span>
              <span>vagy</span>
              <span className="h-px flex-1 bg-border"></span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="username" className="text-white">Felhasználónév</Label>
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
                <p className="text-sm text-destructive mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email cím</Label>
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
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="inviterCode" className="text-white">Meghívó kód (opcionális)</Label>
              <Input
                id="inviterCode"
                type="text"
                value={inviterCode}
                onChange={(e) => setInviterCode(e.target.value.toUpperCase())}
                placeholder="Pl: ABC12345"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ha van meghívó kódod, itt add meg
              </p>
            </div>

            <div>
              <Label htmlFor="password" className="text-white">Jelszó</Label>
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
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Min. 8 karakter, kis- és nagybetű, speciális karakter
              </p>
            </div>

            <div>
              <Label htmlFor="passwordConfirm" className="text-white">Jelszó megerősítése</Label>
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
                <p className="text-sm text-destructive mt-1">{errors.passwordConfirm}</p>
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
              <Label htmlFor="terms" className="text-xs sm:text-sm leading-relaxed cursor-pointer text-white">
                Elfogadom az{" "}
                <a href="#" className="text-accent hover:underline">
                  Általános Szerződési Feltételeket
                </a>
              </Label>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-destructive">{errors.termsAccepted}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Regisztráció..." : "Regisztráció"}
            </Button>
          </form>

          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6">
            Van már fiókod?{" "}
            <Link to="/login" className="text-accent hover:underline font-semibold">
              Bejelentkezés
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
