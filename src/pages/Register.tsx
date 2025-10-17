import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, Link } from "react-router-dom";
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
        if (authError.message.includes("already registered")) {
          toast({
            title: "Hiba",
            description: "Ez az email cím már regisztrálva van",
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
        toast({
          title: "Sikeres regisztráció!",
          description: "Átirányítunk a játékhoz...",
        });
        navigate("/registration-success");
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 sm:py-12 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/10"></div>

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

        <div className="bg-gradient-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-glow">
          <div className="text-center mb-6 sm:mb-8">
            <img src={logo} alt="Dingle UP!" className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-poppins">
              <span className="text-transparent bg-clip-text bg-gradient-gold">Regisztráció</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Csatlakozz és kezdd el a játékot!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="username">Felhasználónév</Label>
              <Input
                id="username"
                type="text"
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
              <Label htmlFor="email">Email cím</Label>
              <Input
                id="email"
                type="email"
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
              <Label htmlFor="password">Jelszó</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
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
              <Label htmlFor="passwordConfirm">Jelszó megerősítése</Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
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
              <Label htmlFor="terms" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
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
