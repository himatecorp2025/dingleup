import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import logo from "@/assets/logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import gameMusic from "@/assets/game-music.m4a";

const Hero = () => {
  // Előtöltjük az audio fájlt a komponens betöltésekor
  useEffect(() => {
    try {
      const w = window as any;
      if (!w.__bgm) {
        const audio = new Audio(gameMusic);
        audio.preload = 'auto';
        audio.loop = true;
        audio.volume = 0.3;
        w.__bgm = audio;
        // Betöltjük de nem játsszuk le
        audio.load();
      }
    } catch {}
  }, []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-16 h-16 bg-accent rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-accent rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <div className="animate-fade-in">
          <div className="relative w-48 h-48 mx-auto mb-8">
            {/* Golden rays behind logo */}
            <div className="absolute inset-0 animate-glow">
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-accent/40 via-accent/20 to-transparent blur-2xl"></div>
              <div className="absolute inset-[-20%] rounded-full border-4 border-accent/30 animate-pulse"></div>
            </div>
            {/* Logo with transparent background */}
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

          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-poppins">
            Teszteld <span className="text-transparent bg-clip-text bg-gradient-gold">Tudásod</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            15 izgalmas kérdés, 3 válaszlehetőség, végtelen móka. Gyűjts aranyérméket, használj segítségeket és versenyezz a heti ranglistán!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/game?autostart=true">
              <Button
                size="lg"
                onClick={() => {
                  try {
                    localStorage.setItem('musicEnabled', 'true');
                    const w = window as any;
                    const audio: HTMLAudioElement = w.__bgm;
                    if (audio) {
                      // Az audio már be van töltve, azonnal játsszuk le
                      audio.play().catch(() => {});
                    }
                  } catch {}
                }}
                className="bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 shadow-glow text-lg px-8 py-6"
              >
                Játék indítása
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-accent/50 text-foreground hover:bg-accent/10 text-lg px-8 py-6">
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
