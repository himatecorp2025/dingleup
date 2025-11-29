import { CONTINUE_AFTER_WRONG_COST, TIMEOUT_CONTINUE_COST } from "@/types/game";
import { useI18n } from "@/i18n";

interface GameErrorBannerProps {
  visible: boolean;
  message: string;
  continueType: 'timeout' | 'wrong' | 'out-of-lives';
}

export const GameErrorBanner = ({ visible, message, continueType }: GameErrorBannerProps) => {
  const { t } = useI18n();
  
  if (!visible) return null;
  
  const cost = continueType === 'timeout' ? TIMEOUT_CONTINUE_COST : CONTINUE_AFTER_WRONG_COST;
  
  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2 z-50" 
      style={{ 
        perspective: '1000px',
        top: 'clamp(1rem, 2vw, 1.5rem)',
        maxWidth: 'clamp(18rem, 40vw, 20rem)'
      }}
    >
      {/* BASE SHADOW */}
      <div 
        className="absolute inset-0 bg-black/70 rounded-xl" 
        style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} 
        aria-hidden 
      />
      
      {/* OUTER FRAME */}
      <div 
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-400 via-red-500 to-red-600 opacity-95 border-4 border-red-300/60 shadow-2xl" 
        style={{ transform: 'translateZ(0px)' }} 
        aria-hidden 
      />
      
      {/* MIDDLE FRAME */}
      <div 
        className="absolute inset-[6px] rounded-xl bg-gradient-to-b from-black/50 via-transparent to-black/70" 
        style={{ 
          boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.6)', 
          transform: 'translateZ(15px)' 
        }} 
        aria-hidden 
      />
      
      {/* INNER LAYER */}
      <div 
        className="absolute inset-[8px] rounded-xl bg-gradient-to-br from-red-400/90 to-red-500/90" 
        style={{ 
          boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.2), inset 0 -16px 32px rgba(0,0,0,0.5)', 
          transform: 'translateZ(30px)' 
        }} 
        aria-hidden 
      />
      
      {/* SPECULAR HIGHLIGHT */}
      <div 
        className="absolute inset-[8px] rounded-xl pointer-events-none" 
        style={{ 
          background: 'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 35%, transparent 75%)', 
          transform: 'translateZ(45px)' 
        }} 
        aria-hidden 
      />
      
      <div 
        className="relative text-white font-bold text-center animate-fade-in"
        style={{ 
          padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          transform: 'translateZ(60px)', 
          textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6), 1px 1px 0 rgba(0,0,0,1), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1)' 
        }}
      >
        <div style={{ marginBottom: 'clamp(0.25rem, 0.5vw, 0.5rem)' }}>{message}</div>
        <div style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', opacity: 0.9 }}>
          {t('game.swipe_up_continue_cost').replace('{cost}', String(cost))}
        </div>
        <div style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', opacity: 0.9 }}>
          {t('game.swipe_down_exit')}
        </div>
      </div>
    </div>
  );
};
