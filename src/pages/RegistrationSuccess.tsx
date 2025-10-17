import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const RegistrationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"></div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-16 h-16 bg-accent rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-secondary rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-accent rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-gradient-card border border-border/50 rounded-2xl p-8 shadow-glow text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-accent/40 via-accent/20 to-transparent blur-xl"></div>
              <img src={logo} alt="Dingle UP! Logo" className="relative w-full h-full object-contain" />
            </div>
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full"></div>
              <CheckCircle className="relative w-20 h-20 text-accent animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-bold font-poppins mb-4">
            Sikeres Regisztráció! 🎉
          </h1>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Köszönjük a regisztrációt! A fiókod sikeresen létrejött. 
            Most már készen állsz, hogy belevágj a játékba és megmutatod, mire vagy képes!
          </p>

          <Button
            onClick={() => navigate('/game')}
            className="bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 shadow-glow w-full"
            size="lg"
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