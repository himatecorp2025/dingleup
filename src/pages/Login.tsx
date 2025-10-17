import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/game");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/game");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Hiányzó adatok",
        description: "Kérlek add meg az email címed és a jelszavad",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Bejelentkezési hiba",
        description: error.message === "Invalid login credentials" 
          ? "Hibás email cím vagy jelszó" 
          : error.message,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // The navigation will happen automatically through onAuthStateChange
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
              <span className="text-accent font-semibold text-sm">Bejelentkezés</span>
            </div>
            <h1 className="text-3xl font-bold font-poppins">Üdv újra!</h1>
            <p className="text-muted-foreground mt-2">Lépj be a fiókodba és folytasd a játékot</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Add meg a jelszavad"
                required
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all"
              disabled={loading}
            >
              {loading ? "Bejelentkezés..." : "Bejelentkezés"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Még nincs fiókod?{" "}
              <Link to="/register" className="text-accent hover:underline font-semibold">
                Regisztráció
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;