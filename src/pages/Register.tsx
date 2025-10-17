import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";

const registerSchema = z.object({
  username: z.string().min(3, "A felhasználónév legalább 3 karakter hosszú legyen"),
  email: z.string().email("Érvényes email címet adj meg"),
  password: z.string()
    .min(8, "A jelszó legalább 8 karakter hosszú legyen")
    .regex(/[a-z]/, "A jelszónak tartalmaznia kell kisbetűt")
    .regex(/[A-Z]/, "A jelszónak tartalmaznia kell nagybetűt")
    .regex(/[^a-zA-Z0-9]/, "A jelszónak tartalmaznia kell speciális karaktert"),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "El kell fogadnod az ÁSZF-et")
}).refine(data => data.password === data.confirmPassword, {
  message: "A két jelszó nem egyezik",
  path: ["confirmPassword"]
});

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = registerSchema.parse({
        username,
        email,
        password,
        confirmPassword,
        terms
      });

      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            username: validatedData.username
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Hiba",
          description: error.message === "User already registered" 
            ? "Ez az email cím már regisztrálva van" 
            : error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        navigate("/registration-success");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Hibás adatok",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"></div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-16 h-16 bg-accent rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-secondary rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Vissza a főoldalra
        </Link>

        <div className="bg-gradient-card border border-border/50 rounded-2xl p-8 shadow-glow">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-accent/40 via-accent/20 to-transparent blur-xl"></div>
              <img src={logo} alt="Dingle UP! Logo" className="relative w-full h-full object-contain" />
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-accent font-semibold text-sm">Regisztráció</span>
            </div>
            <h1 className="text-3xl font-bold font-poppins">Csatlakozz hozzánk!</h1>
            <p className="text-muted-foreground mt-2">Hozd létre a fiókodat és kezdd el a játékot</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="username">Felhasználónév</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Válassz egy felhasználónevet"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email cím</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Jelszó</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter, kis/nagybetű, speciális karakter"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Jelszó megerősítése</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Add meg újra a jelszót"
                required
                className="mt-1"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={terms}
                onCheckedChange={(checked) => setTerms(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                Elfogadom az{" "}
                <a href="#" className="text-accent hover:underline">
                  Általános Szerződési Feltételeket
                </a>{" "}
                és az{" "}
                <a href="#" className="text-accent hover:underline">
                  Adatvédelmi Nyilatkozatot
                </a>
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all"
              disabled={loading}
            >
              {loading ? "Regisztráció..." : "Regisztráció"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Már van fiókod?{" "}
              <Link to="/login" className="text-accent hover:underline font-semibold">
                Bejelentkezés
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;