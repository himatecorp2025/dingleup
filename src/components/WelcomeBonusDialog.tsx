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
  const [isMobile, setIsMobile] = useState(false);
  const starCount = isMobile ? 30 : 80;

  useEffect(() => {
    const handleResize = () => {
      try {
        setIsMobile(window.innerWidth <= 768);
      } catch {}
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ 
            minHeight: '100vh', 
            minWidth: '100vw'
          }}
        >
          {/* 10% homályos háttér - 90% átlátszó */}
          <div className="absolute inset-0 w-full h-full min-h-screen bg-black/10 backdrop-blur-[1px]" style={{ borderRadius: 0 }}></div>

          {/* Animated golden stars + konfetti */}
          {contentVisible && (
            <>
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(starCount)].map((_, i) => {
                  const delay = Math.random() * 3;
                  const duration = 1.5 + Math.random() * 1;
                  const startX = Math.random() * 100;
                  const startY = Math.random() * 100;
                  const moveX = (Math.random() - 0.5) * 20;
                  const moveY = (Math.random() - 0.5) * 20;
                  
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${startX}%`,
                        top: `${startY}%`,
                        animation: `starFade${i} ${duration}s ease-in-out ${delay}s infinite`,
                        zIndex: 3
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="#fbbf24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <style>{`
                        @keyframes starFade${i} {
                          0%, 100% { 
                            transform: translate(0, 0) scale(0);
                            opacity: 0;
                          }
                          50% { 
                            transform: translate(${moveX}px, ${moveY}px) scale(1.5);
                            opacity: 1;
                          }
                        }
                      `}</style>
                    </div>
                  );
                })}
              </div>

              {/* Konfetti animáció */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => {
                  const delay = Math.random() * 2;
                  const duration = 3 + Math.random() * 2;
                  const startX = Math.random() * 100;
                  const rotate = Math.random() * 360;
                  const colors = ['#fbbf24', '#f59e0b', '#fb7185', '#a855f7', '#3b82f6'];
                  const color = colors[Math.floor(Math.random() * colors.length)];
                  
                  return (
                    <div
                      key={`confetti-${i}`}
                      className="absolute"
                      style={{
                        left: `${startX}%`,
                        top: '-10%',
                        animation: `confettiFall${i} ${duration}s linear ${delay}s infinite`,
                        zIndex: 2
                      }}
                    >
                      <div 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          background: color,
                          transform: `rotate(${rotate}deg)`,
                          opacity: 0.8
                        }}
                      />
                      <style>{`
                        @keyframes confettiFall${i} {
                          0% { 
                            transform: translateY(0) rotate(0deg);
                            opacity: 1;
                          }
                          100% { 
                            transform: translateY(110vh) rotate(720deg);
                            opacity: 0;
                          }
                        }
                      `}</style>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ZOOM WRAPPER - Pulzáló arany fénysugár háttér */}
          <div 
            className="relative z-10"
            style={{ 
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1.125s cubic-bezier(0.34, 1.56, 0.64, 1) 0ms, opacity 1.125s ease-in-out 0ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto',
            }}
          >
            {/* Pulzáló arany fénysugár háttér */}
            <div 
              className="absolute -inset-12"
              style={{
                background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(250,204,21,0.4) 0%, rgba(234,179,8,0.2) 40%, transparent 70%)',
                filter: 'blur(40px)',
                animation: 'welcomeShieldGlow 2s ease-in-out infinite',
                zIndex: -1,
                pointerEvents: 'none'
              }}
            ></div>
            <style>{`
              @keyframes welcomeShieldGlow {
                0%, 100% { 
                  filter: blur(40px) brightness(1);
                  opacity: 0.6;
                }
                50% { 
                  filter: blur(50px) brightness(1.3);
                  opacity: 1;
                }
              }
            `}</style>

            <HexShieldFrame showShine={true}>
              {/* Premium WELCOME badge - ARANY 3D */}
              <div 
                className="relative -mt-12 mb-4 mx-auto z-20" 
                style={{ width: '80%' }}
              >
                <div className="absolute inset-0 translate-y-1 translate-x-1"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'rgba(0,0,0,0.4)',
                       filter: 'blur(4px)',
                       zIndex: -1
                     }} />
                
                <div className="absolute inset-0"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                       boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 6px 16px rgba(0,0,0,0.35)'
                     }} />
                
                <div className="absolute inset-[3px]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                       boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                     }} />
                
                <div className="relative px-[5vw] py-[1.2vh]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     }}>
                  <div className="absolute inset-[6px]"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(48 100% 85%) 0%, hsl(45 95% 70%) 30%, hsl(42 90% 58%) 60%, hsl(38 85% 45%) 100%)',
                         boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.25), inset 0 -12px 24px rgba(0,0,0,0.4)'
                       }} />
                  
                  <div className="absolute inset-[6px] pointer-events-none"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                         opacity: 0.7
                       }} />
                  
                  <div className="absolute inset-[6px] pointer-events-none" style={{
                    clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                    background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.6), transparent 60%)'
                  }} />
                  
                  <h1 className="relative z-10 font-black text-white text-center drop-shadow-[0_0_18px_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.9)]"
                      style={{ 
                        fontSize: 'clamp(1.25rem, 5.2cqw, 2.1rem)', 
                        letterSpacing: '0.05em',
                        textShadow: '0 0 12px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.9)'
                      }}>
                    WELCOME!
                  </h1>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[8%] pb-[8%] pt-[2%]">
                
                {/* MARKETING banner - 3 csillag */}
                <div className="relative mb-2">
                  <div className="px-6 py-1.5 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-full border-2 border-red-300 shadow-lg"
                       style={{ 
                         boxShadow: '0 0 20px rgba(239,68,68,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
                         animation: 'offerPulse 1.5s ease-in-out infinite'
                       }}>
                    <p className="text-white font-black text-center tracking-wider flex items-center justify-center gap-2"
                       style={{ 
                         fontSize: 'clamp(0.65rem, 3cqw, 0.9rem)',
                         textShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 12px rgba(255,255,255,0.4)'
                       }}>
                      <span>⭐</span>
                      <span>KÜLÖNLEGES AJÁNLAT!</span>
                      <span>⭐</span>
                    </p>
                  </div>
                  <style>{`
                    @keyframes offerPulse {
                      0%, 100% { 
                        transform: scale(1);
                        filter: brightness(1);
                      }
                      50% { 
                        transform: scale(1.05);
                        filter: brightness(1.2);
                      }
                    }
                  `}</style>
                </div>

                {/* Subtitle */}
                <p className="text-center text-yellow-200 font-black mb-4"
                   style={{
                     fontSize: 'clamp(1rem, 4.8cqw, 1.4rem)',
                     textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)'
                   }}>
                  Különleges kezdő csomag!
                </p>

                {/* Rewards - Pulzáló érmék + piros szívek */}
                <div className="w-full max-w-[85%] space-y-3 mb-4">
                  {/* Coins - Pulzáló */}
                  <div className="relative">
                    <div className="absolute inset-0 translate-y-1 translate-x-1 bg-black/40 rounded-2xl blur-sm" />
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 rounded-2xl" 
                         style={{ boxShadow: 'inset 0 0 0 2px #b45309, 0 6px 16px rgba(0,0,0,0.35)' }} />
                    <div className="absolute inset-[3px] bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 rounded-2xl"
                         style={{ boxShadow: 'inset 0 1px 0 #fef3c7' }} />
                    
                    <div className="relative bg-gradient-to-br from-yellow-500/95 via-yellow-600/95 to-orange-600/95 rounded-2xl px-6 py-3"
                         style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.3)' }}>
                      <div className="absolute inset-[6px] rounded-2xl pointer-events-none"
                           style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4), transparent 60%)' }} />
                      
                      <div className="relative flex items-center justify-center gap-3">
                        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-2xl flex-shrink-0" style={{ animation: 'coinPulse 1.5s ease-in-out infinite' }}>
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
                        
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]" 
                                style={{ fontSize: 'clamp(1.75rem, 8.5cqw, 3rem)', lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                            +2,500
                          </span>
                          <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-2xl flex-shrink-0" style={{ animation: 'coinPulse 1.5s ease-in-out infinite 0.3s' }}>
                            <circle cx="50" cy="50" r="48" fill="url(#coinGrad)" stroke="#d97706" strokeWidth="3" />
                            <circle cx="50" cy="50" r="38" fill="none" stroke="#fef3c7" strokeWidth="2" opacity="0.6" />
                            <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#92400e" textAnchor="middle" fontFamily="serif">$</text>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lives - Pulzáló PIROS szívek */}
                  <div className="relative">
                    <div className="absolute inset-0 translate-y-1 translate-x-1 bg-black/40 rounded-2xl blur-sm" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-800 rounded-2xl"
                         style={{ boxShadow: 'inset 0 0 0 2px #7f1d1d, 0 6px 16px rgba(0,0,0,0.35)' }} />
                    <div className="absolute inset-[3px] bg-gradient-to-b from-red-400 via-red-500 to-red-700 rounded-2xl"
                         style={{ boxShadow: 'inset 0 1px 0 #fca5a5' }} />
                    
                    <div className="relative bg-gradient-to-br from-red-600/95 via-red-700/95 to-red-900/95 rounded-2xl px-6 py-3"
                         style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.3)' }}>
                      <div className="absolute inset-[6px] rounded-2xl pointer-events-none"
                           style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.4), transparent 60%)' }} />
                      
                      <div className="relative flex items-center justify-center gap-3">
                        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-2xl flex-shrink-0" style={{ animation: 'heartPulse 1.5s ease-in-out infinite' }}>
                          <defs>
                            <radialGradient id="heartGradRed">
                              <stop offset="0%" stopColor="#fca5a5" />
                              <stop offset="50%" stopColor="#ef4444" />
                              <stop offset="100%" stopColor="#dc2626" />
                            </radialGradient>
                          </defs>
                          <path d="M50 85 C20 65, 5 40, 5 25 C5 10, 15 5, 25 5 C35 5, 45 15, 50 20 C55 15, 65 5, 75 5 C85 5, 95 10, 95 25 C95 40, 80 65, 50 85 Z" 
                                fill="url(#heartGradRed)" stroke="#991b1b" strokeWidth="2" />
                        </svg>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]" 
                                style={{ fontSize: 'clamp(1.75rem, 8.5cqw, 3rem)', lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                            +50
                          </span>
                          <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-2xl flex-shrink-0" style={{ animation: 'heartPulse 1.5s ease-in-out infinite 0.3s' }}>
                            <path d="M50 85 C20 65, 5 40, 5 25 C5 10, 15 5, 25 5 C35 5, 45 15, 50 20 C55 15, 65 5, 75 5 C85 5, 95 10, 95 25 C95 40, 80 65, 50 85 Z" 
                                  fill="url(#heartGradRed)" stroke="#991b1b" strokeWidth="2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <style>{`
                  @keyframes coinPulse {
                    0%, 100% { 
                      transform: scale(1);
                      filter: drop-shadow(0 0 8px rgba(251,191,36,0.6));
                    }
                    50% { 
                      transform: scale(1.1);
                      filter: drop-shadow(0 0 16px rgba(251,191,36,1));
                    }
                  }
                  @keyframes heartPulse {
                    0%, 100% { 
                      transform: scale(1);
                      filter: drop-shadow(0 0 8px rgba(239,68,68,0.6));
                    }
                    50% { 
                      transform: scale(1.1);
                      filter: drop-shadow(0 0 16px rgba(239,68,68,1));
                    }
                  }
                `}</style>

                {/* Claim button */}
                <div className="flex justify-center w-full px-[4%] mt-3">
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="relative grid place-items-center select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      width: "100%",
                      height: "clamp(56px, 14vh, 80px)",
                      boxSizing: "border-box",
                      outline: "none",
                      border: 0,
                      animation: "claimPulse 1.125s ease-in-out infinite",
                      containerType: "inline-size",
                    }}
                  >
                    <style>{`
                      @keyframes claimPulse {
                        0%, 100% { 
                          transform: scale(1);
                          filter: brightness(1) drop-shadow(0 0 8px rgba(255,215,0,0.4)) drop-shadow(0 0 16px rgba(255,215,0,0.3));
                        }
                        50% { 
                          transform: scale(1.05);
                          filter: brightness(1.15) drop-shadow(0 0 20px rgba(255,215,0,0.9)) drop-shadow(0 0 40px rgba(255,215,0,0.6));
                        }
                      }
                    `}</style>
                    
                    <div className="absolute" style={{
                      top: "6px", left: "6px", right: "-6px", bottom: "-6px",
                      clipPath: 'polygon(50% 0%, 92% 22.114%, 92% 77.886%, 50% 100%, 8% 77.886%, 8% 22.114%)',
                      background: "rgba(0,0,0,0.35)", filter: "blur(4px)"
                    }} />
                    
                    <div className="absolute inset-0" style={{
                      clipPath: 'polygon(50% 0%, 92% 22.114%, 92% 77.886%, 50% 100%, 8% 77.886%, 8% 22.114%)',
                      background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                      boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 8px 20px rgba(0,0,0,0.35)'
                    }} />
                    
                    <div className="absolute inset-[3px]" style={{
                      clipPath: 'polygon(50% 0%, 92% 22.114%, 92% 77.886%, 50% 100%, 8% 77.886%, 8% 22.114%)',
                      background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                      boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                    }} />
                    
                    <div className="absolute" style={{
                      top: "6px", left: "6px", right: "6px", bottom: "6px",
                      clipPath: 'polygon(50% 0.6%, 92% 22.114%, 92% 77.886%, 50% 99.4%, 8% 77.886%, 8% 22.114%)',
                      background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(155 90% 82%) 0%, hsl(155 85% 68%) 30%, hsl(155 78% 58%) 60%, hsl(155 70% 45%) 100%)',
                      boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.25), inset 0 -12px 24px rgba(0,0,0,0.4)'
                    }} />
                    
                    <div className="absolute pointer-events-none" style={{
                      top: "6px", left: "6px", right: "6px", bottom: "6px",
                      clipPath: 'polygon(50% 0.6%, 92% 22.114%, 92% 77.886%, 50% 99.4%, 8% 77.886%, 8% 22.114%)',
                      background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.6), transparent 60%)'
                    }} />
                    
                    <div className="absolute pointer-events-none" style={{
                      top: "6px", left: "6px", right: "6px", bottom: "6px",
                      clipPath: 'polygon(50% 0.6%, 92% 22.114%, 92% 77.886%, 50% 99.4%, 8% 77.886%, 8% 22.114%)',
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                      opacity: 0.7
                    }} />
                    
                    <span className="relative z-10 font-black text-white tracking-[0.08em] px-4"
                          style={{
                            fontSize: "clamp(0.7rem, 3.5cqw, 1.45rem)",
                            textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)",
                            whiteSpace: "nowrap"
                          }}>
                      {claiming ? 'FELDOLGOZÁS...' : 'KÖSZÖNÖM!'}
                    </span>
                  </button>
                </div>
              </div>
            </HexShieldFrame>
          </div>

          {/* Close X button */}
          <button
            onClick={onLater}
            disabled={claiming}
            className={`absolute top-[8vh] right-[4vw] text-white/70 hover:text-white font-bold z-30 w-[12vw] h-[12vw] max-w-[60px] max-h-[60px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-all transform duration-500 ease-out ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)', transitionDelay: '0ms' }}
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
