import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2e]/90 via-[#16213e]/70 to-[#0f0f3d]/80"></div>
      </div>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-16 h-16 bg-accent rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-accent rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 z-10 text-center">
        <div className="animate-fade-in">
          <div className="relative w-48 h-48 mx-auto mb-8">
            <div className="absolute inset-0 animate-glow">
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-accent/40 via-accent/20 to-transparent blur-2xl"></div>
              <div className="absolute inset-[-20%] rounded-full border-4 border-accent/30 animate-pulse"></div>
            </div>
            <img 
              src={logo} 
              alt="Dingle UP! Logo" 
              className="relative w-full h-full object-contain drop-shadow-2xl"
              style={{ mixBlendMode: 'normal' }}
            />
          </div>
          
          <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full px-6 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-accent font-semibold text-sm">Hamarosan Elérhető</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-poppins leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4169E1] via-[#9370DB] to-[#FFD700]">
              Legyen Ön is Milliomos!
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Válaszolj helyesen 15 izgalmas kérdésre és szerezd meg az aranyérméket! Használd a segítségeket, versenyezz a ranglistán és légy te a következő milliomos! 🏆
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-2 border-purple-400/50 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6 shadow-lg shadow-purple-500/50 hover:scale-105 transition-all"
            >
              Játék indítása
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 text-lg px-8 py-6"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Tudj meg többet
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">15</div>
              <div className="text-sm text-muted-foreground">Kérdés / Kör</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">10 mp</div>
              <div className="text-sm text-muted-foreground">Gondolkodási Idő</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">3</div>
              <div className="text-sm text-muted-foreground">Segítség</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
