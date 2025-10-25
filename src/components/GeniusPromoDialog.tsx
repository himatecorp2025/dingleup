import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { trackPromoEvent } from '@/lib/analytics';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';

interface GeniusPromoDialogProps {
  open: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
  onLater?: () => void;
}

export const GeniusPromoDialog = ({ open, onClose, onSubscribe, onLater }: GeniusPromoDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const isHandheld = usePlatformDetection();
  const [contentVisible, setContentVisible] = useState(false);

  // Get user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

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

  const handleSubscribe = async () => {
    if (onSubscribe) onSubscribe();
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
        toast.info('Átirányítás a fizetési oldalra...');
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error('Hiba történt az előfizetés indításakor');
    }
    setLoading(false);
  };

  const handleLater = () => {
    if (onLater) onLater();
    onClose();
  };

  // Track when dialog opens
  useEffect(() => {
    if (open && userId) {
      trackPromoEvent(userId, 'shown', 'genius_promo', {
        trigger: 'manual'
      });
    }
  }, [open, userId]);

  // Calculate discounted price (-25%)
  const basePrice = 2.99;
  const discountedPrice = Math.round(basePrice * 0.75 * 100) / 100;

  // Don't render on desktop/laptop
  if (!isHandheld || !open) return null;

  return (
    <Dialog open={open} onOpenChange={handleLater}>
      <DialogContent 
        className="overflow-hidden p-0 border-0 bg-transparent w-screen h-screen max-w-none rounded-none [&>button[data-dialog-close]]:hidden"
        style={{ 
          margin: 0,
          maxHeight: '100vh',
          minHeight: '100vh',
          borderRadius: 0
        }}
      >
        {/* Középre igazító konténer */}
        <div 
          className="fixed inset-0 flex flex-col items-center overflow-hidden"
          style={{ 
            minHeight: '100vh', 
            minWidth: '100vw',
            justifyContent: 'center',
            paddingTop: '0'
          }}
        >
          {/* Background layer - Deep gradient */}
          <div className="absolute inset-0 w-full h-full min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" style={{ opacity: 0.85, borderRadius: 0 }}></div>

          {/* Falling dollar bills - 3D SVG continuous animation */}
          {contentVisible && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => {
                const delay = Math.random() * 10;
                const duration = 8 + Math.random() * 4;
                const startX = Math.random() * 100;
                const swingAmount = 10 + Math.random() * 20;
                const rotation = Math.random() * 360;
                const rotationSpeed = (Math.random() - 0.5) * 720;
                
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${startX}%`,
                      top: '-10%',
                      animation: `dollarFall${i} ${duration}s linear ${delay}s infinite`,
                      zIndex: 3
                    }}
                  >
                    <svg 
                      viewBox="0 0 120 60" 
                      style={{ 
                        width: 'clamp(40px, 8vw, 60px)', 
                        height: 'auto',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
                      }}
                    >
                      <defs>
                        <linearGradient id={`dollarGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#85bb65" />
                          <stop offset="50%" stopColor="#6fb34f" />
                          <stop offset="100%" stopColor="#5a9e3d" />
                        </linearGradient>
                        <radialGradient id={`dollarHighlight${i}`} cx="30%" cy="30%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </radialGradient>
                      </defs>
                      
                      {/* Bill body with 3D effect */}
                      <rect x="2" y="2" width="116" height="56" rx="4" fill="rgba(0,0,0,0.3)" />
                      <rect x="0" y="0" width="116" height="56" rx="4" fill={`url(#dollarGrad${i})`} stroke="#4a7c32" strokeWidth="2" />
                      
                      {/* Highlight overlay */}
                      <rect x="0" y="0" width="116" height="56" rx="4" fill={`url(#dollarHighlight${i})`} />
                      
                      {/* Dollar sign */}
                      <text x="58" y="38" fontSize="32" fontWeight="bold" fill="#2d5016" textAnchor="middle" fontFamily="serif">$</text>
                      
                      {/* Decorative corners */}
                      <circle cx="15" cy="15" r="4" fill="#4a7c32" opacity="0.6" />
                      <circle cx="101" cy="15" r="4" fill="#4a7c32" opacity="0.6" />
                      <circle cx="15" cy="41" r="4" fill="#4a7c32" opacity="0.6" />
                      <circle cx="101" cy="41" r="4" fill="#4a7c32" opacity="0.6" />
                    </svg>
                    
                    <style>{`
                      @keyframes dollarFall${i} {
                        0% { 
                          transform: translateY(0) translateX(0) rotate(${rotation}deg);
                          opacity: 0;
                        }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { 
                          transform: translateY(110vh) translateX(${swingAmount}vw) rotate(${rotation + rotationSpeed}deg);
                          opacity: 0;
                        }
                      }
                    `}</style>
                  </div>
                );
              })}
            </div>
          )}

          {/* ZOOM WRAPPER */}
          <div 
            className="relative z-10"
            style={{ 
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1500ms ease-in-out 10ms, opacity 1500ms ease-in-out 10ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto'
            }}
          >
            <div style={{ transform: 'scale(1)' }}>
              <HexShieldFrame showShine={true}>
                {/* Top Hex Badge - "GENIUS" */}
                <div 
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
                    {/* Inner PURPLE crystal */}
                    <div className="absolute inset-[6px]"
                         style={{
                           clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                           background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(var(--dup-purple-300)) 0%, hsl(var(--dup-purple-400)) 30%, hsl(var(--dup-purple-600)) 60%, hsl(var(--dup-purple-700)) 100%)',
                           boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.25), inset 0 -12px 24px rgba(0,0,0,0.4)'
                         }} />
                    
                    {/* Diagonal light streaks */}
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
                          fontSize: 'clamp(1.25rem, 5.2cqw, 2.1rem)', 
                          letterSpacing: '0.05em',
                          textShadow: '0 0 12px rgba(255,255,255,0.25)'
                        }}>
                      GENIUS
                    </h1>
                  </div>
                </div>

                {/* Content Area - container query cqw scaling */}
                <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[8%] pb-[8%] pt-[2%]">
                  
                  {/* Lead text */}
                  <p className="text-center text-yellow-200 font-black mb-3"
                     style={{
                       fontSize: 'clamp(0.9rem, 4.5cqw, 1.3rem)',
                       textShadow: '0 3px 6px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)'
                     }}>
                    Légy Genius, vedd fel a tempót!
                  </p>

                  {/* Price with discount badge - SPECTACULAR -25% SVG */}
                  <div className="text-center mb-[2vh] relative">
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-base font-bold text-yellow-400/70 line-through">${basePrice.toFixed(2)}</span>
                        <div
                          className="font-black text-yellow-400"
                          style={{
                            fontSize: 'clamp(24px, 18cqw, 56px)',
                            lineHeight: 1,
                            textShadow: '0 5px 12px rgba(0,0,0,0.8), 0 3px 6px rgba(0,0,0,0.6), 0 0 24px rgba(255,215,0,0.7)'
                          }}
                        >
                          ${discountedPrice.toFixed(2)}
                        </div>
                        <span className="text-sm font-bold text-yellow-300">/ hó</span>
                      </div>
                      
                      {/* -25% OFF badge - SPECTACULAR SVG DIFFERENT from -80% */}
                      <div className="relative" style={{ minWidth: 'clamp(60px, 18cqw, 100px)' }}>
                        {/* Hexagonal badge burst - BEHIND, OVERFLOWS shield */}
                        <svg 
                          viewBox="0 0 200 200" 
                          className="absolute -inset-[70%] pointer-events-none"
                          style={{ 
                            animation: 'pulse 2s ease-in-out infinite',
                            filter: 'drop-shadow(0 0 16px rgba(147,51,234,0.8)) drop-shadow(0 0 32px rgba(147,51,234,0.5))',
                            zIndex: -1
                          }}
                        >
                          <defs>
                            <radialGradient id="hexGradient">
                              <stop offset="0%" stopColor="#a855f7" />
                              <stop offset="50%" stopColor="#9333ea" />
                              <stop offset="100%" stopColor="#7e22ce" />
                            </radialGradient>
                          </defs>
                          {/* 6 hexagons rotating */}
                          {[...Array(6)].map((_, i) => {
                            const angle = (i * 60 * Math.PI) / 180;
                            const radius = 85;
                            const cx = 100 + Math.cos(angle) * radius;
                            const cy = 100 + Math.sin(angle) * radius;
                            return (
                              <g key={i} transform={`translate(${cx}, ${cy})`}>
                                <polygon
                                  points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5"
                                  fill="url(#hexGradient)"
                                  opacity="0.8"
                                />
                              </g>
                            );
                          })}
                          {/* Center hexagon */}
                          <polygon
                            points="100,60 125,75 125,105 100,120 75,105 75,75"
                            fill="#9333ea"
                          />
                        </svg>
                        
                        {/* Badge shadow */}
                        <div className="absolute inset-0 bg-purple-900/80 rounded-lg translate-y-1.5 translate-x-1 blur-md" />
                        {/* Main badge */}
                        <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white px-3 py-1.5 rounded-lg font-black text-base rotate-12 shadow-2xl shadow-purple-900/70 animate-pulse border-2 border-yellow-400">
                          <div className="absolute inset-[2px] top-0 h-1/2 bg-gradient-to-b from-purple-400/50 to-transparent rounded-t-lg" />
                          <span className="relative z-10 drop-shadow-lg" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>-25%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Benefits - compact */}
                  <div className="w-full space-y-2 mb-[2vh]">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-400/40 flex items-center justify-center flex-shrink-0 border-2 border-yellow-500">
                        <Check className="w-4 h-4 text-yellow-200" />
                      </div>
                      <p className="text-white font-bold text-sm" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>Dupla napi jutalom</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-500/40 flex items-center justify-center flex-shrink-0 border-2 border-red-600">
                        <Check className="w-4 h-4 text-red-200" />
                      </div>
                      <p className="text-white font-bold text-sm" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>-25% kedvezmény a Speed Shopban</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500/40 flex items-center justify-center flex-shrink-0 border-2 border-green-600">
                        <Check className="w-4 h-4 text-green-200" />
                      </div>
                      <p className="text-white font-bold text-sm" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>Közvélemény-szavazások</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/40 flex items-center justify-center flex-shrink-0 border-2 border-blue-600">
                        <Check className="w-4 h-4 text-blue-200" />
                      </div>
                      <p className="text-white font-bold text-sm" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>TikTok tippek & trükkök</p>
                    </div>
                  </div>

                  {/* Small text */}
                  <p className="text-center text-white/70 text-xs mb-[2vh]" style={{ fontSize: 'clamp(0.5rem, 2.5cqw, 0.7rem)' }}>
                    Bármikor lemondható
                  </p>

                  {/* Subscribe button */}
                  <div className="flex justify-center w-full px-[4%]">
                    <HexAcceptButton 
                      onClick={handleSubscribe} 
                      disabled={loading}
                      style={{ 
                        width: '100%',
                        maxWidth: '100%'
                      }} 
                    >
                      {loading ? 'ÁTIRÁNYÍTÁS...' : `ELŐFIZETEK $${discountedPrice.toFixed(2)}/HÓ`}
                    </HexAcceptButton>
                  </div>
                </div>
              </HexShieldFrame>
            </div>
          </div>

          {/* Close X button */}
          <button
            onClick={handleLater}
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