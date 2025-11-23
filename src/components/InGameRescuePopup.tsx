import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Wallet } from 'lucide-react';
import { LifeIcon3D } from './icons/LifeIcon3D';
import { CoinIcon3D } from './icons/CoinIcon3D';
import { DiamondIcon3D } from './icons/DiamondIcon3D';
import { useI18n } from '@/i18n';

interface InGameRescuePopupProps {
  open: boolean;
  onClose: () => void;
  lives: number;
  gold: number;
  purchasing: boolean;
  onGoldSaverPurchase: () => void;
  onInstantRescuePurchase: () => void;
}

export const InGameRescuePopup = ({
  open,
  onClose,
  lives,
  gold,
  purchasing,
  onGoldSaverPurchase,
  onInstantRescuePurchase,
}: InGameRescuePopupProps) => {
  const { t } = useI18n();
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setContentVisible(true), 100);
      return () => {
        clearTimeout(timer);
        setContentVisible(false);
      };
    } else {
      setContentVisible(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        overlayClassName="bg-black/60 backdrop-blur-md"
        className="overflow-hidden p-0 border-0 bg-transparent w-[92vw] max-w-none [&>button[data-dialog-close]]:hidden z-[99999]"
        style={{ 
          height: '90vh',
          zIndex: 99999,
        }}
      >
        {/* Animated golden stars background - 80 stars */}
        {contentVisible && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
            {[...Array(80)].map((_, i) => {
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
                    animation: `starFadeRescue${i} ${duration}s ease-in-out ${delay}s infinite`,
                    zIndex: 1
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="#fbbf24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <style>{`
                    @keyframes starFadeRescue${i} {
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
        )}

        {/* Main popup box with 3D frame - RECTANGULAR VERSION */}
        <div 
          className="relative w-full h-full flex flex-col"
          style={{
            transform: contentVisible ? 'scale(1)' : 'scale(0)',
            opacity: contentVisible ? 1 : 0,
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease-in-out',
            transformOrigin: 'center center',
            zIndex: 2,
          }}
        >
          {/* 3D Shadow Base */}
          <div className="absolute inset-0 rounded-2xl translate-x-1 translate-y-2"
               style={{
                 background: 'rgba(0,0,0,0.4)',
                 filter: 'blur(8px)',
                 zIndex: -1
               }} />

          {/* Outer Gold Frame - dark gold gradient */}
          <div className="absolute inset-0 rounded-2xl"
               style={{
                 background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                 boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 12px 32px rgba(0,0,0,0.5)',
                 filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.4))',
               }} />
          
          {/* Middle Gold Frame - bright gold with top highlight */}
          <div className="absolute inset-[5px] rounded-2xl"
               style={{
                 background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                 boxShadow: 'inset 0 2px 0 hsl(var(--dup-gold-300))'
               }} />
          
          {/* Inner Crystal Panel - purple radial gradient */}
          <div className="absolute inset-[10px] rounded-2xl overflow-hidden"
               style={{
                 background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(var(--dup-purple-300)) 0%, hsl(var(--dup-purple-400)) 30%, hsl(var(--dup-purple-600)) 60%, hsl(var(--dup-purple-800)) 100%)',
                 boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.3)',
               }} />
          
          {/* Diagonal Light Streaks Overlay */}
          <div className="absolute inset-[10px] rounded-2xl pointer-events-none overflow-hidden"
               style={{
                 background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.08) 10px, rgba(255,255,255,0.08) 15px, transparent 15px, transparent 25px, rgba(255,255,255,0.05) 25px, rgba(255,255,255,0.05) 30px)',
                 opacity: 0.7
               }} />
          
          {/* Specular Highlight - top-left conic glow */}
          <div className="absolute inset-[10px] rounded-2xl pointer-events-none overflow-hidden"
               style={{
                 background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)',
               }} />

          {/* Content container */}
          <div className="relative z-10 flex flex-col h-full p-6 gap-4"
               style={{
                 paddingTop: '5%',
                 paddingBottom: '5%',
               }}>
            
            {/* Header with realistic bell icon */}
            <div className="flex items-center justify-center gap-3 mb-2">
              {/* 3D Realistic Bell SVG */}
              <svg viewBox="0 0 100 120" className="w-10 h-10 flex-shrink-0">
                <defs>
                  <linearGradient id="bellGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#FF8C00" />
                  </linearGradient>
                  <radialGradient id="bellHighlight" cx="30%" cy="20%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                  <filter id="bellShadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.5"/>
                  </filter>
                </defs>
                {/* Bell body */}
                <path d="M 50 20 Q 35 20, 30 35 L 25 75 Q 25 85, 30 90 L 70 90 Q 75 85, 75 75 L 70 35 Q 65 20, 50 20 Z" 
                      fill="url(#bellGold)" stroke="#B8860B" strokeWidth="2" filter="url(#bellShadow)" />
                {/* Bell clapper */}
                <ellipse cx="50" cy="95" rx="6" ry="8" fill="url(#bellGold)" stroke="#B8860B" strokeWidth="1.5" />
                {/* Bell top knob */}
                <ellipse cx="50" cy="18" rx="5" ry="4" fill="url(#bellGold)" stroke="#B8860B" strokeWidth="1.5" />
                {/* Highlight */}
                <ellipse cx="42" cy="35" rx="12" ry="18" fill="url(#bellHighlight)" opacity="0.8" />
              </svg>

              <h2 className="text-3xl font-black text-center"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 50%, #d0d0d0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(255,215,0,0.6), 0 4px 8px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))'
                  }}>
                {t('inGameRescue.title')}
              </h2>
            </div>

            {/* Current Status - using Daily Gift badge style */}
            <div className="rounded-xl overflow-hidden"
                 style={{
                   position: 'relative',
                 }}>
              {/* Outer gold frame */}
              <div className="absolute inset-0 rounded-xl"
                   style={{
                     background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                     boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 3px 8px rgba(0,0,0,0.175)'
                   }} />
              
              {/* Inner gradient */}
              <div className="absolute inset-[3px] rounded-xl"
                   style={{
                     background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                     boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                   }} />
              
              {/* Inner blue crystal panel */}
              <div className="absolute inset-[6px] rounded-xl"
                   style={{
                     background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(220 95% 75%) 0%, hsl(225 90% 65%) 30%, hsl(230 85% 55%) 60%, hsl(235 78% 48%) 100%)',
                     boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                   }} />
              
              {/* Diagonal stripes */}
              <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                   style={{
                     background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                     opacity: 0.7
                   }} />
              
              {/* Specular highlight */}
              <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                   style={{
                     background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                   }} />
              
              {/* Content */}
              <div className="relative z-10 p-4">
                <p className="text-sm font-bold text-foreground mb-3 text-center"
                   style={{
                     textShadow: '0 0 8px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.6)'
                   }}>
                  {t('inGameRescue.currentStatus')}
                </p>
                <div className="flex justify-around items-center gap-4">
                  <div className="flex items-center gap-2">
                    <LifeIcon3D size={32} />
                    <span className="text-2xl font-black text-white"
                          style={{
                            textShadow: '0 0 12px rgba(239, 68, 68, 0.8), 0 2px 6px rgba(0,0,0,0.9)'
                          }}>
                      {lives}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CoinIcon3D size={32} />
                    <span className="text-2xl font-black"
                          style={{
                            color: '#FFD700',
                            textShadow: '0 0 12px rgba(255, 215, 0, 0.8), 0 2px 6px rgba(0,0,0,0.9)'
                          }}>
                      {gold}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booster Options */}
            <div className="flex flex-col gap-4 flex-1">
              
              {/* Gold Saver Booster - using Daily Gift badge style */}
              <div className="rounded-xl overflow-hidden flex-1 flex flex-col justify-between"
                   style={{
                     position: 'relative',
                   }}>
                {/* Outer gold frame */}
                <div className="absolute inset-0 rounded-xl"
                     style={{
                       background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                       boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 3px 8px rgba(0,0,0,0.175)'
                     }} />
                
                {/* Inner gradient */}
                <div className="absolute inset-[3px] rounded-xl"
                     style={{
                       background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                       boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                     }} />
                
                {/* Inner green crystal panel */}
                <div className="absolute inset-[6px] rounded-xl"
                     style={{
                       background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(150 80% 65%) 0%, hsl(155 75% 55%) 30%, hsl(160 70% 45%) 60%, hsl(165 65% 35%) 100%)',
                       boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                     }} />
                
                {/* Diagonal stripes */}
                <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                     style={{
                       background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                       opacity: 0.7
                     }} />
                
                {/* Specular highlight */}
                <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                     style={{
                       background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                     }} />
                
                {/* Content */}
                <div className="relative z-10 p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-xl font-black mb-2 text-center"
                        style={{
                          color: '#10b981',
                          textShadow: '0 0 16px rgba(16, 185, 129, 0.8), 0 2px 8px rgba(0,0,0,0.9)'
                        }}>
                      {t('inGameRescue.goldSaver.title')}
                    </h3>
                    <div className="flex justify-center items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-white/90 text-sm">+</span>
                        <CoinIcon3D size={28} />
                        <span className="text-xl font-bold"
                              style={{
                                color: '#FFD700',
                                textShadow: '0 0 10px rgba(255, 215, 0, 0.7), 0 2px 4px rgba(0,0,0,0.8)'
                              }}>
                          250
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/80 text-center"
                       style={{
                         textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                       }}>
                      {t('inGameRescue.goldSaver.description')}
                    </p>
                  </div>

                  <button
                    onClick={onGoldSaverPurchase}
                    disabled={purchasing}
                    className="w-full py-3 rounded-xl font-bold text-base transition-all transform active:scale-95 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(16, 185, 129, 0.5), 0 2px 6px rgba(0,0,0,0.4)',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(16, 185, 129, 0.5)',
                      border: '2px solid rgba(74, 222, 128, 0.6)',
                    }}
                  >
                    {purchasing ? t('inGameRescue.goldSaver.purchasing') : `🎁 ${t('inGameRescue.goldSaver.buy')} - 100 ${t('inGameRescue.gold')}`}
                  </button>
                </div>
              </div>

              {/* Instant Rescue Booster - using Daily Gift badge style */}
              <div className="rounded-xl overflow-hidden flex-1 flex flex-col justify-between"
                   style={{
                     position: 'relative',
                   }}>
                {/* Outer gold frame */}
                <div className="absolute inset-0 rounded-xl"
                     style={{
                       background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                       boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 3px 8px rgba(0,0,0,0.175)'
                     }} />
                
                {/* Inner gradient */}
                <div className="absolute inset-[3px] rounded-xl"
                     style={{
                       background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                       boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))'
                     }} />
                
                {/* Inner red crystal panel */}
                <div className="absolute inset-[6px] rounded-xl"
                     style={{
                       background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(0 85% 70%) 0%, hsl(0 80% 60%) 30%, hsl(0 75% 50%) 60%, hsl(0 70% 40%) 100%)',
                       boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                     }} />
                
                {/* Diagonal stripes */}
                <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                     style={{
                       background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                       opacity: 0.7
                     }} />
                
                {/* Specular highlight */}
                <div className="absolute inset-[6px] rounded-xl pointer-events-none"
                     style={{
                       background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                     }} />
                
                {/* Content */}
                <div className="relative z-10 p-4 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-xl font-black mb-2 text-center"
                        style={{
                          color: '#ef4444',
                          textShadow: '0 0 16px rgba(239, 68, 68, 0.8), 0 2px 8px rgba(0,0,0,0.9)'
                        }}>
                      {t('inGameRescue.instantRescue.title')}
                    </h3>
                    <div className="flex justify-center items-center gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-white/90 text-sm">+</span>
                        <CoinIcon3D size={28} />
                        <span className="text-xl font-bold"
                              style={{
                                color: '#FFD700',
                                textShadow: '0 0 10px rgba(255, 215, 0, 0.7), 0 2px 4px rgba(0,0,0,0.8)'
                              }}>
                          1000
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white/90 text-sm">+</span>
                        <LifeIcon3D size={28} />
                        <span className="text-xl font-bold text-white"
                              style={{
                                textShadow: '0 0 10px rgba(239, 68, 68, 0.7), 0 2px 4px rgba(0,0,0,0.8)'
                              }}>
                          50
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/80 text-center"
                       style={{
                         textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                       }}>
                      {t('inGameRescue.instantRescue.description')}
                    </p>
                  </div>

                  <button
                    onClick={onInstantRescuePurchase}
                    disabled={purchasing}
                    className="w-full py-3 rounded-xl font-bold text-base transition-all transform active:scale-95 disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #FFA500, #FF8C00)',
                      color: '#000000',
                      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(255,165,0,0.6), 0 2px 6px rgba(0,0,0,0.4)',
                      textShadow: '0 1px 2px rgba(255,255,255,0.3)',
                      border: '2px solid rgba(255,215,0,0.7)',
                    }}
                  >
                    {purchasing ? t('inGameRescue.instantRescue.purchasing') : `💎 ${t('inGameRescue.instantRescue.buy')} - $1.49`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};