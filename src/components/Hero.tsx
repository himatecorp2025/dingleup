import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Play, Sparkles, Trophy, Zap } from "lucide-react";
import logoImage from "@/assets/logo.png";
import millionaireHero from "@/assets/millionaire-hero.jpg";

const Hero = () => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] py-8">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${millionaireHero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2e]/80 via-[#16213e]/70 to-[#0f0f3d]" />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Logo Section */}
          <div className="flex justify-center mb-4 animate-fade-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-secondary/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
              <img 
                src={logoImage} 
                alt="Millionaire Quiz Logo" 
                className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center mb-6 space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-semibold text-accent">Új játékélmény</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              <span className="text-white text-with-stroke">Legyen Ön is</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-gold animate-pulse">
                Milliomos
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Teszteld tudásod <span className="font-bold text-accent">15 izgalmas kérdésben</span>, 
              versenyezz a ranglistán, és nyerj <span className="font-bold text-yellow-400">értékes jutalmakat</span>!
            </p>
          </div>

          {/* Features Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 hover:bg-white/20 transition-all hover:scale-105">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">Heti Rangsor</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 hover:bg-white/20 transition-all hover:scale-105">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-white font-semibold">4 Kategória</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 hover:bg-white/20 transition-all hover:scale-105">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">Prémium Jutalmak</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <button
              onClick={() => navigate('/login')}
              className="group relative w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white font-black text-lg rounded-2xl border-4 border-green-400 shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 hover:scale-105 transition-all animate-pulse-glow-green overflow-hidden"
              style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-white/30 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                TESZTJÁTÉK INDÍTÁSA
              </div>
            </button>

            <Button
              onClick={scrollToFeatures}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-6 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 hover:scale-105 transition-all"
            >
              Tudj meg többet
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="text-center p-4 bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-2xl border-2 border-purple-400/50 shadow-lg hover:border-purple-400 transition-all hover:scale-105">
              <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-lg">500+</div>
              <div className="text-xs text-white font-bold">Kérdés</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-2xl border-2 border-purple-400/50 shadow-lg hover:border-purple-400 transition-all hover:scale-105">
              <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-lg">4</div>
              <div className="text-xs text-white font-bold">Témakör</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-2xl border-2 border-purple-400/50 shadow-lg hover:border-purple-400 transition-all hover:scale-105">
              <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-lg">∞</div>
              <div className="text-xs text-white font-bold">Szórakozás</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f0f3d] to-transparent z-10"></div>
    </section>
  );
};

export default Hero;
