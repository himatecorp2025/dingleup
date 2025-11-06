import { GameCategory } from '@/types/game';
import { Heart, Brain, Palette, TrendingUp, ArrowLeft, LogOut } from 'lucide-react';
import { MusicControls } from './MusicControls';
import { TutorialManager } from './tutorial/TutorialManager';

interface CategorySelectorProps {
  onSelect: (category: GameCategory) => void;
}

const CategorySelector = ({ onSelect }: CategorySelectorProps) => {

  const handleCategorySelect = (category: GameCategory) => {
    onSelect(category);
  };

  const categories = [
    {
      id: 'health' as GameCategory,
      name: 'Egészség & Fitnesz',
      icon: Heart,
      description: 'Sport, életmód, táplálkozás',
      gradient: 'from-red-500 via-red-600 to-pink-600',
      borderColor: 'border-red-500/50',
      shadowColor: 'shadow-red-500/40'
    },
    {
      id: 'history' as GameCategory,
      name: 'Történelem & Technológia',
      icon: Brain,
      description: 'Tudomány, felfedezések, találmányok',
      gradient: 'from-blue-500 via-blue-600 to-cyan-600',
      borderColor: 'border-blue-500/50',
      shadowColor: 'shadow-blue-500/40'
    },
    {
      id: 'culture' as GameCategory,
      name: 'Kultúra & Lifestyle',
      icon: Palette,
      description: 'Film, zene, művészet, divat',
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      borderColor: 'border-purple-500/50',
      shadowColor: 'shadow-purple-500/40'
    },
    {
      id: 'finance' as GameCategory,
      name: 'Pénzügy & Önismeret',
      icon: TrendingUp,
      description: 'Pszichológia, önfejlesztés, pénzügyi tudatosság',
      gradient: 'from-green-500 via-green-600 to-emerald-600',
      borderColor: 'border-green-500/50',
      shadowColor: 'shadow-green-500/40'
    }
  ];

  return (
    <div className="category-selector h-dvh h-svh w-screen flex flex-col items-start justify-start p-4 bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 5vh)' }}>
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-600/10 via-red-600/10 to-purple-600/10 pointer-events-none"></div>
      
      {/* Casino lights animation */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-60 animate-pulse"></div>
      
      {/* Back Button - 3D Round Style */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="relative p-3 rounded-full hover:scale-110 transition-all"
          title="Vissza a dashboardra"
        >
          {/* BASE SHADOW */}
          <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
          
          {/* OUTER FRAME */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
          
          {/* MIDDLE FRAME */}
          <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
          
          {/* INNER LAYER */}
          <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
          
          {/* SPECULAR HIGHLIGHT */}
          <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
          
          {/* Icon */}
          <LogOut className="w-6 h-6 text-white relative z-10 -scale-x-100" />
        </button>
      </div>
      
      <div className="max-w-2xl w-full relative z-10">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 font-poppins bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-red-400 to-purple-400 animate-pulse pr-16 sm:pr-20">
          Válassz témakört!
        </h1>
          <p className="text-center text-xs sm:text-sm text-white mb-4 sm:mb-6 pr-16 sm:pr-20">
            Melyik területen méred össze tudásod?
          </p>

        {/* 2x2 Grid - Fixed equal sizing */}
        <div className="grid grid-cols-2 grid-rows-2 gap-x-2 gap-y-2 sm:gap-x-3 sm:gap-y-3 max-w-md mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="group relative overflow-hidden rounded-2xl p-3 sm:p-4 bg-black/80 transition-all duration-300 hover:brightness-110 text-left touch-manipulation active:translate-y-[1px] flex flex-col justify-between h-full"
                style={{ perspective: '1000px', aspectRatio: '1 / 1' }}
              >
                {/* Deep 3D Layers - ENHANCED */}
                {/* BASE SHADOW - Deeper */}
                <div className="absolute inset-0 bg-black/80 rounded-2xl" style={{ transform: 'translate(10px, 10px)', filter: 'blur(16px)' }} aria-hidden />
                
                {/* OUTER FRAME - Level 1 - Enhanced depth */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${category.gradient} opacity-95 border-4 ${category.borderColor} shadow-2xl`} style={{ transform: 'translateZ(0px)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }} aria-hidden />
                
                {/* MIDDLE FRAME - Level 2 - Deeper inset */}
                <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.6)', transform: 'translateZ(15px)' }} aria-hidden />
                
                {/* INNER LAYER - Level 3 - More prominent */}
                <div className={`absolute inset-[8px] rounded-2xl bg-gradient-to-br ${category.gradient} opacity-40`} style={{ boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.25), inset 0 -16px 32px rgba(0,0,0,0.5)', transform: 'translateZ(30px)' }} aria-hidden />
                
                {/* SPECULAR HIGHLIGHT - Stronger */}
                <div className="absolute inset-[8px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, transparent 70%)', transform: 'translateZ(45px)' }} aria-hidden />
                
                {/* Animated Shine Effect */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
                  style={{ transform: 'translateZ(40px)' }}
                  aria-hidden
                >
                  <div 
                    className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-[shine_3s_ease-in-out_infinite]"
                  />
                </div>
                
                <div className="relative z-10 flex flex-col h-full items-center justify-between" style={{ transform: 'translateZ(50px)' }}>
                  {/* 3D Icon wrapper with enhanced depth */}
                  <div className="relative mt-2 sm:mt-3 mb-2 sm:mb-3" style={{ perspective: '600px' }}>
                    {/* BASE SHADOW for icon */}
                    <div className="absolute inset-0 bg-black/60 rounded-xl translate-y-2 blur-lg" aria-hidden />
                    
                    {/* OUTER GLOW */}
                    <div className={`absolute inset-[-4px] rounded-xl bg-gradient-to-br ${category.gradient} opacity-50 blur-md`} aria-hidden />
                    
                    {/* MAIN FRAME */}
                    <div className={`relative p-2 sm:p-3 rounded-xl bg-gradient-to-br ${category.gradient} text-white w-fit shadow-2xl`} style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.3), inset 0 -4px 8px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }}>
                      {/* INNER HIGHLIGHT */}
                      <div className="absolute inset-[3px] rounded-lg pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 20%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)' }} aria-hidden />
                      
                      <Icon className="w-[70px] h-[70px] sm:w-[82px] sm:h-[82px] relative z-10" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
                    </div>
                  </div>
                  
                  <div className="text-center pb-3 sm:pb-4 px-2 max-w-full overflow-hidden">
                    <h3 className="text-base sm:text-lg font-bold mb-0.5 sm:mb-1 font-poppins leading-tight text-white drop-shadow-lg truncate">
                      {category.name}
                    </h3>
                    <p className="text-sm sm:text-base text-yellow-200/90 line-clamp-2 drop-shadow break-words">
                      {category.description}
                    </p>
                  </div>
                </div>
                
                {/* Keyframe for shine animation */}
                <style>{`
                  @keyframes shine {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(300%) skewX(-12deg); }
                  }
                `}</style>
              </button>
            );
          })}
        </div>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-[10px] sm:text-xs text-yellow-300/90 drop-shadow font-semibold mb-3 sm:mb-4">
            15 kérdés • 10 mp/kérdés • Akár 100 aranyérme
          </p>
        </div>

        {/* Music Controls */}
        <div className="music-controls mt-4 max-w-md mx-auto">
          <MusicControls />
        </div>
      </div>
      
      {/* Note: Daily Gift dialog is now ONLY shown on Dashboard if canClaim is true */}
      
      
      <TutorialManager route="topics" />
    </div>
  );
};

export default CategorySelector;