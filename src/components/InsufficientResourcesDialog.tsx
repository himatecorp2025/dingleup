import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';
import { CreditCard, Sparkles, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface InsufficientResourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'coins' | 'lives' | 'both';
  requiredAmount?: number;
  currentAmount?: number;
  onGoToShop: () => void;
  userId?: string;
  onPurchaseComplete?: () => void;
}

export const InsufficientResourcesDialog = ({
  open,
  onOpenChange,
  type,
  requiredAmount,
  currentAmount,
  onGoToShop,
  userId,
  onPurchaseComplete
}: InsufficientResourcesDialogProps) => {
  const isHandheld = usePlatformDetection();
  const [contentVisible, setContentVisible] = useState(false);
  const flagRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [burstActive, setBurstActive] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute in seconds

  // Sync badge width to button (account for inner hexagon vs. outer frame ratio)
  useEffect(() => {
    if (!badgeRef.current || !buttonWrapperRef.current) return;

    const INNER_TO_OUTER_RATIO = 132 / 108; // outerHexWidth / innerGreenWidth

    const syncWidth = () => {
      // Use offsetWidth (transform-independent) instead of getBoundingClientRect
      const badgeWidth = badgeRef.current?.offsetWidth;
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

  // Sync --shield-w to content width for proportional scaling
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      el.style.setProperty('--shield-w', `${w}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

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
    
    // 700ms delay after shield appears (shield has 150ms delay, so total 850ms)
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
    }, 700);

    return () => clearTimeout(timer);
  }, [contentVisible, open]);

  // 1-minute countdown timer
  useEffect(() => {
    if (!open) {
      setTimeLeft(60);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onOpenChange(false);
          toast.info("Az ajánlat lejárt");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, onOpenChange]);

  const handleStartPayment = async () => {
    if (!userId) {
      toast.error('Nincs bejelentkezve');
      return;
    }

    setIsLoadingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-ingame-payment');
      
      if (error) throw error;
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error('Fizetés indítása sikertelen');
      setIsLoadingPayment(false);
    }
  };

  if (!isHandheld || !open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          style={{ minHeight: '100vh', minWidth: '100vw' }}
        >
          {/* Background layer - Deep gradient */}
          <div className="absolute inset-0 w-full h-full min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" style={{ opacity: 0.85, borderRadius: 0 }}></div>

          {/* Floating sparkle particles - EXPLOSIVE BURST FROM FLAG CENTER then continuous float */}
          {contentVisible && burstActive && (
            <div key={burstKey} className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(60)].map((_, i) => {
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

          {/* ZOOM WRAPPER - faster shield appearance */}
          <div 
            className="relative z-10"
            style={{ 
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1200ms ease-in-out 150ms, opacity 1200ms ease-in-out 150ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto'
            }}
          >
            {/* SHIELD CONTAINER - always scale(1) so SVG filters render immediately */}
            <div style={{ transform: 'scale(1)' }}>
              
              {/* Background glow behind shield - removed to prevent purple pulse */}

              <HexShieldFrame>
                {/* Top Hex Badge - "BUY NOW" - 3D GOLD FRAME - COVERS TOP POINT */}
                <div 
                  ref={badgeRef}
                  className="relative -mt-12 mb-3 mx-auto z-20" 
                  style={{ width: '78%' }}
                >
                  {/* 3D Shadow base */}
                  <div className="absolute inset-0 translate-y-1 translate-x-1"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'rgba(0,0,0,0.4)',
                         filter: 'blur(4px)',
                         zIndex: -1
                       }} />
                  
                  {/* Outer gold frame */}
                  <div className="absolute inset-0"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                         boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 6px 16px rgba(0,0,0,0.35)'
                       }} />
                  
                  {/* Middle gold highlight frame */}
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
                    {/* Inner RED RUBY crystal with diagonal streaks */}
                    <div className="absolute inset-[6px]"
                         style={{
                           clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                           background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(0 95% 75%) 0%, hsl(0 90% 65%) 30%, hsl(0 85% 55%) 60%, hsl(0 78% 48%) 100%)',
                           boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.25), inset 0 -12px 24px rgba(0,0,0,0.4)'
                         }} />
                    
                    {/* Diagonal light streaks - SAME as ELFOGADOM button */}
                    <div className="absolute inset-[6px] pointer-events-none"
                         style={{
                           clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                           background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                           opacity: 0.7
                         }} />
                    
                    {/* Specular highlight */}
                    <div className="absolute inset-[6px] pointer-events-none" style={{
                      clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                      background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                    }} />
                    
                    <h1 className="relative z-10 font-black text-white text-center drop-shadow-[0_0_18px_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.9)]"
                        style={{ 
                          fontSize: 'clamp(1.25rem, 5.2vw, 2.1rem)', 
                          letterSpacing: '0.05em',
                          textShadow: '0 0 12px rgba(255,255,255,0.25)'
                        }}>
                      BUY NOW
                    </h1>
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-[6%] pb-[6%]" ref={contentRef} style={{ ['--shield-w' as any]: '320px' }}>
                  
                  
                  {/* Timer countdown at top */}
                  <div className="flex items-center gap-2 mb-3 bg-red-600/90 px-4 py-2 rounded-full animate-pulse">
                    <Clock className="w-5 h-5 text-white" />
                    <span className="text-white font-black text-base">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* BEST DEAL badge */}
                  <div className="mb-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 px-6 py-1.5 rounded-full animate-pulse shadow-lg shadow-yellow-500/50">
                    <span className="text-black font-black text-sm tracking-wider">⚡ BEST DEAL ⚡</span>
                  </div>
                  
                  {/* Resources Display - 3D SVG icons */}
                  <div className="relative flex items-center justify-center gap-[calc(var(--shield-w)*0.06)] mb-[2vh]">
                    <div className="flex items-center gap-[calc(var(--shield-w)*0.02)]">
                      {/* 3D Gold Coin SVG */}
                      <svg viewBox="0 0 64 64" style={{ width: 'calc(var(--shield-w)*0.1)', height: 'calc(var(--shield-w)*0.1)', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.7)) drop-shadow(0 0 20px rgba(255,215,0,0.8))' }}>
                        <defs>
                          <radialGradient id="goldGradient" cx="35%" cy="25%">
                            <stop offset="0%" stopColor="#ffd700" />
                            <stop offset="40%" stopColor="#ffed4e" />
                            <stop offset="70%" stopColor="#d4af37" />
                            <stop offset="100%" stopColor="#b8860b" />
                          </radialGradient>
                          <radialGradient id="goldHighlight" cx="30%" cy="20%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <ellipse cx="32" cy="34" rx="28" ry="26" fill="rgba(0,0,0,0.4)" />
                        <ellipse cx="32" cy="32" rx="28" ry="26" fill="url(#goldGradient)" stroke="#b8860b" strokeWidth="2" />
                        <ellipse cx="32" cy="32" rx="22" ry="20" fill="none" stroke="#d4af37" strokeWidth="1.5" opacity="0.6" />
                        <ellipse cx="32" cy="32" rx="28" ry="26" fill="url(#goldHighlight)" />
                        <text x="32" y="40" fontSize="28" fontWeight="black" fill="#b8860b" textAnchor="middle" fontFamily="Arial">$</text>
                      </svg>
                      <span 
                        className="font-black text-yellow-200"
                        style={{
                          fontSize: 'calc(var(--shield-w)*0.09)',
                          lineHeight: 1,
                          textShadow: '0 6px 12px rgba(0,0,0,0.7), 0 3px 6px rgba(0,0,0,0.5), 0 0 16px rgba(253,224,71,0.6), 0 0 24px rgba(255,215,0,0.4)'
                        }}
                      >
                        500
                      </span>
                    </div>
                    <div 
                      className="font-black text-yellow-200"
                      style={{
                        fontSize: 'calc(var(--shield-w)*0.1)',
                        lineHeight: 1,
                        textShadow: '0 4px 8px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)'
                      }}
                    >
                      +
                    </div>
                    <div className="flex items-center gap-[calc(var(--shield-w)*0.02)]">
                      {/* 3D Heart SVG */}
                      <svg viewBox="0 0 64 64" style={{ width: 'calc(var(--shield-w)*0.1)', height: 'calc(var(--shield-w)*0.1)', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.7)) drop-shadow(0 0 20px rgba(239,68,68,0.8))' }}>
                        <defs>
                          <radialGradient id="heartGradient" cx="40%" cy="30%">
                            <stop offset="0%" stopColor="#ff6b6b" />
                            <stop offset="40%" stopColor="#ef4444" />
                            <stop offset="70%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#991b1b" />
                          </radialGradient>
                          <radialGradient id="heartHighlight" cx="35%" cy="25%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <path d="M32 54 C12 42, 8 32, 8 24 C8 16, 14 10, 20 10 C26 10, 30 14, 32 18 C34 14, 38 10, 44 10 C50 10, 56 16, 56 24 C56 32, 52 42, 32 54 Z" fill="rgba(0,0,0,0.4)" transform="translate(0, 2)" />
                        <path d="M32 52 C12 40, 8 30, 8 22 C8 14, 14 8, 20 8 C26 8, 30 12, 32 16 C34 12, 38 8, 44 8 C50 8, 56 14, 56 22 C56 30, 52 40, 32 52 Z" fill="url(#heartGradient)" stroke="#991b1b" strokeWidth="1.5" />
                        <path d="M32 52 C12 40, 8 30, 8 22 C8 14, 14 8, 20 8 C26 8, 30 12, 32 16 C34 12, 38 8, 44 8 C50 8, 56 14, 56 22 C56 30, 52 40, 32 52 Z" fill="url(#heartHighlight)" />
                      </svg>
                      <span 
                        className="font-black text-red-400"
                        style={{
                          fontSize: 'calc(var(--shield-w)*0.09)',
                          lineHeight: 1,
                          textShadow: '0 6px 12px rgba(0,0,0,0.7), 0 3px 6px rgba(0,0,0,0.5), 0 0 16px rgba(248,113,113,0.6), 0 0 24px rgba(239,68,68,0.4)'
                        }}
                      >
                        15
                      </span>
                    </div>
                  </div>

                  {/* Price with "MA CSAK" label and discount badge */}
                  <div className="text-center mb-[2vh] relative">
                    <div 
                      className="text-[clamp(0.9rem,3.8vw,1.4rem)] font-black text-yellow-400 mb-1 uppercase tracking-wider"
                      style={{
                        textShadow: '0 3px 6px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.6)'
                      }}
                    >
                      MA CSAK
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <div 
                        className="font-black text-yellow-400"
                        style={{
                          fontSize: 'calc(var(--shield-w)*0.16)',
                          lineHeight: 1,
                          textShadow: '0 5px 12px rgba(0,0,0,0.8), 0 3px 6px rgba(0,0,0,0.6), 0 0 24px rgba(255,215,0,0.7)'
                        }}
                        ref={flagRef}
                      >
                        $0.99
                      </div>
                      {/* -80% OFF badge */}
                      <div className="bg-red-600 text-white px-3 py-1 rounded-lg font-black text-sm rotate-12 shadow-lg animate-pulse">
                        -80%
                      </div>
                    </div>
                  </div>

                  {/* Additional Info - 3D effect */}
                  <div className="text-center mb-[2vh]">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-lg" />
                      <p 
                        className="text-[clamp(0.75rem,3vw,1rem)] text-yellow-100 font-bold"
                        style={{
                          textShadow: '0 3px 6px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)'
                        }}
                      >
                        Azonnal jóváírva
                      </p>
                      <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-lg" />
                    </div>
                  </div>

                  {/* Payment methods - Smaller, no box */}
                  <div className="relative flex flex-col items-center gap-2 mb-[2vh]">
                    <p className="text-[clamp(0.5rem,2vw,0.7rem)] text-white/70 font-medium">
                      Biztonságos fizetés:
                    </p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-white/70" />
                      <span className="text-[clamp(0.45rem,1.8vw,0.65rem)] text-white/70">Apple Pay • Google Pay • Kártya</span>
                    </div>
                  </div>

                  {/* MEGSZERZEM MOST! button (ZÖLD) - Equal padding on all sides */}
                  <div 
                    ref={buttonWrapperRef}
                    className="flex justify-center mt-auto w-full"
                  >
                    <HexAcceptButton 
                      onClick={handleStartPayment} 
                      disabled={isLoadingPayment}
                      style={{ 
                        width: '100%',
                        fontSize: 'calc(var(--shield-w)*0.045)',
                        transform: 'translateZ(0)'
                      }} 
                    >
                      {isLoadingPayment ? 'Betöltés...' : 'MEGSZERZEM MOST!'}
                    </HexAcceptButton>
                  </div>
                </div>
              </HexShieldFrame>
            </div>
          </div>

          {/* Close X button - closer to shield */}
          <button
            onClick={() => onOpenChange(false)}
            className={`absolute top-[8vh] right-[4vw] text-white/70 hover:text-white font-bold z-30 w-[12vw] h-[12vw] max-w-[60px] max-h-[60px] flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-all transform duration-500 ease-out ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)', transitionDelay: '600ms' }}
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};