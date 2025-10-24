import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackBonusEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';

interface DailyGiftDialogProps {
  open: boolean;
  onClaim: () => void;
  onClaimSuccess?: () => void;
  onLater: () => void;
  weeklyEntryCount: number;
  nextReward: number;
  canClaim: boolean;
  isPremium?: boolean;
}

const DAILY_REWARDS = [50, 75, 110, 160, 220, 300, 500];

const DailyGiftDialog = ({ 
  open, 
  onClaim,
  onClaimSuccess,
  onLater,
  weeklyEntryCount, 
  nextReward, 
  canClaim,
  isPremium = false 
}: DailyGiftDialogProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const isHandheld = usePlatformDetection();
  const [contentVisible, setContentVisible] = useState(false);
  const flagRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [burstActive, setBurstActive] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  // Sync badge width to button (account for inner hexagon vs. outer frame ratio)
  useEffect(() => {
    if (!badgeRef.current || !buttonWrapperRef.current) return;

    const INNER_TO_OUTER_RATIO = 132 / 108; // outerHexWidth / innerGreenWidth

    const syncWidth = () => {
      const badgeWidth = badgeRef.current?.getBoundingClientRect().width;
      if (badgeWidth && buttonWrapperRef.current) {
        const targetButtonWidth = Math.round(badgeWidth * INNER_TO_OUTER_RATIO);
        buttonWrapperRef.current.style.setProperty('--sync-width', `${targetButtonWidth}px`);
      }
    };

    syncWidth();
    const observer = new ResizeObserver(syncWidth);
    observer.observe(badgeRef.current);
    window.addEventListener('resize', syncWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncWidth);
    };
  }, [contentVisible, open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setContentVisible(true), 10);
      return () => {
        clearTimeout(t);
        setContentVisible(false);
        setBurstActive(false);
      };
    } else {
      setContentVisible(false);
      setBurstActive(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!contentVisible) return;
    
    // 200ms delay after shield appears (shield has 300ms delay, so total 500ms)
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        const el = flagRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
          const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
          setOrigin({ x, y });
          setBurstKey((k) => k + 1);
          setBurstActive(true);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [contentVisible, open]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (open && userId) {
      trackBonusEvent(userId, 'daily_shown', 'daily', {
        coins_amount: nextReward,
        streak_day: weeklyEntryCount + 1,
        is_subscriber: isPremium
      });
    }
  }, [open, userId, nextReward, weeklyEntryCount, isPremium]);

  const handleClaim = () => {
    onClaim();
    
    if (userId) {
      trackBonusEvent(userId, 'daily_claimed', 'daily', {
        coins_amount: nextReward,
        streak_day: weeklyEntryCount + 1,
        is_subscriber: isPremium
      });
    }

    if (onClaimSuccess) {
      setTimeout(() => onClaimSuccess(), 500);
    }
  };

  if (!isHandheld || !open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onLater}>
      <DialogContent 
        className="overflow-auto p-0 border-0 bg-transparent w-screen h-screen max-w-none [&>button[data-dialog-close]]:hidden"
        style={{ 
          margin: 0,
          maxHeight: '100vh'
        }}
      >
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center py-4 overflow-y-auto"
        >
          {/* Background layer - statikus 75% áttetsző lila */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950" style={{ opacity: 0.75 }}></div>

          {/* Floating sparkle particles - EXPLOSIVE BURST FROM FLAG CENTER then continuous float */}
          {contentVisible && burstActive && (
            <div key={burstKey} className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(180)].map((_, i) => {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 60 + 40; // vw
                const size = Math.random() * 2 + 1.2;
                const burstDuration = Math.random() * 0.25 + 0.3; // 0.3-0.55s

                const endX = Math.cos(angle) * speed;
                const endY = Math.sin(angle) * speed;

                // Continuous floating parameters - faster and smoother
                const floatX = Math.random() * 40 - 20; // vw
                const floatY = Math.random() * 40 - 20; // vh
                const floatDuration = Math.random() * 1 + 1; // 1-2s - much faster
                const finalOpacity = Math.random() * 0.4 + 0.5; // 0.5-0.9

                return (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      background: '#FFD700',
                      left: `${origin.x}%`,
                      top: `${origin.y}%`,
                      boxShadow:
                        '0 0 20px 4px #FFD700, 0 0 35px 10px #FFA500, 0 0 60px 12px rgba(255, 215, 0, 0.85)',
                      filter: 'saturate(1.2) brightness(1.2)',
                      transform: 'translate(-50%, -50%)',
                      animation: `starBurst${i % 40} ${burstDuration}s cubic-bezier(0.2,0.8,0.2,1) forwards, starFloat${i % 40} ${floatDuration}s linear ${burstDuration}s infinite`,
                      animationDelay: `${i * 0.003}s`,
                      zIndex: 5
                    }}
                  >
                    <style>{`
                      @keyframes starBurst${i % 40} {
                        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                        10% { opacity: 1; }
                        100% { transform: translate(calc(-50% + ${endX}vw), calc(-50% + ${endY}vh)) scale(1); opacity: ${finalOpacity}; }
                      }
                      @keyframes starFloat${i % 40} {
                        0% { transform: translate(calc(-50% + ${endX}vw), calc(-50% + ${endY}vh)); }
                        12.5% { transform: translate(calc(-50% + ${endX + floatX * 0.25}vw), calc(-50% + ${endY + floatY * 0.25}vh)); }
                        25% { transform: translate(calc(-50% + ${endX + floatX * 0.5}vw), calc(-50% + ${endY + floatY * 0.5}vh)); }
                        37.5% { transform: translate(calc(-50% + ${endX + floatX * 0.75}vw), calc(-50% + ${endY + floatY * 0.75}vh)); }
                        50% { transform: translate(calc(-50% + ${endX + floatX}vw), calc(-50% + ${endY + floatY}vh)); }
                        62.5% { transform: translate(calc(-50% + ${endX + floatX * 0.75}vw), calc(-50% + ${endY - floatY * 0.25}vh)); }
                        75% { transform: translate(calc(-50% + ${endX + floatX * 0.5}vw), calc(-50% + ${endY - floatY * 0.5}vh)); }
                        87.5% { transform: translate(calc(-50% + ${endX + floatX * 0.25}vw), calc(-50% + ${endY - floatY * 0.25}vh)); }
                        100% { transform: translate(calc(-50% + ${endX}vw), calc(-50% + ${endY}vh)); }
                      }
                    `}</style>
                  </div>
                );
              })}
            </div>
          )}

          {/* Central HEXAGON (Flat-Top Geometry + 3D Specular) - DELAY 300ms */}
          <div className={`relative z-10 transition-all duration-[220ms] ease-out ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.96]'}`}
               style={{ transitionDelay: '300ms' }}>
            
            {/* Purple radial glow behind shield */}
            <div className="absolute inset-0 -z-10"
                 style={{
                   background: 'radial-gradient(ellipse 120% 80% at 50% 45%, rgba(147,51,234,0.75) 0%, rgba(126,34,206,0.45) 35%, rgba(88,28,135,0.25) 60%, transparent 75%)',
                   width: '180%', height: '180%', left: '-40%', top: '-40%', 
                   filter: 'blur(32px)',
                   animation: 'pulse 3s ease-in-out infinite'
                 }} />

            <HexShieldFrame>
              {/* Top Hex Badge - "DAILY GIFT" */}
              <div 
                ref={badgeRef}
                className="relative -mt-8 mb-3 mx-auto z-20" 
                style={{ width: 'max-content' }}
              >
                <div className="relative px-[5vw] py-[1.2vh] shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'radial-gradient(ellipse at 40% 20%, hsl(var(--dup-purple-300)), hsl(var(--dup-purple-500)) 50%, hsl(var(--dup-purple-800)))',
                       border: '4px solid hsl(var(--dup-gold-500))'
                     }}>
                  {/* Inner glow highlight */}
                  <div className="absolute inset-[3px] pointer-events-none" style={{
                    clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent 50%)'
                  }} />
                  
                  <h1 className="font-black text-white text-center drop-shadow-[0_0_18px_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.9)]"
                      style={{ 
                        fontSize: 'clamp(1.25rem, 5.2vw, 2.1rem)', 
                        letterSpacing: '0.05em',
                        textShadow: '0 0 12px rgba(255,255,255,0.25)'
                      }}>
                    DAILY GIFT
                  </h1>
                </div>
              </div>

              {/* Content Area */}
              <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-[4%] pb-[3%]">
                
                {/* 3 Big Golden Stars (metallic) */}
                <div className="flex gap-[2.5vw] my-[1.2vh]">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="relative" style={{ fontSize: 'clamp(2.25rem, 9vw, 3.5rem)' }}>
                      <span className="relative" style={{
                        filter: `drop-shadow(4px 6px 8px rgba(0,0,0,0.35)) 
                                 drop-shadow(0 0 12px hsl(var(--dup-gold-400)))`
                      }}>⭐</span>
                    </div>
                  ))}
                </div>

                {/* DAY Counter */}
                <p className="font-black text-white text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] mb-[1.2vh]"
                   style={{ 
                     fontSize: 'clamp(1.5rem, 6.5vw, 2.6rem)', 
                     letterSpacing: '0.06em',
                     textShadow: '0 0 16px rgba(255,255,255,0.2)'
                   }}>
                  DAY {weeklyEntryCount + 1}
                </p>

                {/* 7 Mini Stars Progress (horizontal row) */}
                <div className="flex gap-[1.8vw] justify-center mb-[1.2vh]">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const isActive = day <= weeklyEntryCount + 1;
                    return (
                      <div key={day}
                           className={`transition-all duration-500 ${isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-35'}`}
                           style={{ 
                             fontSize: 'clamp(0.875rem, 3.6vw, 1.3rem)',
                             filter: isActive 
                               ? `drop-shadow(0 0 6px hsl(var(--dup-gold-500)))` 
                               : 'grayscale(1)'
                           }}>
                        {isActive ? '⭐' : '☆'}
                      </div>
                    );
                  })}
                </div>

                {/* Streak Text */}
                <p className="text-white font-bold text-center drop-shadow-lg mb-[1.8vh]"
                   style={{ fontSize: 'clamp(0.875rem, 3.6vw, 1.15rem)' }}>
                  {weeklyEntryCount + 1}. napi belépés 🔥
                </p>

                {/* Reward Card (gem-style, floating) */}
                <div className="rounded-xl px-[5vw] py-[1.6vh] mb-[2.5vh] relative"
                     style={{
                       background: 'radial-gradient(ellipse at 40% 30%, hsl(var(--dup-purple-400)), hsl(var(--dup-purple-600)) 60%, hsl(var(--dup-purple-800)))',
                       border: '4px solid hsl(var(--dup-gold-500))',
                       boxShadow: `
                         inset 0 1px 0 rgba(255,255,255,0.6),
                         inset 0 -10px 24px rgba(0,0,0,0.25),
                         0 12px 24px rgba(0,0,0,0.35)
                       `
                     }}>
                  {isPremium ? (
                    <div className="flex flex-col items-center gap-[0.6vh]">
                      {/* Strikethrough old reward */}
                      <div className="flex items-center gap-[2vw]">
                        <div className="rounded-full shadow-[0_0_12px_rgba(255,215,0,0.6)]"
                             style={{ 
                               width: 'clamp(1.25rem, 5vw, 2rem)', 
                               height: 'clamp(1.25rem, 5vw, 2rem)', 
                               background: 'radial-gradient(circle at 35% 25%, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-600)))',
                               border: '2px solid hsl(var(--dup-gold-500))' 
                             }} />
                        <span className="font-black text-yellow-300/50 line-through" 
                              style={{ fontSize: 'clamp(0.875rem, 4vw, 1.25rem)' }}>
                          +{nextReward / 2}
                        </span>
                      </div>
                      {/* Active reward */}
                      <div className="flex items-center gap-[2vw]">
                        <div className="rounded-full shadow-[0_0_18px_rgba(255,215,0,0.85)]"
                             style={{ 
                               width: 'clamp(1.75rem, 7vw, 2.5rem)', 
                               height: 'clamp(1.75rem, 7vw, 2.5rem)', 
                               background: 'radial-gradient(circle at 35% 25%, hsl(var(--dup-gold-300)), hsl(var(--dup-gold-500)), hsl(var(--dup-gold-700)))',
                               border: '3px solid hsl(var(--dup-gold-400))' 
                             }} />
                        <span className="font-black text-yellow-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                              style={{ fontSize: 'clamp(1.5rem, 6.2vw, 2.35rem)' }}>
                          +{nextReward}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-[2vw]">
                      <div className="rounded-full shadow-[0_0_18px_rgba(255,215,0,0.85)]"
                           style={{ 
                             width: 'clamp(1.75rem, 7vw, 2.75rem)', 
                             height: 'clamp(1.75rem, 7vw, 2.75rem)', 
                             background: 'radial-gradient(circle at 35% 25%, hsl(var(--dup-gold-300)), hsl(var(--dup-gold-500)), hsl(var(--dup-gold-700)))',
                             border: '3px solid hsl(var(--dup-gold-400))' 
                           }} />
                      <span className="font-black text-yellow-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                            style={{ fontSize: 'clamp(1.5rem, 6.2vw, 2.35rem)' }}>
                        +{nextReward}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hex Accept Button */}
                <div 
                  ref={buttonWrapperRef}
                  className="flex justify-center mt-auto"
                  style={{
                    width: 'var(--sync-width, 100%)',
                    maxWidth: '100%'
                  }}
                >
                  {canClaim ? (
                    <HexAcceptButton onClick={handleClaim} />
                  ) : (
                    <HexAcceptButton disabled />
                  )}
                </div>
              </div>

              {/* Premium Lives Bonus Badge (floating, right side) */}
              {isPremium && (
                <div className="absolute -right-[6vw] top-[36%] rounded-full w-[14vw] h-[14vw] max-w-[72px] max-h-[72px] flex flex-col items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.45)] z-30 animate-bounce"
                     style={{ 
                       background: 'radial-gradient(circle at 35% 25%, hsl(142 70% 65%), hsl(142 70% 50%), hsl(142 70% 35%))',
                       border: '4px solid white' 
                     }}>
                  {/* Inner specular */}
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                       style={{
                         background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 60%)',
                         mixBlendMode: 'soft-light'
                       }} />
                  <span className="text-white font-black drop-shadow-lg relative z-10" 
                        style={{ fontSize: 'clamp(1rem, 4.5vw, 1.55rem)' }}>+3</span>
                  <span className="relative z-10" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>❤️</span>
                </div>
              )}
            </HexShieldFrame>
          </div>

          {/* Close X button - top right - DELAY 600ms */}
          <button
            onClick={onLater}
            className={`absolute top-[3vh] right-[4vw] text-white/70 hover:text-white font-bold z-30 w-[12vw] h-[12vw] max-w-[60px] max-h-[60px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-all transform duration-500 ease-out ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)', transitionDelay: '600ms' }}
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyGiftDialog;
