import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";

const RegistrationSuccess = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    // AudioManager handles music automatically based on user settings
    navigate('/intro?next=/game?autostart=true');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/10"></div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-8 shadow-glow text-center animate-fade-in">
          <div className="mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="96"
              height="96"
              viewBox="0 0 1024 1024"
              className="mx-auto mb-4"
            >
              <image
                href="/logo.png"
                x="0"
                y="0"
                width="1024"
                height="1024"
                preserveAspectRatio="xMidYMid meet"
              />
            </svg>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/20 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-accent" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 font-poppins">
            <span className="text-transparent bg-clip-text bg-gradient-gold">
              Sikeres Regisztráció!
            </span>
          </h1>

          <p className="text-muted-foreground mb-8 text-lg">
            Gratulálunk! A fiókod sikeresen létrejött. Most már készen állsz, hogy elindítsd a játékot és teszteld a tudásod!
          </p>

          <Button
            size="lg"
            onClick={handleStartGame}
            className="w-full bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 shadow-glow text-lg px-8 py-6"
          >
            Játék indítása
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
