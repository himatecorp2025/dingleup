import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Play, Sparkles, Trophy, Zap } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden py-12 sm:py-20">
      {/* Deep Purple/Blue Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033]"></div>
      
      {/* Animated glowing orbs - pink and purple */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '0.7s' }}></div>
      
      {/* Sparkle effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              opacity: 0.6
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Logo Section with glow */}
          <div className="flex justify-center mb-8 sm:mb-12 animate-fade-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-blue-500/40 rounded-full blur-3xl group-hover:blur-[60px] transition-all duration-700 animate-pulse"></div>
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                width="200"
                height="200"
                viewBox="0 0 1024 1024"
                className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500"
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
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8 sm:mb-12 space-y-4 sm:space-y-6 animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight tracking-tight">
              <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                Legyen Ön is
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_40px_rgba(234,179,8,0.8)] animate-pulse">
                MILLIOMOS!
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light px-2 drop-shadow-lg">
              Most a telefonodon! Teszteld tudásod, hívd a közönséget,<br className="hidden sm:block" />
              és csatlakozz a szakértői csapatodhoz!<br className="hidden sm:block" />
              <span className="font-semibold text-pink-300">Légy MILLIOMOS INGYEN még ma!</span>
            </p>
          </div>

          {/* Mobile Screenshots Showcase */}
          <div className="relative mb-12 sm:mb-16 animate-fade-in hidden sm:block" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-center items-center gap-4 perspective-1000">
              {/* Game screenshot mockups would go here */}
              <div className="relative w-64 h-[500px] bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl border-4 border-white/20 shadow-2xl backdrop-blur-sm transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-lg animate-pulse" />
                </div>
              </div>
              <div className="relative w-64 h-[500px] bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl border-4 border-white/20 shadow-2xl backdrop-blur-sm transform scale-110 hover:scale-115 transition-transform duration-500 z-10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-20 h-20 text-pink-400 drop-shadow-lg animate-pulse" />
                </div>
              </div>
              <div className="relative w-64 h-[500px] bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-3xl border-4 border-white/20 shadow-2xl backdrop-blur-sm transform rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-20 h-20 text-blue-400 drop-shadow-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
            
            <div className="relative" style={{ perspective: '1000px' }}>
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-full" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
              
              {/* OUTER FRAME - világosabb színek */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 opacity-90 border-2 border-blue-400/80 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-white/20 via-white/10 to-black/20 backdrop-blur-sm" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative flex items-center justify-center gap-2 px-6 py-3 transition-all hover:scale-105 min-h-[44px]" style={{ transform: 'translateZ(40px)' }}>
                <Sparkles className="w-5 h-5 text-purple-400 drop-shadow-lg" />
                <span className="text-white font-semibold drop-shadow-lg leading-none text-with-stroke">Prémium Jutalmak</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons - Enhanced Deep 3D */}
          <div className="flex flex-col gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.6s', marginTop: '5vh' }}>
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
                  className="relative w-full sm:w-auto px-10 py-4 text-white font-black text-lg transition-all hover:scale-105 flex items-center justify-center"
                  style={{ transform: 'translateZ(40px)', clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)' }}
                >
                  <div className="relative flex items-center justify-center gap-3 drop-shadow-lg">
                    <Play className="w-6 h-6 drop-shadow-lg flex-shrink-0" />
                    <span className="drop-shadow-lg tracking-wide text-with-stroke">TESZTJÁTÉK INDÍTÁSA</span>
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
                  className="relative w-full sm:w-auto text-base px-8 py-6 text-white hover:scale-105 transition-all flex items-center justify-center"
                  style={{ transform: 'translateZ(40px)' }}
                >
                  <span className="drop-shadow-lg text-with-stroke">Tudj meg többet</span>
                </Button>
              </div>
            </div>
            
          {/* Mobile-only note */}
          <p className="text-[10px] text-white/40 text-center max-w-md leading-relaxed text-with-stroke">
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
              <div className="text-left flex flex-col justify-center">
                <p className="text-xs opacity-80 text-with-stroke">Tölts le</p>
                <p className="font-bold text-with-stroke">iOS eszközre</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/install')}
              className="flex items-center gap-3 px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-xl border border-white/20 hover:border-white/40 transition-all hover:scale-105"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div className="text-left flex flex-col justify-center">
                <p className="text-xs opacity-80 text-with-stroke">Tölts le</p>
                <p className="font-bold text-with-stroke">Android eszközre</p>
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
              
              <div className="relative z-10 flex flex-col items-center justify-center" style={{ transform: 'translateZ(40px)' }}>
                <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] text-with-stroke">500+</div>
                <div className="text-sm text-white/90 font-semibold text-with-stroke">Kérdések</div>
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
              
              <div className="relative z-10 flex flex-col items-center justify-center" style={{ transform: 'translateZ(40px)' }}>
                <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] text-with-stroke">4</div>
                <div className="text-sm text-white/90 font-semibold text-with-stroke">Kategóriák</div>
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
              
              <div className="relative z-10 flex flex-col items-center justify-center" style={{ transform: 'translateZ(40px)' }}>
                <div className="text-3xl font-black text-yellow-400 mb-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] text-with-stroke">∞</div>
                <div className="text-sm text-white/90 font-semibold text-with-stroke">Móka</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary-darker to-transparent z-10"></div>
    </section>
  );
};

export default Hero;
