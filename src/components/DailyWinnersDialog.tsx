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
      
      // Fetch total rewards for yesterday
      const { data: rewards, error: rewardsError } = await supabase
        .from('daily_winner_awarded')
        .select('gold_awarded, lives_awarded')
        .eq('day_date', yesterdayDate);
      
      if (!rewardsError && rewards) {
        const totalGold = rewards.reduce((sum, r) => sum + r.gold_awarded, 0);
        const totalLives = rewards.reduce((sum, r) => sum + r.lives_awarded, 0);
        setTotalRewards({ totalGold, totalLives });
        console.log('[DAILY-WINNERS] Total rewards:', { totalGold, totalLives });
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
        className="overflow-visible p-0 border-0 bg-transparent w-screen h-screen max-w-none rounded-none [&>button[data-dialog-close]]:hidden z-[99999]"
        style={{ 
          margin: 0,
          maxHeight: 'none',
          minHeight: '100dvh',
          borderRadius: 0,
          zIndex: 99999
        }}
      >
          <div 
            className="fixed inset-0 flex flex-col items-center overflow-visible backdrop-blur-md"
            style={{ 
              minHeight: '100dvh', 
              minWidth: '100vw',
              justifyContent: 'center',
              paddingTop: '0',
              marginTop: '0'
            }}
          >
          <DialogTitle className="sr-only">Tegnapi Nyertesek</DialogTitle>
          <DialogDescription className="sr-only">TOP 10 tegnapi nyertesek listája</DialogDescription>

          <div 
            className="relative z-10 w-full max-w-[min(95vw,600px)] mx-auto flex items-center justify-center overflow-hidden"
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
                <div style={{ transform: 'translateY(-7.5%)' }}>
                {/* Top Hex Badge - "TEGNAPI GÉNIUSZOK" */}
                <div 
                  ref={badgeRef}
                  className="relative z-20 mx-auto" 
                  style={{ width: '80%', maxWidth: '400px', transform: 'translateY(-35%)' }}
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
                          fontSize: 'clamp(1.375rem, 5.72vw, 2.31rem)', 
                          letterSpacing: '0.08em',
                          fontFamily: '"Poppins", system-ui, -apple-system, sans-serif'
                        }}>
                      GÉNIUSZOK
                    </h1>
                    
                    {/* Jackpot info row */}
                    <div className="relative z-10 mt-2 flex items-center justify-center gap-4 text-white"
                         style={{
                           fontSize: 'clamp(0.75rem, 3vw, 1rem)',
                           fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
                           fontWeight: 700
                         }}>
                      <span style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,255,0.3)',
                        letterSpacing: '0.05em'
                      }}>TEGNAPI JACKPOT:</span>
                      
                      {/* Gold coin icon + amount */}
                      <div className="flex items-center gap-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" className="inline-block">
                          <defs>
                            <radialGradient id="coinGold" cx="30%" cy="30%">
                              <stop offset="0%" stopColor="#fffacd" />
                              <stop offset="30%" stopColor="#ffd700" />
                              <stop offset="60%" stopColor="#ffb700" />
                              <stop offset="100%" stopColor="#d4af37" />
                            </radialGradient>
                          </defs>
                          <circle cx="12" cy="12" r="10" fill="url(#coinGold)" stroke="#8b6914" strokeWidth="1.5"
                                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                        </svg>
                        <span style={{
                          background: 'linear-gradient(180deg, #ffd700 0%, #ffb700 50%, #d4af37 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                          filter: 'drop-shadow(0 1px 2px rgba(255,215,0,0.8))'
                        }}>{totalRewards.totalGold}</span>
                      </div>
                      
                      {/* Heart icon + amount */}
                      <div className="flex items-center gap-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="inline-block">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                                fill="#ff1744" stroke="#b71c1c" strokeWidth="1.5"
                                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                        </svg>
                        <span style={{
                          background: 'linear-gradient(180deg, #ff5252 0%, #ff1744 50%, #d50000 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                          filter: 'drop-shadow(0 1px 2px rgba(255,23,68,0.8))'
                        }}>{totalRewards.totalLives}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex flex-col items-center justify-between px-[8%] pb-[3%]" style={{ height: 'calc(100% - 60px)', paddingTop: '0' }}>
                  <div className="w-full mb-2 overflow-y-auto" style={{ height: 'calc(100% - 45px)', maxHeight: 'calc(100vh - 180px)' }}>
                    {topPlayers.length === 0 ? (
                      <div className="text-center text-white py-8">
                        <p className="text-lg">{t('dailyWinners.noData')}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center items-end gap-2 mb-4 px-1" style={{ transform: 'translateY(-10%)' }}>
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
                          <div key={player.user_id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg backdrop-blur-sm"
                               style={{
                                 background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                                 borderLeft: '3px solid rgba(255,215,0,0.4)',
                                 marginBottom: '4px'
                               }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.1) 100%)',
                                   color: 'hsl(var(--dup-gold-500))',
                                   border: '1px solid rgba(255,215,0,0.3)',
                                   textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                 }}>
                              {player.rank}
                            </div>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 border-2 border-gray-600">
                              {player.avatar_url ? (
                                <img 
                                  src={player.avatar_url} 
                                  alt={player.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                                  {player.username.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-white font-semibold text-xs truncate">
                                {player.username}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="mt-auto pt-2 flex justify-center w-full">
                    <HexAcceptButton 
                      onClick={onClose}
                      className="w-[80%]"
                      style={{ transform: 'scale(0.88)' }}
                    />
                  </div>
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
