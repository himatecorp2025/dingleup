import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trackBonusEvent } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';

interface WelcomeBonusDialogProps {
  open: boolean;
  onClaim: () => Promise<boolean>;
  onLater: () => void;
  claiming: boolean;
}

export const WelcomeBonusDialog = ({ open, onClaim, onLater, claiming }: WelcomeBonusDialogProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (open && userId) {
      trackBonusEvent(userId, 'welcome_shown', 'welcome', {
        coins_amount: 2500,
        lives_amount: 50
      });
    }
  }, [open, userId]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setContentVisible(true), 10);
      return () => {
        clearTimeout(t);
        setContentVisible(false);
      };
    } else {
      setContentVisible(false);
    }
  }, [open]);

  const handleClaim = async () => {
    const success = await onClaim();
    if (success && userId) {
      trackBonusEvent(userId, 'welcome_claimed', 'welcome', {
        coins_amount: 2500,
        lives_amount: 50
      });
    }
  };

  // TESTING MODE: Show on all devices
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="overflow-hidden p-0 border-0 bg-transparent w-screen h-screen max-w-none rounded-none [&>button[data-dialog-close]]:hidden"
        style={{ 
          margin: 0,
          maxHeight: '100vh',
          minHeight: '100vh',
          borderRadius: 0
        }}
      >
        {/* Fullscreen center wrapper */}
        <div 
          className="fixed inset-0 flex flex-col items-center overflow-hidden"
          style={{ 
            minHeight: '100vh', 
            minWidth: '100vw',
            justifyContent: 'center',
            paddingTop: '0'
          }}
        >
          {/* Deep purple gradient background */}
          <div className="absolute inset-0 w-full h-full min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950" style={{ opacity: 0.95, borderRadius: 0 }}></div>

          {/* Animated golden particles */}
          {contentVisible && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => {
                const delay = Math.random() * 3;
                const duration = 4 + Math.random() * 2;
                const startX = Math.random() * 100;
                const startY = Math.random() * 100;
                
                return (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                    style={{
                      left: `${startX}%`,
                      top: `${startY}%`,
                      animation: `sparkle${i} ${duration}s ease-in-out ${delay}s infinite`,
                      boxShadow: '0 0 8px 2px rgba(250, 204, 21, 0.8)',
                      zIndex: 3
                    }}
                  >
                    <style>{`
                      @keyframes sparkle${i} {
                        0%, 100% { 
                          transform: scale(0) rotate(0deg);
                          opacity: 0;
                        }
                        50% { 
                          transform: scale(1.5) rotate(180deg);
                          opacity: 1;
                        }
                      }
                    `}</style>
                  </div>
                );
              })}
            </div>
          )}

          {/* ZOOM WRAPPER with mega glow */}
          <div 
            className="relative z-10"
            style={{ 
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1200ms cubic-bezier(0.34, 1.56, 0.64, 1) 10ms, opacity 1200ms ease-in-out 10ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto',
              filter: 'drop-shadow(0 0 60px rgba(250,204,21,0.8)) drop-shadow(0 0 100px rgba(234,179,8,0.5))',
              animation: 'welcomePulse 2.5s ease-in-out infinite'
            }}
          >
            <style>{`
              @keyframes welcomePulse {
                0%, 100% { 
                  filter: drop-shadow(0 0 60px rgba(250,204,21,0.8)) drop-shadow(0 0 100px rgba(234,179,8,0.5));
                }
                50% { 
                  filter: drop-shadow(0 0 80px rgba(250,204,21,1)) drop-shadow(0 0 120px rgba(234,179,8,0.7));
                }
              }
            `}</style>
            <HexShieldFrame showShine={true}>
              {/* Premium WELCOME badge */}
              <div 
                className="relative -mt-12 mb-4 mx-auto z-20" 
                style={{ width: '80%' }}
              >
                {/* 3D Shadow */}
                <div className="absolute inset-0 translate-y-2 translate-x-2"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'rgba(0,0,0,0.5)',
                       filter: 'blur(6px)',
                       zIndex: -1
                     }} />
                
                {/* Outer gold frame */}
                <div className="absolute inset-0"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'linear-gradient(135deg, #fbbf24, #f59e0b 50%, #d97706)',
                       boxShadow: 'inset 0 0 0 3px #b45309, 0 8px 24px rgba(0,0,0,0.4)'
                     }} />
                
                {/* Inner glow frame */}
                <div className="absolute inset-[4px]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'linear-gradient(180deg, #fef3c7, #fbbf24 40%, #f59e0b)',
                       boxShadow: 'inset 0 2px 0 #fef9c3'
                     }} />
                
                <div className="relative px-[6vw] py-[1.5vh]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     }}>
                  {/* Inner gradient crystal */}
                  <div className="absolute inset-[7px]"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'radial-gradient(ellipse 100% 80% at 50% -10%, #fef3c7 0%, #fbbf24 30%, #f59e0b 60%, #ea580c 100%)',
                         boxShadow: 'inset 0 15px 30px rgba(255,255,255,0.4), inset 0 -15px 30px rgba(0,0,0,0.3)'
                       }} />
                  
                  {/* Shine overlay */}
                  <div className="absolute inset-[7px] pointer-events-none" style={{
                    clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                    background: 'radial-gradient(ellipse 100% 70% at 35% 0%, rgba(255,255,255,0.7), transparent 70%)'
                  }} />
                  
                  <h1 className="relative z-10 font-black text-white text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.5),0_3px_10px_rgba(0,0,0,1)]"
                      style={{ 
                        fontSize: 'clamp(1.4rem, 5.5cqw, 2.3rem)', 
                        letterSpacing: '0.06em',
                        textShadow: '0 0 16px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.9)'
                      }}>
                    WELCOME!
                  </h1>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[8%] pb-[8%] pt-[2%]">
                
                {/* Subtitle */}
                <p className="text-center text-yellow-200 font-black mb-4"
                   style={{
                     fontSize: 'clamp(1rem, 4.8cqw, 1.4rem)',
                     textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)'
                   }}>
                  Különleges kezdő csomag!
                </p>

                {/* Rewards display */}
                <div className="w-full max-w-[85%] space-y-4 mb-6">
                  {/* Coins reward */}
                  <div className="relative">
                    {/* Glow background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-300/30 to-yellow-400/20 rounded-2xl blur-xl animate-pulse" />
                    
                    <div className="relative bg-gradient-to-br from-yellow-500/90 via-yellow-600/90 to-orange-600/90 border-4 border-yellow-300 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-4">
                        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-2xl">
                          <defs>
                            <radialGradient id="coinGrad">
                              <stop offset="0%" stopColor="#fef3c7" />
                              <stop offset="50%" stopColor="#fbbf24" />
                              <stop offset="100%" stopColor="#f59e0b" />
                            </radialGradient>
                          </defs>
                          <circle cx="50" cy="50" r="48" fill="url(#coinGrad)" stroke="#d97706" strokeWidth="3" />
                          <circle cx="50" cy="50" r="38" fill="none" stroke="#fef3c7" strokeWidth="2" opacity="0.6" />
                          <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#92400e" textAnchor="middle" fontFamily="serif">$</text>
                        </svg>
                        <div className="flex flex-col">
                          <span className="font-black text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]" 
                                style={{ fontSize: 'clamp(2rem, 10cqw, 3.5rem)', lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                            +2,500
                          </span>
                          <span className="text-yellow-100 font-bold" style={{ fontSize: 'clamp(0.75rem, 3cqw, 1rem)' }}>
                            ARANYÉRME
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lives reward */}
                  <div className="relative">
                    {/* Glow background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 via-pink-300/30 to-pink-400/20 rounded-2xl blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                    
                    <div className="relative bg-gradient-to-br from-pink-500/90 via-pink-600/90 to-rose-600/90 border-4 border-pink-300 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-4">
                        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-2xl">
                          <defs>
                            <radialGradient id="heartGrad">
                              <stop offset="0%" stopColor="#fecdd3" />
                              <stop offset="50%" stopColor="#fb7185" />
                              <stop offset="100%" stopColor="#e11d48" />
                            </radialGradient>
                          </defs>
                          <path d="M50 85 C20 65, 5 40, 5 25 C5 10, 15 5, 25 5 C35 5, 45 15, 50 20 C55 15, 65 5, 75 5 C85 5, 95 10, 95 25 C95 40, 80 65, 50 85 Z" 
                                fill="url(#heartGrad)" stroke="#9f1239" strokeWidth="2" />
                        </svg>
                        <div className="flex flex-col">
                          <span className="font-black text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]" 
                                style={{ fontSize: 'clamp(2rem, 10cqw, 3.5rem)', lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                            +50
                          </span>
                          <span className="text-pink-100 font-bold" style={{ fontSize: 'clamp(0.75rem, 3cqw, 1rem)' }}>
                            EXTRA ÉLET
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info text */}
                <p className="text-white/90 font-semibold text-center mb-4 px-4"
                   style={{ fontSize: 'clamp(0.8rem, 3.5cqw, 1rem)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  🎁 Egyszeri ajándék az induláshoz!
                </p>

                {/* Claim button - using gold hexagon style */}
                <div className="flex justify-center w-full px-[4%]">
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="relative grid place-items-center select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      width: "100%",
                      height: "clamp(60px, 15vh, 85px)",
                      boxSizing: "border-box",
                      outline: "none",
                      border: 0,
                      animation: "claimPulse 1.5s ease-in-out infinite",
                      containerType: "inline-size",
                      filter: 'drop-shadow(0 0 20px rgba(250,204,21,0.9)) drop-shadow(0 0 40px rgba(234,179,8,0.6))'
                    }}
                  >
                    <style>{`
                      @keyframes claimPulse {
                        0%, 100% { 
                          transform: scale(1);
                          filter: drop-shadow(0 0 20px rgba(250,204,21,0.9)) drop-shadow(0 0 40px rgba(234,179,8,0.6));
                        }
                        50% { 
                          transform: scale(1.05);
                          filter: drop-shadow(0 0 30px rgba(250,204,21,1)) drop-shadow(0 0 60px rgba(234,179,8,0.8));
                        }
                      }
                    `}</style>
                    
                    {/* Shadow */}
                    <div className="absolute" style={{
                      top: "8px", left: "8px", right: "-8px", bottom: "-8px",
                      clipPath: 'polygon(50% 0%, 92% 22.114%, 92% 77.886%, 50% 100%, 8% 77.886%, 8% 22.114%)',
                      background: "rgba(0,0,0,0.4)", filter: "blur(5px)"
                    }} />
                    
                    {/* Outer gold frame */}
                    <div className="absolute inset-0" style={{
                      clipPath: 'polygon(50% 0%, 92% 22.114%, 92% 77.886%, 50% 100%, 8% 77.886%, 8% 22.114%)',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b 50%, #d97706)',
                      boxShadow: 'inset 0 0 0 3px #92400e, 0 10px 25px rgba(0,0,0,0.4)'
                    }} />
                    
                    {/* Inner frame */}
                    <div className="absolute inset-[4px]" style={{
                      clipPath: 'polygon(50% 0.6%, 92% 22.114%, 92% 77.886%, 50% 99.4%, 8% 77.886%, 8% 22.114%)',
                      background: 'linear-gradient(180deg, #fef3c7, #fbbf24 40%, #f59e0b)',
                      boxShadow: 'inset 0 2px 0 #fef9c3'
                    }} />
                    
                    {/* Inner crystal */}
                    <div className="absolute" style={{
                      top: "7px", left: "7px", right: "7px", bottom: "7px",
                      clipPath: 'polygon(50% 0.6%, 92% 22.114%, 92% 77.886%, 50% 99.4%, 8% 77.886%, 8% 22.114%)',
                      background: 'radial-gradient(ellipse 100% 80% at 50% -10%, #10b981 0%, #059669 30%, #047857 60%, #065f46 100%)',
                      boxShadow: 'inset 0 15px 30px rgba(255,255,255,0.3), inset 0 -15px 30px rgba(0,0,0,0.4)'
                    }} />
                    
                    {/* Shine */}
                    <div className="absolute pointer-events-none" style={{
                      top: "7px", left: "7px", right: "7px", bottom: "7px",
                      clipPath: 'polygon(50% 0.6%, 92% 22.114%, 92% 77.886%, 50% 99.4%, 8% 77.886%, 8% 22.114%)',
                      background: 'radial-gradient(ellipse 100% 70% at 30% 0%, rgba(255,255,255,0.6), transparent 70%)'
                    }} />
                    
                    <span className="relative z-10 font-black text-white tracking-wider px-4"
                          style={{
                            fontSize: "clamp(0.9rem, 4cqw, 1.6rem)",
                            textShadow: "0 3px 10px rgba(0,0,0,1), 0 0 24px rgba(255,255,255,0.4)",
                            whiteSpace: "nowrap"
                          }}>
                      {claiming ? 'FELDOLGOZÁS...' : 'KÖSZÖNÖM!'}
                    </span>
                  </button>
                </div>
              </div>
            </HexShieldFrame>
          </div>

          {/* Later button */}
          <button
            onClick={onLater}
            disabled={claiming}
            className={`absolute bottom-[5vh] text-white/60 hover:text-white font-bold z-30 disabled:cursor-not-allowed transition-all duration-500 ease-out ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', transitionDelay: '800ms' }}
          >
            Később
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};