import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';
import { useI18n } from '@/i18n/useI18n';
import laurelWreathGold from '@/assets/laurel_wreath_gold.svg';

interface DailyWinnersDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TopPlayer {
  user_id: string;
  rank: number;
  username: string;
  avatar_url: string | null;
  total_correct_answers: number;
}

interface TotalRewards {
  totalGold: number;
  totalLives: number;
}

export const DailyWinnersDialog = ({ open, onClose }: DailyWinnersDialogProps) => {
  const { t } = useI18n();
  const [contentVisible, setContentVisible] = useState(false);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [totalRewards, setTotalRewards] = useState<TotalRewards>({ totalGold: 0, totalLives: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);

  // Add keyframes for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-scale {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes neon-pulse {
        0%, 100% {
          box-shadow: 
            0 0 20px 4px rgba(255, 215, 0, 0.6),
            0 0 40px 8px rgba(255, 215, 0, 0.4),
            0 0 60px 12px rgba(255, 215, 0, 0.2),
            inset 0 0 20px rgba(255, 215, 0, 0.3);
        }
        50% {
          box-shadow: 
            0 0 30px 6px rgba(255, 215, 0, 0.8),
            0 0 60px 12px rgba(255, 215, 0, 0.6),
            0 0 90px 18px rgba(255, 215, 0, 0.3),
            inset 0 0 30px rgba(255, 215, 0, 0.5);
        }
      }
      
      @keyframes marquee-light {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (open) {
      fetchYesterdayTopPlayers();
      const t = setTimeout(() => {
        setContentVisible(true);
      }, 10);
      
      return () => {
        clearTimeout(t);
        setContentVisible(false);
      };
    } else {
      setContentVisible(false);
    }
  }, [open]);

  const fetchYesterdayTopPlayers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[DAILY-WINNERS] No authenticated user');
        setTopPlayers([]);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('country_code')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData?.country_code) {
        console.error('[DAILY-WINNERS] Error fetching user country:', profileError);
        setTopPlayers([]);
        return;
      }

      const userCountry = profileData.country_code;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      console.log('[DAILY-WINNERS] Fetching yesterday TOP 10 from daily_leaderboard_snapshot, country:', userCountry, 'date:', yesterdayDate);

      const { data: players, error } = await supabase
        .from('daily_leaderboard_snapshot')
        .select('user_id, rank, username, avatar_url, total_correct_answers')
        .eq('country_code', userCountry)
        .eq('snapshot_date', yesterdayDate)
        .order('rank', { ascending: true })
        .limit(10);

      if (error) {
        console.error('[DAILY-WINNERS] Error fetching yesterday TOP 10:', error);
        setTopPlayers([]);
        return;
      }

      if (!players || players.length === 0) {
        console.log('[DAILY-WINNERS] No snapshot data found for yesterday');
        setTopPlayers([]);
        return;
      }

      setTopPlayers(players as TopPlayer[]);
      console.log('[DAILY-WINNERS] Loaded yesterday TOP 10 from snapshot:', players.length, 'players');
      
      const { data: prizesData, error: prizesError } = await supabase
        .from('daily_prize_table')
        .select('gold, lives, rank')
        .lte('rank', 10)
        .order('rank', { ascending: true });
      
      if (prizesError) {
        console.error('[DAILY-WINNERS] Error fetching prize data:', prizesError);
      } else if (prizesData) {
        const totalGold = prizesData.reduce((sum, prize) => sum + (prize.gold || 0), 0);
        const totalLives = prizesData.reduce((sum, prize) => sum + (prize.lives || 0), 0);
        setTotalRewards({ totalGold, totalLives });
        console.log('[DAILY-WINNERS] Total rewards calculated:', { totalGold, totalLives });
      }
    } catch (error) {
      console.error('[DAILY-WINNERS] Exception fetching yesterday TOP 10:', error);
      setTopPlayers([]);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="overflow-hidden p-0 border-0 bg-transparent w-screen h-screen max-w-none rounded-none [&>button[data-dialog-close]]:hidden z-[99999]"
        style={{ 
          margin: 0,
          maxHeight: '100dvh',
          minHeight: '100dvh',
          borderRadius: 0,
          zIndex: 99999
        }}
      >
        <div 
          className="fixed inset-0 flex flex-col items-center overflow-hidden backdrop-blur-md"
          style={{ 
            minHeight: '100dvh', 
            minWidth: '100vw',
            justifyContent: 'center',
            paddingTop: '0',
            marginTop: '-3vh'
          }}
        >
          <DialogTitle className="sr-only">Tegnapi Nyertesek</DialogTitle>
          <DialogDescription className="sr-only">TOP 10 tegnapi nyertesek listája</DialogDescription>

          <div 
            className="relative z-10 w-full max-w-[min(95vw,600px)] mx-auto flex items-center justify-center"
            style={{ 
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1500ms ease-in-out 10ms, opacity 1500ms ease-in-out 10ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto'
            }}
          >
            <div className="relative w-full">
              <HexShieldFrame showShine={true}>
                {/* Flex container for badge and rewards panel */}
                <div className="flex flex-row items-center justify-center gap-3 -mt-12 mb-3">
                  {/* Top Hex Badge - "TEGNAPI GÉNIUSZOK" */}
                  <div 
                    ref={badgeRef}
                    className="relative z-20" 
                    style={{ width: '60%' }}
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
                           boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 3px 8px rgba(0,0,0,0.175)'
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
                             background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(0 95% 75%) 0%, hsl(0 90% 65%) 30%, hsl(0 85% 55%) 60%, hsl(0 78% 48%) 100%)',
                             boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                           }} />
                      
                      <div className="absolute inset-[6px] pointer-events-none"
                           style={{
                             clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                             background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                             opacity: 0.7
                           }} />
                      
                      <div className="absolute inset-[6px] pointer-events-none" style={{
                        clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                        background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                      }} />
                      
                      <h1 className="relative z-10 font-black text-white text-center uppercase"
                          style={{ 
                            fontSize: 'clamp(1.25rem, 5.2vw, 2.1rem)', 
                            letterSpacing: '0.08em',
                            fontFamily: '"Poppins", system-ui, -apple-system, sans-serif'
                          }}>
                        {t('dailyWinners.title')}
                      </h1>
                    </div>
                  </div>

                  {/* PREMIUM CASINO REWARDS BILLBOARD - TOTAL REDESIGN */}
                  <div 
                    className="relative z-20"
                    style={{
                      animation: 'pulse-scale 2s ease-in-out infinite',
                      transform: 'scale(0.26)',
                      transformOrigin: 'center center',
                      perspective: '1000px'
                    }}
                  >
                    {/* Casino Billboard Container with 3D Depth */}
                    <div 
                      className="relative"
                      style={{
                        width: '220px',
                        height: '130px',
                        transformStyle: 'preserve-3d',
                        transform: 'rotateX(2deg) rotateY(-2deg)'
                      }}
                    >
                      {/* Deep Shadow Base */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          transform: 'translateZ(-20px) translateY(8px) translateX(8px)',
                          background: 'rgba(0, 0, 0, 0.8)',
                          filter: 'blur(16px)',
                          borderRadius: '16px'
                        }}
                      />

                      {/* Outer Glow Ring - Animated Neon */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          transform: 'translateZ(-10px)',
                          background: 'transparent',
                          borderRadius: '16px',
                          boxShadow: `
                            0 0 20px 4px rgba(255, 215, 0, 0.6),
                            0 0 40px 8px rgba(255, 215, 0, 0.4),
                            0 0 60px 12px rgba(255, 215, 0, 0.2),
                            inset 0 0 20px rgba(255, 215, 0, 0.3)
                          `,
                          animation: 'neon-pulse 2s ease-in-out infinite'
                        }}
                      />

                      {/* Main Billboard Frame - Luxurious Gold Chrome */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          transform: 'translateZ(0px)',
                          borderRadius: '16px',
                          background: `
                            linear-gradient(145deg, 
                              #d4af37 0%,
                              #f9d342 15%,
                              #ffd700 30%,
                              #ffed4e 45%,
                              #ffd700 60%,
                              #daa520 75%,
                              #b8860b 90%,
                              #8b6914 100%
                            )
                          `,
                          boxShadow: `
                            inset 0 2px 4px rgba(255, 255, 255, 0.6),
                            inset 0 -2px 4px rgba(0, 0, 0, 0.4),
                            0 4px 12px rgba(0, 0, 0, 0.5)
                          `,
                          border: '3px solid rgba(255, 237, 78, 0.8)'
                        }}
                      />

                      {/* Inner Beveled Edge */}
                      <div 
                        className="absolute inset-[6px]"
                        style={{
                          transform: 'translateZ(2px)',
                          borderRadius: '12px',
                          background: `
                            linear-gradient(165deg,
                              rgba(255, 255, 255, 0.3) 0%,
                              rgba(255, 237, 78, 0.4) 20%,
                              transparent 40%
                            )
                          `,
                          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5)'
                        }}
                      />

                      {/* Dark Content Area with Velvet Texture */}
                      <div 
                        className="absolute inset-[10px]"
                        style={{
                          transform: 'translateZ(5px)',
                          borderRadius: '10px',
                          background: `
                            radial-gradient(ellipse at top left, #1a0f0f 0%, #0d0505 50%, #000000 100%)
                          `,
                          boxShadow: `
                            inset 0 4px 16px rgba(0, 0, 0, 0.9),
                            inset 0 -2px 8px rgba(139, 69, 19, 0.2)
                          `,
                          border: '1px solid rgba(139, 69, 19, 0.3)'
                        }}
                      >
                        {/* Velvet Pattern Overlay */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            borderRadius: '10px',
                            background: `
                              repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 2px,
                                rgba(139, 69, 19, 0.03) 2px,
                                rgba(139, 69, 19, 0.03) 4px
                              )
                            `,
                            opacity: 0.6
                          }}
                        />

                        {/* Content Container */}
                        <div className="relative z-10 h-full flex flex-col justify-center px-4 py-2.5 space-y-2">
                          
                          {/* Title Banner with Marquee Light Effect */}
                          <div className="relative">
                            <div 
                              className="absolute inset-0 -inset-x-2"
                              style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.1) 50%, transparent 100%)',
                                animation: 'marquee-light 3s linear infinite'
                              }}
                            />
                            <h3 
                              className="relative font-black uppercase text-center tracking-[0.25em]"
                              style={{
                                fontSize: '0.75rem',
                                background: 'linear-gradient(180deg, #ffffff 0%, #ffd700 30%, #ffed4e 50%, #ffd700 70%, #daa520 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9))',
                                textShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
                                letterSpacing: '0.15em'
                              }}
                            >
                              JACKPOT
                            </h3>
                          </div>

                          {/* Rewards Display - Slot Machine Style */}
                          <div className="space-y-1.5">
                            
                            {/* Gold Coins Display */}
                            <div 
                              className="relative flex items-center justify-between px-3 py-1.5"
                              style={{
                                background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.05) 0%, rgba(255, 215, 0, 0.15) 50%, rgba(255, 215, 0, 0.05) 100%)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 215, 0, 0.2)',
                                boxShadow: 'inset 0 1px 2px rgba(255, 215, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.5)'
                              }}
                            >
                              {/* Ultra Premium 3D Gold Coin */}
                              <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <radialGradient id="coinGold" cx="35%" cy="35%">
                                    <stop offset="0%" stopColor="#fffef0"/>
                                    <stop offset="15%" stopColor="#fff9c4"/>
                                    <stop offset="40%" stopColor="#ffd700"/>
                                    <stop offset="70%" stopColor="#daa520"/>
                                    <stop offset="100%" stopColor="#8b6914"/>
                                  </radialGradient>
                                  <radialGradient id="coinShine" cx="30%" cy="30%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.9)"/>
                                    <stop offset="60%" stopColor="rgba(255,255,255,0.3)"/>
                                    <stop offset="100%" stopColor="transparent"/>
                                  </radialGradient>
                                  <linearGradient id="coinEdge" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#ffd700"/>
                                    <stop offset="50%" stopColor="#b8860b"/>
                                    <stop offset="100%" stopColor="#8b6914"/>
                                  </linearGradient>
                                </defs>
                                <ellipse cx="50" cy="58" rx="42" ry="38" fill="rgba(0,0,0,0.5)" opacity="0.7"/>
                                <circle cx="50" cy="50" r="44" fill="url(#coinGold)"/>
                                <circle cx="50" cy="50" r="36" fill="none" stroke="url(#coinEdge)" strokeWidth="2.5"/>
                                <circle cx="50" cy="48" r="26" fill="#daa520" opacity="0.6"/>
                                <ellipse cx="35" cy="32" rx="20" ry="16" fill="url(#coinShine)"/>
                                <text x="50" y="58" fontFamily="Arial Black" fontSize="24" fill="#8b6914" textAnchor="middle" fontWeight="bold">$</text>
                              </svg>
                              
                              {/* Amount with LED Display Effect */}
                              <div className="flex-1 text-right">
                                <span 
                                  className="font-black tabular-nums"
                                  style={{
                                    fontSize: '1.1rem',
                                    background: 'linear-gradient(180deg, #fffef0 0%, #ffd700 40%, #daa520 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.9)) drop-shadow(0 2px 4px rgba(0, 0, 0, 1))',
                                    fontFamily: '"Orbitron", "Courier New", monospace',
                                    letterSpacing: '0.02em'
                                  }}
                                >
                                  {totalRewards.totalGold.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Lives Display */}
                            <div 
                              className="relative flex items-center justify-between px-3 py-1.5"
                              style={{
                                background: 'linear-gradient(90deg, rgba(255, 20, 20, 0.05) 0%, rgba(255, 20, 20, 0.15) 50%, rgba(255, 20, 20, 0.05) 100%)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 77, 109, 0.2)',
                                boxShadow: 'inset 0 1px 2px rgba(255, 77, 109, 0.1), 0 2px 8px rgba(0, 0, 0, 0.5)'
                              }}
                            >
                              {/* Premium Glossy Heart */}
                              <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <radialGradient id="heartGloss" cx="35%" cy="28%">
                                    <stop offset="0%" stopColor="#ff90a8"/>
                                    <stop offset="25%" stopColor="#ff4d6d"/>
                                    <stop offset="60%" stopColor="#e63946"/>
                                    <stop offset="100%" stopColor="#9d1f2d"/>
                                  </radialGradient>
                                  <radialGradient id="heartHighlight" cx="30%" cy="25%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,1)"/>
                                    <stop offset="40%" stopColor="rgba(255,255,255,0.6)"/>
                                    <stop offset="100%" stopColor="transparent"/>
                                  </radialGradient>
                                </defs>
                                <path d="M50,92 C50,92 12,60 12,35 C12,18 25,12 38,20 C44,24 50,34 50,34 C50,34 56,24 62,20 C75,12 88,18 88,35 C88,60 50,92 50,92 Z" 
                                      fill="rgba(0,0,0,0.5)" transform="translate(3, 6)" opacity="0.7"/>
                                <path d="M50,92 C50,92 12,60 12,35 C12,18 25,12 38,20 C44,24 50,34 50,34 C50,34 56,24 62,20 C75,12 88,18 88,35 C88,60 50,92 50,92 Z" 
                                      fill="url(#heartGloss)"/>
                                <ellipse cx="32" cy="26" rx="16" ry="12" fill="url(#heartHighlight)"/>
                                <ellipse cx="68" cy="26" rx="13" ry="10" fill="url(#heartHighlight)" opacity="0.7"/>
                                <path d="M50,92 C50,92 12,60 12,35 C12,18 25,12 38,20 C44,24 50,34 50,34 C50,34 56,24 62,20 C75,12 88,18 88,35 C88,60 50,92 50,92 Z" 
                                      fill="none" stroke="rgba(157, 31, 45, 0.5)" strokeWidth="1.5"/>
                              </svg>
                              
                              {/* Amount with LED Display Effect */}
                              <div className="flex-1 text-right">
                                <span 
                                  className="font-black tabular-nums"
                                  style={{
                                    fontSize: '1.1rem',
                                    background: 'linear-gradient(180deg, #ffb3c1 0%, #ff4d6d 40%, #c1121f 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 0 8px rgba(255, 77, 109, 0.9)) drop-shadow(0 2px 4px rgba(0, 0, 0, 1))',
                                    fontFamily: '"Orbitron", "Courier New", monospace',
                                    letterSpacing: '0.02em'
                                  }}
                                >
                                  {totalRewards.totalLives}
                                </span>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex flex-col items-center justify-between px-[8%] pb-[6%]" style={{ height: 'calc(100% - 60px)', paddingTop: '0' }}>
                  <div className="w-full mb-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
                    {topPlayers.length === 0 ? (
                      <div className="text-center text-white py-8">
                        <p className="text-lg">{t('dailyWinners.noData')}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center items-end gap-2 mb-4 px-1 -mt-3">
                          {topPlayers[1] && (
                            <div className="flex flex-col items-center relative" style={{ 
                              width: '31.5%',
                              animation: 'pulse-scale 2s ease-in-out infinite'
                            }}>
                              <div className="relative w-full" style={{ aspectRatio: '744.09/1052.36' }}>
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: `url(${laurelWreathGold})`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    filter: 'grayscale(100%) brightness(1.2) contrast(1.1) hue-rotate(0deg) saturate(0.3)'
                                  }}
                                />
                                <div className="absolute" style={{ left: '19.5%', top: '18%', width: '63%', height: '45%' }}>
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'linear-gradient(135deg, #f8f8f8 0%, #d8d8d8 50%, #a8a8a8 100%)',
                                      boxShadow: '0 6px 12px rgba(192,192,192,0.5), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.3)'
                                    }} />
                                    <div className="absolute inset-[6px] rounded-full overflow-hidden">
                                      {topPlayers[1].avatar_url ? (
                                        <img 
                                          src={topPlayers[1].avatar_url} 
                                          alt={topPlayers[1].username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl bg-gray-800">
                                          {topPlayers[1].username.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                  <div className="aspect-square rounded-full relative">
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e8e8e8 30%, #d0d0d0 60%, #a8a8a8 100%)',
                                      boxShadow: '0 4px 8px rgba(192,192,192,0.5), 0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                    <div className="absolute inset-[3px] rounded-full" style={{
                                      background: 'linear-gradient(135deg, #f8f8f8 0%, #d8d8d8 50%, #a8a8a8 100%)',
                                      boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.7), inset 0 -2px 6px rgba(0,0,0,0.4)'
                                    }} />
                                    <div className="absolute inset-[6px] rounded-full flex items-center justify-center" style={{
                                      background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #e8e8e8 40%, #c0c0c0 100%)',
                                      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.2)'
                                    }}>
                                      <span className="font-black relative" style={{ 
                                        fontSize: '3.5vw',
                                        background: 'linear-gradient(180deg, #333333 0%, #000000 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.3))'
                                      }}>2</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center w-full" style={{ marginTop: '-4px' }}>
                                <p className="text-white font-bold text-[0.65rem] leading-none truncate px-1">
                                  {topPlayers[1].username}
                                </p>
                              </div>
                            </div>
                          )}

                          {topPlayers[0] && (
                            <div className="flex flex-col items-center relative" style={{ 
                              width: '37.8%',
                              animation: 'pulse-scale 2s ease-in-out infinite'
                            }}>
                              <div className="relative w-full" style={{ aspectRatio: '744.09/1052.36' }}>
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: `url(${laurelWreathGold})`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                  }}
                                />
                                <div className="absolute" style={{ left: '19.5%', top: '18%', width: '63%', height: '45%' }}>
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 25%, #ffb700 50%, #ff9500 75%, #ffd700 100%)',
                                      boxShadow: '0 8px 16px rgba(218,165,32,0.6), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(139,69,0,0.5)'
                                    }} />
                                    <div className="absolute inset-[6px] rounded-full overflow-hidden">
                                      {topPlayers[0].avatar_url ? (
                                        <img 
                                          src={topPlayers[0].avatar_url} 
                                          alt={topPlayers[0].username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-yellow-400 font-bold text-3xl bg-gray-800">
                                          {topPlayers[0].username.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                  <div className="aspect-square rounded-full relative">
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'radial-gradient(circle at 30% 30%, #fffacd 0%, #ffd700 30%, #ffb700 60%, #d4af37 100%)',
                                      boxShadow: '0 6px 12px rgba(218,165,32,0.6), 0 2px 4px rgba(0,0,0,0.3)'
                                    }} />
                                    <div className="absolute inset-[3px] rounded-full" style={{
                                      background: 'linear-gradient(135deg, #fff9c4 0%, #ffd700 50%, #d4af37 100%)',
                                      boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -2px 6px rgba(139,69,0,0.5)'
                                    }} />
                                    <div className="absolute inset-[6px] rounded-full flex items-center justify-center" style={{
                                      background: 'radial-gradient(circle at 35% 35%, #ffffe0 0%, #ffd700 40%, #daa520 100%)',
                                      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.9), inset 0 -1px 3px rgba(139,69,0,0.3)'
                                    }}>
                                      <span className="font-black relative" style={{ 
                                        fontSize: '4vw',
                                        background: 'linear-gradient(180deg, #8b4513 0%, #4a2511 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.4))'
                                      }}>1</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center w-full" style={{ marginTop: '-4px' }}>
                                <p className="text-white font-bold text-[0.7rem] leading-none truncate px-1">
                                  {topPlayers[0].username}
                                </p>
                              </div>
                            </div>
                          )}

                          {topPlayers[2] && (
                            <div className="flex flex-col items-center relative" style={{ 
                              width: '31.5%',
                              animation: 'pulse-scale 2s ease-in-out infinite'
                            }}>
                              <div className="relative w-full" style={{ aspectRatio: '744.09/1052.36' }}>
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: `url(${laurelWreathGold})`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    filter: 'grayscale(20%) brightness(0.95) contrast(1.15) hue-rotate(15deg) saturate(1.3)'
                                  }}
                                />
                                <div className="absolute" style={{ left: '19.5%', top: '18%', width: '63%', height: '45%' }}>
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'linear-gradient(135deg, #cd7f32 0%, #c87533 25%, #b87333 50%, #a0522d 75%, #8b4513 100%)',
                                      boxShadow: '0 6px 12px rgba(205,127,50,0.5), inset 0 2px 4px rgba(255,200,150,0.6), inset 0 -2px 4px rgba(0,0,0,0.4)'
                                    }} />
                                    <div className="absolute inset-[6px] rounded-full overflow-hidden">
                                      {topPlayers[2].avatar_url ? (
                                        <img 
                                          src={topPlayers[2].avatar_url} 
                                          alt={topPlayers[2].username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-orange-700 font-bold text-2xl bg-gray-800">
                                          {topPlayers[2].username.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                  <div className="aspect-square rounded-full relative">
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'radial-gradient(circle at 30% 30%, #cd7f32 0%, #c87533 30%, #b87333 60%, #a0522d 100%)',
                                      boxShadow: '0 4px 8px rgba(205,127,50,0.5), 0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                    <div className="absolute inset-[3px] rounded-full" style={{
                                      background: 'linear-gradient(135deg, #d2a679 0%, #cd7f32 50%, #b87333 100%)',
                                      boxShadow: 'inset 0 2px 6px rgba(255,200,150,0.7), inset 0 -2px 6px rgba(0,0,0,0.4)'
                                    }} />
                                    <div className="absolute inset-[6px] rounded-full flex items-center justify-center" style={{
                                      background: 'radial-gradient(circle at 35% 35%, #daa06d 0%, #cd7f32 40%, #a0522d 100%)',
                                      boxShadow: 'inset 0 1px 3px rgba(255,200,150,0.8), inset 0 -1px 3px rgba(0,0,0,0.2)'
                                    }}>
                                      <span className="font-black relative" style={{ 
                                        fontSize: '3.5vw',
                                        background: 'linear-gradient(180deg, #4a2511 0%, #2d1506 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        filter: 'drop-shadow(0 1px 1px rgba(255,200,150,0.3))'
                                      }}>3</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center w-full" style={{ marginTop: '-4px' }}>
                                <p className="text-white font-bold text-[0.65rem] leading-none truncate px-1">
                                  {topPlayers[2].username}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {topPlayers.slice(3, 10).map((player) => (
                          <div key={player.user_id} className="flex items-center gap-3 px-4 py-2 mb-2 rounded-lg backdrop-blur-sm"
                               style={{
                                 background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                                 borderLeft: '3px solid rgba(255,215,0,0.4)',
                               }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.1) 100%)',
                                   color: 'hsl(var(--dup-gold-500))',
                                   border: '1px solid rgba(255,215,0,0.3)',
                                   textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                 }}>
                              {player.rank}
                            </div>
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 border-2 border-gray-600">
                              {player.avatar_url ? (
                                <img 
                                  src={player.avatar_url} 
                                  alt={player.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                                  {player.username.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-white font-semibold text-sm truncate">
                                {player.username}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="mt-auto pt-4 flex justify-center w-full">
                    <HexAcceptButton 
                      onClick={onClose}
                      className="w-[90%]"
                    />
                  </div>
                </div>
              </HexShieldFrame>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyWinnersDialog;
