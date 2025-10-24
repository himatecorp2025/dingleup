import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackBonusEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';

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
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [burstActive, setBurstActive] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

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
        className="overflow-auto p-0 border-0 bg-transparent w-screen h-screen max-w-none"
        style={{ 
          margin: 0,
          maxHeight: '100vh'
        }}
      >
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center py-4 overflow-y-auto"
        >
          {/* Background layer - 75% transparent (25% opacity) */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 opacity-25"></div>
          {/* Animated radial glow from center - FULL OPACITY */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] animate-spin"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, rgba(147,51,234,0.3) 10%, transparent 20%, rgba(147,51,234,0.3) 30%, transparent 40%, rgba(147,51,234,0.3) 50%, transparent 60%, rgba(147,51,234,0.3) 70%, transparent 80%, rgba(147,51,234,0.3) 90%, transparent 100%)',
                animationDuration: '20s'
              }}
            ></div>
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] animate-spin"
              style={{
                background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(147,51,234,0.2) 30%, transparent 70%)',
                animationDuration: '15s',
                animationDirection: 'reverse'
              }}
            ></div>
          </div>

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

          {/* Central HEXAGON container - DELAY 300ms */}
          <div className={`relative z-10 transform transition-all duration-500 ease-out ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
               style={{ transitionDelay: '300ms' }}>
            
            {/* Purple radial glow effect behind hexagon */}
            <div className="absolute inset-0 -z-10"
                 style={{
                   background: 'radial-gradient(ellipse, rgba(147,51,234,0.8) 0%, rgba(126,34,206,0.6) 25%, rgba(107,33,168,0.4) 40%, rgba(88,28,135,0.2) 55%, transparent 70%)',
                   width: '180%',
                   height: '180%',
                   left: '-40%',
                   top: '-40%',
                   filter: 'blur(30px)',
                   animation: 'pulse 3s ease-in-out infinite'
                 }}></div>

            {/* Outer hexagon - light pink/purple thick border */}
            <div className="relative"
                 style={{
                   width: 'clamp(300px, 70vw, 480px)',
                   height: 'clamp(400px, 90vh, 650px)',
                   clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                   background: 'linear-gradient(135deg, #f0c1ff 0%, #e0b3ff 50%, #d1a5ff 100%)',
                   padding: '12px',
                   filter: 'drop-shadow(0 0 30px rgba(147,51,234,0.6))'
                 }}>
              
              {/* Middle hexagon - gold border */}
              <div className="absolute inset-[12px]"
                   style={{
                     clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                     background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                     padding: '6px'
                   }}>
                
                {/* Inner hexagon - purple gradient background */}
                <div ref={flagRef} className="absolute inset-[6px] flex flex-col"
                     style={{
                       clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                       background: 'linear-gradient(180deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%)'
                     }}>
                  
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/20 via-transparent to-purple-900/30 pointer-events-none"
                       style={{
                         clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                       }}></div>

                  {/* Hexagon header banner */}
                  <div className="relative mt-[5%] mx-auto z-10"
                       style={{ width: '80%' }}>
                    <div className="relative bg-gradient-to-b from-purple-700 via-purple-800 to-purple-900 px-[8vw] py-[2vh] border-4 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.8)]"
                         style={{
                           clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)'
                         }}>
                      <div className="absolute inset-[4px] bg-gradient-to-b from-yellow-400/20 to-transparent"
                           style={{
                             clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)'
                           }}></div>
                      <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-orange-400 text-center drop-shadow-[0_2px_10px_rgba(0,0,0,1)] relative z-10"
                          style={{ 
                            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                            WebkitTextStroke: '1.5px rgba(255,165,0,0.4)',
                            letterSpacing: '0.05em'
                          }}>
                        DAILY GIFT
                      </h1>
                    </div>
                  </div>

                  {/* Content area */}
                  <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-[6%] pb-[8%]">
                    {/* 3 Stars */}
                    <div className="flex gap-[3vw] my-[2vh]">
                      {[1, 2, 3].map((i) => (
                        <div key={i} style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)' }}>
                          ⭐
                        </div>
                      ))}
                    </div>

                    {/* Day counter */}
                    <p className="font-black text-white text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mb-[1vh]" 
                       style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', letterSpacing: '0.05em' }}>
                      DAY {weeklyEntryCount + 1}
                    </p>

                    {/* 7 mini stars progress */}
                    <div className="flex gap-[1.5vw] justify-center mb-[2vh]">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div
                          key={day}
                          className={`transition-all duration-500 ${day <= weeklyEntryCount + 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-30'}`}
                          style={{ 
                            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
                            filter: day <= weeklyEntryCount + 1 ? 'drop-shadow(0 0 6px gold)' : 'grayscale(1)'
                          }}
                        >
                          {day <= weeklyEntryCount + 1 ? '⭐' : '☆'}
                        </div>
                      ))}
                    </div>

                    {/* Streak text */}
                    <p className="text-white font-bold text-center drop-shadow-lg mb-[2vh]" 
                       style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)' }}>
                      {weeklyEntryCount + 1}. napi belépés 🔥
                    </p>

                    {/* Reward box - gold border, purple background */}
                    <div className="bg-gradient-to-b from-purple-600 to-purple-800 border-4 border-yellow-400 rounded-xl px-[6vw] py-[2vh] shadow-[0_4px_15px_rgba(0,0,0,0.5)] mb-[3vh]">
                      {isPremium ? (
                        <div className="flex flex-col items-center gap-[0.5vh]">
                          <div className="flex items-center gap-[2vw]">
                            <div className="rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(255,215,0,0.8)]" 
                                 style={{ width: 'clamp(1.5rem, 6vw, 2.25rem)', height: 'clamp(1.5rem, 6vw, 2.25rem)', border: '2px solid #FFD700' }}></div>
                            <span className="font-black text-yellow-300/50 line-through" 
                                  style={{ fontSize: 'clamp(1rem, 4.5vw, 1.5rem)' }}>
                              +{nextReward / 2}
                            </span>
                          </div>
                          <div className="flex items-center gap-[2vw]">
                            <div className="rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-[0_0_20px_rgba(255,215,0,0.9)]" 
                                 style={{ width: 'clamp(2rem, 8vw, 3rem)', height: 'clamp(2rem, 8vw, 3rem)', border: '3px solid #FFD700' }}></div>
                            <span className="font-black text-yellow-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" 
                                  style={{ fontSize: 'clamp(1.75rem, 7vw, 2.75rem)' }}>
                              +{nextReward}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-[2vw]">
                          <div className="rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 shadow-[0_0_20px_rgba(255,215,0,0.9)]" 
                               style={{ width: 'clamp(2rem, 8vw, 3.25rem)', height: 'clamp(2rem, 8vw, 3.25rem)', border: '3px solid #FFD700' }}></div>
                          <span className="font-black text-yellow-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" 
                                style={{ fontSize: 'clamp(1.75rem, 7vw, 2.75rem)' }}>
                            +{nextReward}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3 Round buttons - pink gradient with hexagon icons */}
                    <div className="flex gap-[3vw] justify-center">
                      {/* List button */}
                      <button className="w-[14vw] h-[14vw] max-w-[70px] max-h-[70px] rounded-full bg-gradient-to-b from-pink-400 via-pink-500 to-pink-600 border-4 border-pink-300 shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center">
                        <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>☰</span>
                      </button>
                      
                      {/* OK/COLLECT button */}
                      {canClaim ? (
                        <button
                          onClick={handleClaim}
                          className="w-[14vw] h-[14vw] max-w-[70px] max-h-[70px] rounded-full bg-gradient-to-b from-pink-400 via-pink-500 to-pink-600 hover:from-pink-500 hover:to-pink-700 border-4 border-pink-300 shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:shadow-[0_6px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center"
                        >
                          <span className="text-white font-black" style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)' }}>OK</span>
                        </button>
                      ) : (
                        <button className="w-[14vw] h-[14vw] max-w-[70px] max-h-[70px] rounded-full bg-gradient-to-b from-green-400 to-green-600 border-4 border-green-300 shadow-[0_4px_0_rgba(0,0,0,0.3)] flex items-center justify-center">
                          <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>✓</span>
                        </button>
                      )}
                      
                      {/* Replay button */}
                      <button className="w-[14vw] h-[14vw] max-w-[70px] max-h-[70px] rounded-full bg-gradient-to-b from-pink-400 via-pink-500 to-pink-600 border-4 border-pink-300 shadow-[0_4px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center">
                        <span style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}>↻</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lives bonus - green circle badge */}
            {isPremium && (
              <div className="absolute -right-[8vw] top-[40%] bg-gradient-to-b from-green-400 to-green-600 border-4 border-white rounded-full w-[16vw] h-[16vw] max-w-[80px] max-h-[80px] flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.5)] z-20 animate-bounce">
                <span className="text-white font-black drop-shadow-lg" style={{ fontSize: 'clamp(1.125rem, 5vw, 1.75rem)' }}>+3</span>
                <span style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)' }}>❤️</span>
              </div>
            )}
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
