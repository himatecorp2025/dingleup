import { HexagonButton } from './HexagonButton';
import { Sparkles } from 'lucide-react';

interface GameResultsDialogProps {
  open: boolean;
  correctAnswers: number;
  totalQuestions: number;
  coinsEarned: number;
  averageResponseTime: number;
  onNewGame: () => void;
  onBackToDashboard: () => void;
}

export const GameResultsDialog = ({
  open,
  correctAnswers,
  totalQuestions,
  coinsEarned,
  averageResponseTime,
  onNewGame,
  onBackToDashboard
}: GameResultsDialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/10 backdrop-blur-sm"
        onClick={onBackToDashboard}
      />
      
      {/* Results Container */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center gap-4 sm:gap-6">
        {/* 3D Trophy SVG with floating coins */}
        <div className="relative mb-2 sm:mb-4">
          {/* Floating sparkles/coins around trophy */}
          <div className="absolute -top-4 -left-4 animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" fill="currentColor" />
          </div>
          <div className="absolute -top-2 -right-6 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" fill="currentColor" />
          </div>
          <div className="absolute -bottom-2 -left-6 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.2s' }}>
            <span className="text-3xl sm:text-4xl animate-spin" style={{ animationDuration: '3s' }}>🪙</span>
          </div>
          <div className="absolute -bottom-4 -right-4 animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '2.8s' }}>
            <span className="text-2xl sm:text-3xl animate-spin" style={{ animationDuration: '3.5s' }}>🪙</span>
          </div>
          
          {/* 3D Trophy SVG */}
          <svg 
            viewBox="0 0 200 240" 
            className="w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56 drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 30px rgba(234, 179, 8, 0.6))' }}
          >
            <defs>
              {/* Gradients for 3D effect */}
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#fde68a" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="baseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <filter id="innerShadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Base/Pedestal - 3D effect */}
            <g>
              {/* Shadow */}
              <rect x="50" y="195" width="100" height="35" fill="#92400e" opacity="0.4" rx="3" />
              {/* Main base */}
              <rect x="45" y="190" width="110" height="40" fill="url(#baseGradient)" rx="4" />
              {/* Base highlight */}
              <rect x="45" y="190" width="110" height="15" fill="url(#goldHighlight)" opacity="0.3" rx="4" />
              {/* Base edge lines */}
              <rect x="45" y="190" width="110" height="2" fill="#fef3c7" opacity="0.6" rx="1" />
              <rect x="45" y="228" width="110" height="2" fill="#78350f" rx="1" />
            </g>
            
            {/* Cup body - Main trophy */}
            <g>
              {/* Shadow layer */}
              <path d="M 70 100 Q 60 150, 65 190 L 135 190 Q 140 150, 130 100 Z" fill="#92400e" opacity="0.3" transform="translate(3, 3)" />
              
              {/* Main cup body */}
              <path d="M 70 100 Q 60 150, 65 190 L 135 190 Q 140 150, 130 100 Z" fill="url(#goldGradient)" filter="url(#innerShadow)" />
              
              {/* Cup highlight */}
              <ellipse cx="100" cy="120" rx="25" ry="30" fill="url(#goldHighlight)" opacity="0.6" />
              
              {/* Cup rim (top) */}
              <ellipse cx="100" cy="100" rx="30" ry="8" fill="#fbbf24" />
              <ellipse cx="100" cy="100" rx="30" ry="8" fill="url(#goldHighlight)" opacity="0.5" />
              <ellipse cx="100" cy="103" rx="28" ry="6" fill="#d97706" />
            </g>
            
            {/* Left Handle - 3D */}
            <g>
              {/* Shadow */}
              <path d="M 65 105 Q 30 110, 30 140 Q 30 160, 60 165" 
                    stroke="#92400e" strokeWidth="10" fill="none" opacity="0.3" transform="translate(2, 2)" />
              {/* Main handle */}
              <path d="M 65 105 Q 30 110, 30 140 Q 30 160, 60 165" 
                    stroke="url(#goldGradient)" strokeWidth="10" fill="none" strokeLinecap="round" />
              {/* Handle highlight */}
              <path d="M 65 105 Q 30 110, 30 140 Q 30 160, 60 165" 
                    stroke="#fef3c7" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
            </g>
            
            {/* Right Handle - 3D */}
            <g>
              {/* Shadow */}
              <path d="M 135 105 Q 170 110, 170 140 Q 170 160, 140 165" 
                    stroke="#92400e" strokeWidth="10" fill="none" opacity="0.3" transform="translate(2, 2)" />
              {/* Main handle */}
              <path d="M 135 105 Q 170 110, 170 140 Q 170 160, 140 165" 
                    stroke="url(#goldGradient)" strokeWidth="10" fill="none" strokeLinecap="round" />
              {/* Handle highlight */}
              <path d="M 135 105 Q 170 110, 170 140 Q 170 160, 140 165" 
                    stroke="#fef3c7" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
            </g>
            
            {/* Trophy top ornament */}
            <g>
              {/* Shadow */}
              <circle cx="100" cy="75" r="18" fill="#92400e" opacity="0.3" transform="translate(2, 2)" />
              {/* Main ornament */}
              <circle cx="100" cy="75" r="18" fill="url(#goldGradient)" />
              {/* Ornament highlight */}
              <circle cx="95" cy="70" r="8" fill="#fef3c7" opacity="0.7" />
              {/* Star on top */}
              <path d="M 100 60 L 103 68 L 111 68 L 105 73 L 107 81 L 100 76 L 93 81 L 95 73 L 89 68 L 97 68 Z" 
                    fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" />
            </g>
          </svg>
        </div>

        {/* Congratulations Text */}
        <h2 
          className="text-3xl sm:text-4xl md:text-5xl font-black text-center"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.4))',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          Gratulálunk!
        </h2>

        {/* Stats Boxes - 3D Deep Effect */}
        <div className="w-full space-y-3 sm:space-y-4">
          {/* Correct Answers Box */}
          <div className="relative" style={{ perspective: '1000px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-green-900 border-2 border-green-400/50 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-black/30 via-transparent to-black/50" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-br from-green-700/60 to-green-900/60" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            <div className="relative z-10 py-4 sm:py-5 text-center" style={{ transform: 'translateZ(40px)' }}>
              <p className="text-sm sm:text-base text-gray-300 mb-1 font-medium" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Helyes válaszok</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {correctAnswers}/{totalQuestions}
              </p>
            </div>
          </div>

          {/* Coins Earned Box */}
          <div className="relative" style={{ perspective: '1000px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-900 border-2 border-yellow-400/50 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-black/30 via-transparent to-black/50" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-br from-yellow-700/60 to-yellow-900/60" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            <div className="relative z-10 py-4 sm:py-5 text-center" style={{ transform: 'translateZ(40px)' }}>
              <p className="text-sm sm:text-base text-gray-300 mb-1 font-medium" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Szerzett aranyérme</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white flex items-center justify-center gap-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                +{coinsEarned} <span className="text-4xl sm:text-5xl">🪙</span>
              </p>
            </div>
          </div>

          {/* Average Response Time Box */}
          <div className="relative" style={{ perspective: '1000px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/60 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border-2 border-blue-400/50 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-black/30 via-transparent to-black/50" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-br from-blue-700/60 to-blue-900/60" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            <div className="relative z-10 py-4 sm:py-5 text-center" style={{ transform: 'translateZ(40px)' }}>
              <p className="text-sm sm:text-base text-gray-300 mb-1 font-medium" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>Átlagos válaszidő</p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {averageResponseTime.toFixed(1)}s
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 sm:space-y-4 mt-2 sm:mt-4">
          <HexagonButton
            variant="yellow"
            size="lg"
            onClick={onNewGame}
            className="w-full text-base sm:text-lg md:text-xl font-black py-4 sm:py-5"
          >
            Új játék
          </HexagonButton>
          
          <button
            onClick={onBackToDashboard}
            className="w-full text-center text-sm sm:text-base text-white/80 hover:text-white transition-colors font-medium"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    </div>
  );
};