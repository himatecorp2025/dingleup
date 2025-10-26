import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Play, Sparkles, Trophy, Zap, Smartphone } from "lucide-react";
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
          <div className="text-center mb-6 space-y-3 animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-accent animate-pulse flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-accent whitespace-nowrap">Új játékélmény</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight">
              <span className="text-white text-with-stroke">Legyen Ön is</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-gold animate-pulse">
                Milliomos
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light px-2">
              Teszteld tudásod <span className="font-bold text-accent">15 izgalmas kérdésben</span>, 
              versenyezz a ranglistán, és nyerj <span className="font-bold text-yellow-400">értékes jutalmakat</span>!
            </p>
          </div>

          {/* Features Pills - Deep 3D */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
            <div className="relative" style={{ perspective: '1000px' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-full" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
              
              {/* OUTER FRAME - világosabb színek */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 opacity-90 border-2 border-yellow-400/80 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-white/20 via-white/10 to-black/20 backdrop-blur-sm" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 transition-all hover:scale-105" style={{ transform: 'translateZ(40px)' }}>
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 drop-shadow-lg flex-shrink-0" />
                <span className="text-white font-semibold drop-shadow-lg text-xs sm:text-sm whitespace-nowrap">Heti Rangsor</span>
              </div>
            </div>
            
            <div className="relative" style={{ perspective: '1000px' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-full" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
              
              {/* OUTER FRAME - világosabb színek */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-purple-400 to-purple-600 opacity-90 border-2 border-purple-400/80 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-white/20 via-white/10 to-black/20 backdrop-blur-sm" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative flex items-center gap-2 px-6 py-3 transition-all hover:scale-105" style={{ transform: 'translateZ(40px)' }}>
                <Zap className="w-5 h-5 text-accent drop-shadow-lg" />
                <span className="text-white font-semibold drop-shadow-lg">4 Kategória</span>
              </div>
            </div>
            
            <div className="relative" style={{ perspective: '1000px' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-full" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
              
              {/* OUTER FRAME - világosabb színek */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 via-pink-400 to-pink-600 opacity-90 border-2 border-pink-400/80 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-white/20 via-white/10 to-black/20 backdrop-blur-sm" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative flex items-center gap-2 px-6 py-3 transition-all hover:scale-105" style={{ transform: 'translateZ(40px)' }}>
                <Sparkles className="w-5 h-5 text-purple-400 drop-shadow-lg" />
                <span className="text-white font-semibold drop-shadow-lg">Prémium Jutalmak</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons - Enhanced Deep 3D */}
          <div className="flex flex-col gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* TESZTJÁTÉK INDÍTÁSA button with exact same deep 3D as feature pills */}
              <div className="relative group" style={{ perspective: '1000px' }}>
                {/* BASE SHADOW - exactly like feature pills */}
                <div className="absolute inset-0 bg-black/70 rounded-full" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)', clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }} aria-hidden />
                
                {/* OUTER FRAME - világosabb színek */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500 via-green-400 to-green-600 opacity-90 border-2 border-green-400/80 shadow-2xl" style={{ transform: 'translateZ(0px)', clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }} aria-hidden />
                
                {/* MIDDLE FRAME - exactly like feature pills */}
                <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)', clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }} aria-hidden />
                
                {/* INNER LAYER - exactly like feature pills */}
                <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-white/20 via-white/10 to-black/20 backdrop-blur-sm" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(20px)', clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }} aria-hidden />
                
                {/* SPECULAR HIGHLIGHT - exactly like feature pills */}
                <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(30px)', clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }} aria-hidden />
                
                <button
                  onClick={() => navigate('/login')}
                  className="relative w-full sm:w-auto px-10 py-4 text-white font-black text-lg transition-all hover:scale-105"
                  style={{ transform: 'translateZ(40px)', clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
                >
                  <div className="relative flex items-center justify-center gap-3 drop-shadow-lg">
                    <Play className="w-6 h-6 drop-shadow-lg flex-shrink-0" />
                    <span className="drop-shadow-lg tracking-wide">TESZTJÁTÉK INDÍTÁSA</span>
                  </div>
                </button>
              </div>

              <div className="relative group" style={{ perspective: '1000px' }}>
                <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(8px)' }} aria-hidden />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-400 to-purple-600 opacity-80 border-2 border-purple-400/70 shadow-lg" style={{ transform: 'translateZ(0px)' }} aria-hidden />
                <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
                <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-sm" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
                <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
                
                <Button
                  onClick={scrollToFeatures}
                  variant="ghost"
                  size="lg"
                  className="relative w-full sm:w-auto text-base px-8 py-6 text-white hover:scale-105 transition-all"
                  style={{ transform: 'translateZ(40px)' }}
                >
                  <span className="drop-shadow-lg">Tudj meg többet</span>
                </Button>
              </div>
            </div>
            
          {/* Mobile-only note */}
          <p className="text-[10px] text-white/40 text-center max-w-md leading-relaxed">
            <Smartphone className="w-3 h-3 inline mr-1" />
            A játék kizárólag telefonon és táblagépen érhető el. Desktop és laptop esetén csak a landing page látható.
          </p>
        </div>

          {/* App Store Icons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <button
              onClick={() => navigate('/install')}
              className="flex items-center gap-3 px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-xl border border-white/20 hover:border-white/40 transition-all hover:scale-105"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <div className="text-left">
                <p className="text-xs opacity-80">Tölts le</p>
                <p className="font-bold">iOS eszközre</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/install')}
              className="flex items-center gap-3 px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-xl border border-white/20 hover:border-white/40 transition-all hover:scale-105"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div className="text-left">
                <p className="text-xs opacity-80">Tölts le</p>
                <p className="font-bold">Android eszközre</p>
              </div>
            </button>
          </div>

          {/* Stats - Deep 3D */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="relative rounded-2xl p-4 text-center transform-gpu" style={{ perspective: '1000px' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-blue-900 opacity-90 border-3 border-purple-400/60 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[4px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-br from-purple-600/40 to-blue-600/40 backdrop-blur-sm" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[6px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
                <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]">500+</div>
                <div className="text-xs text-white font-bold drop-shadow-lg">Kérdés</div>
              </div>
            </div>
            
            <div className="relative rounded-2xl p-4 text-center transform-gpu" style={{ perspective: '1000px' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-blue-900 opacity-90 border-3 border-purple-400/60 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[4px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-br from-purple-600/40 to-blue-600/40 backdrop-blur-sm" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[6px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
                <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]">4</div>
                <div className="text-xs text-white font-bold drop-shadow-lg">Témakör</div>
              </div>
            </div>
            
            <div className="relative rounded-2xl p-4 text-center transform-gpu" style={{ perspective: '1000px' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-blue-900 opacity-90 border-3 border-purple-400/60 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[4px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-br from-purple-600/40 to-blue-600/40 backdrop-blur-sm" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[6px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
                <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]">∞</div>
                <div className="text-xs text-white font-bold drop-shadow-lg">Szórakozás</div>
              </div>
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
