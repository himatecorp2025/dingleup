import { useEffect } from 'react';
import { useI18n } from '@/i18n';

interface ExitGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
  gameCompleted?: boolean;
}

export const ExitGameDialog = ({
  open,
  onOpenChange,
  onConfirmExit,
  gameCompleted = false
}: ExitGameDialogProps) => {
  const { t } = useI18n();

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Fullscreen overlay with 10% blur */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200">
        {/* Backdrop blur - 10% opacity */}
        <div 
          className="absolute inset-0 bg-black/10 backdrop-blur-sm" 
          onClick={() => onOpenChange(false)} 
        />
        
        {/* Dialog content - fully transparent background, no borders */}
        <div 
          className="relative z-10 flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-300"
          style={{
            gap: 'clamp(1rem, 3vw, 1.5rem)',
            padding: 'clamp(1rem, 3vw, 2rem)',
            margin: '0 clamp(1rem, 2vw, 1.5rem)'
          }}
        >
          {/* Sad SVG Icon - 3D Deep Effect */}
          <div 
            className="relative animate-in fade-in slide-in-from-top-4 duration-500"
            style={{
              width: 'clamp(5rem, 12vw, 7rem)',
              height: 'clamp(5rem, 12vw, 7rem)'
            }}
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 rounded-full" style={{ transform: 'translate(4px, 4px)', filter: 'blur(8px)', background: 'rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-dark via-primary to-primary-darker border-2 border-primary-glow/50 shadow-lg shadow-primary/30" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-primary via-primary-glow to-primary-dark" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-primary-glow/40 via-primary/40 to-primary-dark/40" style={{ boxShadow: 'inset 0 5px 12px rgba(255,255,255,0.1), inset 0 -5px 12px rgba(0,0,0,0.25)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 70% at 30% 20%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 35%, transparent 65%)' }} aria-hidden />
            
            {/* SVG Content */}
            <div className="absolute inset-[5px] flex items-center justify-center rounded-full overflow-hidden">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                {/* Face circle - transparent to show gradient behind */}
                <circle cx="50" cy="50" r="40" fill="hsl(var(--primary) / 0.3)" stroke="none"/>
                
                {/* Sad eyes with tears */}
                <ellipse cx="35" cy="40" rx="4" ry="7" fill="hsl(var(--muted))"/>
                <ellipse cx="65" cy="40" rx="4" ry="7" fill="hsl(var(--muted))"/>
                
                {/* Tears - animated with glow */}
                <g filter="url(#tearGlow)">
                  <path d="M 35 47 Q 34 53, 33 59 Q 32 63, 34 65 Q 36 63, 35 59 Q 34 53, 35 47 Z" fill="hsl(var(--primary))" opacity="0.8">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
                  </path>
                  <path d="M 65 47 Q 64 53, 63 59 Q 62 63, 64 65 Q 66 63, 65 59 Q 64 53, 65 47 Z" fill="hsl(var(--primary))" opacity="0.8">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
                  </path>
                </g>
                
                {/* Sad mouth - curved down with thicker stroke */}
                <path d="M 30 68 Q 50 58, 70 68" stroke="hsl(var(--muted))" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                
                {/* Inner highlight on face for depth */}
                <circle cx="38" cy="32" r="3" fill="rgba(255,255,255,0.3)"/>
                <circle cx="68" cy="32" r="3" fill="rgba(255,255,255,0.3)"/>
                
                {/* Filter definition for tear glow */}
                <defs>
                  <filter id="tearGlow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
              </svg>
            </div>
          </div>

          {/* Title - centered with enhanced readability */}
          <div 
            className="relative rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500 delay-100"
            style={{
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
              borderRadius: 'clamp(1rem, 2vw, 1.5rem)'
            }}
          >
            {/* Dark semi-transparent background for better readability */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm border-2 border-white/20" 
              style={{ 
                borderRadius: 'clamp(1rem, 2vw, 1.5rem)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 4px rgba(255,255,255,0.05)' 
              }} 
              aria-hidden 
            />
            
            <h2 
              className="relative z-10 font-black text-center text-white" 
              style={{ 
                fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
                textShadow: '0 0 20px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,1), -2px -2px 4px rgba(0,0,0,1), 2px -2px 4px rgba(0,0,0,1), -2px 2px 4px rgba(0,0,0,1)' 
              }}
            >
              {t('game.exit.title')}
            </h2>
          </div>

          {/* Description - enhanced readability */}
          <div 
            className="relative rounded-xl animate-in fade-in slide-in-from-top-2 duration-500 delay-200"
            style={{
              padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
              borderRadius: 'clamp(0.75rem, 1.5vw, 1rem)'
            }}
          >
            {/* Dark semi-transparent background */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm border border-white/10" 
              style={{ borderRadius: 'clamp(0.75rem, 1.5vw, 1rem)' }}
              aria-hidden 
            />
            
            <div 
              className="relative z-10 text-center"
              style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 1vw, 1rem)' }}
            >
              {!gameCompleted && (
                <p 
                  className="text-destructive font-black animate-pulse" 
                  style={{ 
                    fontSize: 'clamp(1rem, 3vw, 1.125rem)',
                    textShadow: '0 0 10px rgba(255,0,0,0.9), 1px 1px 3px rgba(0,0,0,1), -1px -1px 3px rgba(0,0,0,1)' 
                  }}
                >
                  {t('game.exit.gold_lost_warning')}
                </p>
              )}
              <p 
                className="text-white font-semibold" 
                style={{ 
                  fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                  textShadow: '0 0 10px rgba(0,0,0,0.9), 1px 1px 3px rgba(0,0,0,1), -1px -1px 3px rgba(0,0,0,1)' 
                }}
              >
                {gameCompleted 
                  ? t('game.exit.game_completed_message')
                  : t('game.exit.incomplete_game_message')}
              </p>
            </div>
          </div>

          {/* 3D Buttons */}
          <div 
            className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
            style={{
              gap: 'clamp(0.75rem, 2vw, 1rem)',
              marginTop: 'clamp(0.5rem, 1.5vw, 1rem)'
            }}
          >
            {/* Exit Button - 3D Red */}
            <button
              onClick={onConfirmExit}
              className="relative w-full font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
                borderRadius: 'clamp(1rem, 2vw, 1.5rem)',
                fontSize: 'clamp(1rem, 3vw, 1.125rem)'
              }}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-destructive via-destructive to-destructive border-2 border-destructive/50 shadow-lg shadow-destructive/30" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-destructive via-destructive to-destructive" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-b from-destructive/40 via-destructive/40 to-destructive/40" style={{ boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.075), inset 0 -4px 10px rgba(0,0,0,0.2)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)' }} aria-hidden />
              
              {/* Text */}
              <span className="relative z-10 drop-shadow-lg">{t('game.exit.exit_button')}</span>
            </button>

            {/* Stay Button - 3D Green */}
            <button
              onClick={() => onOpenChange(false)}
              className="relative w-full font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
                borderRadius: 'clamp(1rem, 2vw, 1.5rem)',
                fontSize: 'clamp(1rem, 3vw, 1.125rem)'
              }}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/40 rounded-2xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-success via-success to-success border-2 border-success/50 shadow-lg shadow-success/30" aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[3px] rounded-2xl bg-gradient-to-b from-success via-success to-success" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[5px] rounded-2xl bg-gradient-to-b from-success/40 via-success/40 to-success/40" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[5px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)' }} aria-hidden />
              
              {/* Text */}
              <span className="relative z-10 drop-shadow-lg">{t('game.exit.stay_button')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
