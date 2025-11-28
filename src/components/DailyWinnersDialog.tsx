import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

// Generate unique IDs for SVG gradients to prevent conflicts
const generateUniqueId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const DailyWinnersDialog = ({ open, onClose }: DailyWinnersDialogProps) => {
  const { t } = useI18n();
  const [contentVisible, setContentVisible] = useState(false);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [totalRewards, setTotalRewards] = useState<TotalRewards>({ totalGold: 150000, totalLives: 20000 });
  const [isLoading, setIsLoading] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  
  // Generate unique IDs once per component instance
  const svgIds = useMemo(() => ({
    coinGold: generateUniqueId('coinGold3D'),
    coinInner: generateUniqueId('coinInner'),
    coinShadow: generateUniqueId('coinShadow'),
    heartGradient: generateUniqueId('heartGradient3D'),
    heartHighlight: generateUniqueId('heartHighlight'),
    heartShadow: generateUniqueId('heartShadow'),
  }), []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Add keyframes for animations only once
  useEffect(() => {
    const styleId = 'daily-winners-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const fetchYesterdayTopPlayers = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMountedRef.current) {
        console.error('[DAILY-WINNERS] No authenticated user');
        setTopPlayers([]);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('country_code, username')
        .eq('id', user.id)
        .single();

      if (!isMountedRef.current) return;

      if (profileError || !profileData?.country_code) {
        console.error('[DAILY-WINNERS] Error fetching user country:', profileError);
        setTopPlayers([]);
        return;
      }

      // TESTING MODE: Always show mock data for DingleUP admin user
      if (profileData?.username === 'DingleUP' || profileData?.username === 'DingelUP!') {
        console.log('[DAILY-WINNERS] Admin user detected - showing mock data');
        const mockPlayers: TopPlayer[] = [
          { user_id: '1', rank: 1, username: 'ProGamer2024', avatar_url: null, total_correct_answers: 145 },
          { user_id: '2', rank: 2, username: 'QuizMaster', avatar_url: null, total_correct_answers: 142 },
          { user_id: '3', rank: 3, username: 'BrainChamp', avatar_url: null, total_correct_answers: 138 },
          { user_id: '4', rank: 4, username: 'SmartPlayer', avatar_url: null, total_correct_answers: 135 },
          { user_id: '5', rank: 5, username: 'ThinkFast99', avatar_url: null, total_correct_answers: 132 },
          { user_id: '6', rank: 6, username: 'QuickWit', avatar_url: null, total_correct_answers: 128 },
          { user_id: '7', rank: 7, username: 'MindWarrior', avatar_url: null, total_correct_answers: 125 },
          { user_id: '8', rank: 8, username: 'LogicKing', avatar_url: null, total_correct_answers: 122 },
          { user_id: '9', rank: 9, username: 'PuzzlePro', avatar_url: null, total_correct_answers: 118 },
          { user_id: '10', rank: 10, username: 'GeniusOne', avatar_url: null, total_correct_answers: 115 },
        ];
        
        if (isMountedRef.current) {
          setTopPlayers(mockPlayers);
          setTotalRewards({ totalGold: 1_725, totalLives: 62 });
          console.log('[DAILY-WINNERS] Mock data loaded (admin mode)');
        }
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

      if (!isMountedRef.current) return;

      if (error) {
        console.error('[DAILY-WINNERS] Error fetching yesterday TOP 10:', error);
        setTopPlayers([]);
        return;
      }

      if (!players || players.length === 0) {
        console.log('[DAILY-WINNERS] No snapshot data found for yesterday - showing mock data');
        // If no data, show mock data for testing
        const mockPlayers: TopPlayer[] = [
          { user_id: '1', rank: 1, username: 'ProGamer2024', avatar_url: null, total_correct_answers: 145 },
          { user_id: '2', rank: 2, username: 'QuizMaster', avatar_url: null, total_correct_answers: 142 },
          { user_id: '3', rank: 3, username: 'BrainChamp', avatar_url: null, total_correct_answers: 138 },
          { user_id: '4', rank: 4, username: 'SmartPlayer', avatar_url: null, total_correct_answers: 135 },
          { user_id: '5', rank: 5, username: 'ThinkFast99', avatar_url: null, total_correct_answers: 132 },
          { user_id: '6', rank: 6, username: 'QuickWit', avatar_url: null, total_correct_answers: 128 },
          { user_id: '7', rank: 7, username: 'MindWarrior', avatar_url: null, total_correct_answers: 125 },
          { user_id: '8', rank: 8, username: 'LogicKing', avatar_url: null, total_correct_answers: 122 },
          { user_id: '9', rank: 9, username: 'PuzzlePro', avatar_url: null, total_correct_answers: 118 },
          { user_id: '10', rank: 10, username: 'GeniusOne', avatar_url: null, total_correct_answers: 115 },
        ];
        
        if (isMountedRef.current) {
          setTopPlayers(mockPlayers);
          setTotalRewards({ totalGold: 1_725, totalLives: 62 });
        }
        return;
      }

      setTopPlayers(players as TopPlayer[]);
      console.log('[DAILY-WINNERS] Loaded yesterday TOP 10 from snapshot:', players.length, 'players');
      
      // Fetch total rewards for yesterday's TOP 10 players
      const { data: rewards, error: rewardsError } = await supabase
        .from('daily_winner_awarded')
        .select('gold_awarded, lives_awarded')
        .eq('day_date', yesterdayDate)
        .lte('rank', 10);
      
      if (!rewardsError && rewards && isMountedRef.current) {
        const totalGold = rewards.reduce((sum, r) => sum + r.gold_awarded, 0);
        const totalLives = rewards.reduce((sum, r) => sum + r.lives_awarded, 0);
        setTotalRewards({ totalGold, totalLives });
        console.log('[DAILY-WINNERS] Total rewards yesterday TOP 10:', { totalGold, totalLives });
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('[DAILY-WINNERS] Exception fetching yesterday TOP 10:', error);
        setTopPlayers([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchYesterdayTopPlayers();
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setContentVisible(true);
        }
      }, 10);
      
      return () => {
        clearTimeout(timer);
        setContentVisible(false);
      };
    } else {
      setContentVisible(false);
    }
  }, [open, fetchYesterdayTopPlayers]);

  // Memoize players 4-10 to avoid re-renders
  const rankFourToTen = useMemo(() => topPlayers.slice(3, 10), [topPlayers]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        overlayClassName="bg-black/25"
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
            className="fixed inset-0 flex flex-col items-center justify-center overflow-visible"
            style={{ 
              minHeight: '100dvh', 
              minWidth: '100vw',
              paddingLeft: '0',
              paddingRight: '0',
              marginLeft: '0',
              marginRight: '0'
            }}
          >
          <DialogTitle className="sr-only">{t('dailyWinners.dialog_title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('dailyWinners.dialog_description')}</DialogDescription>

          {/* BONUS MODAL WRAPPER - Fix arányú, skálázódó layout */}
          <div 
            className="relative z-10"
            style={{ 
              width: 'min(420px, 90vw)',
              aspectRatio: '9 / 16',
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1500ms ease-in-out 10ms, opacity 1500ms ease-in-out 10ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto'
            }}
          >
            {/* BONUS MODAL CARD - Teljes belső tartalom */}
            <div 
              className="absolute inset-0"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
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
                    
                     <h1 className="relative z-10 font-black text-white text-center uppercase px-2"
                        style={{ 
                          fontSize: 'clamp(1.125rem, 4.5vw, 1.875rem)', 
                          letterSpacing: '0.05em',
                          fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
                          fontWeight: 'bold',
                          WebkitTextStroke: '1.5px rgba(0,0,0,0.8)',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          lineHeight: '1.2'
                        }}>
                      {t('dailyWinners.geniuses')}
                    </h1>
                    
                     {/* Jackpot info row */}
                     <div className="relative z-10 mt-2 flex items-center justify-center gap-1 text-white px-2"
                          style={{
                            fontSize: 'clamp(0.95rem, 3.8vw, 1.25rem)',
                            fontFamily: '"Poppins", system-ui, sans-serif',
                            fontWeight: 700,
                            flexWrap: 'wrap'
                          }}>
                       <span style={{
                         color: '#ffd700',
                         WebkitTextStroke: '0.8px rgba(0,0,0,0.8)',
                         letterSpacing: '0.03em',
                         textTransform: 'uppercase',
                         whiteSpace: 'nowrap',
                         fontWeight: 'bold'
                       }}>{t('dailyWinners.jackpot')}</span>
                      
                      {/* Gold coin: value above, icon below */}
                      <div className="flex flex-col items-center gap-0.5">
                        <span style={{
                          fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)',
                          fontWeight: 'bold',
                          fontFamily: '"Poppins", system-ui, sans-serif',
                          color: '#ffd700',
                          WebkitTextStroke: '1px rgba(0,0,0,0.8)'
                        }}>{totalRewards.totalGold.toLocaleString()}</span>
                        <svg width="22" height="22" viewBox="0 0 100 100" className="inline-block">
                          <defs>
                            <radialGradient id={svgIds.coinGold} cx="35%" cy="30%">
                              <stop offset="0%" stopColor="#fff9cc" />
                              <stop offset="20%" stopColor="#ffe066" />
                              <stop offset="50%" stopColor="#ffd700" />
                              <stop offset="80%" stopColor="#d4af37" />
                              <stop offset="100%" stopColor="#a67c00" />
                            </radialGradient>
                            <radialGradient id={svgIds.coinInner} cx="50%" cy="50%">
                              <stop offset="0%" stopColor="#ffeaa7" />
                              <stop offset="50%" stopColor="#f9ca24" />
                              <stop offset="100%" stopColor="#d4af37" />
                            </radialGradient>
                            <filter id={svgIds.coinShadow}>
                              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.5"/>
                            </filter>
                          </defs>
                          <circle cx="50" cy="50" r="45" fill={`url(#${svgIds.coinGold})`} stroke="#8b6914" strokeWidth="2" filter={`url(#${svgIds.coinShadow})`} />
                          <circle cx="50" cy="50" r="35" fill={`url(#${svgIds.coinInner})`} stroke="#d4af37" strokeWidth="1.5" opacity="0.9" />
                          <circle cx="50" cy="50" r="28" fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.6" />
                          <ellipse cx="38" cy="35" rx="12" ry="8" fill="rgba(255,255,255,0.4)" opacity="0.7" />
                        </svg>
                      </div>
                      
                      {/* Heart: value above, icon below */}
                      <div className="flex flex-col items-center gap-0.5">
                        <span style={{
                          fontSize: 'clamp(0.9rem, 3.5vw, 1.2rem)',
                          fontWeight: 'bold',
                          fontFamily: '"Poppins", system-ui, sans-serif',
                          color: '#ff1744',
                          WebkitTextStroke: '1px rgba(0,0,0,0.8)'
                        }}>{totalRewards.totalLives.toLocaleString()}</span>
                        <svg width="22" height="22" viewBox="0 0 100 100" fill="none" className="inline-block">
                          <defs>
                            <linearGradient id={svgIds.heartGradient} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ff6b6b" />
                              <stop offset="30%" stopColor="#ff5252" />
                              <stop offset="60%" stopColor="#ff1744" />
                              <stop offset="100%" stopColor="#c41c00" />
                            </linearGradient>
                            <radialGradient id={svgIds.heartHighlight} cx="30%" cy="25%">
                              <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                              <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </radialGradient>
                            <filter id={svgIds.heartShadow}>
                              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.5"/>
                            </filter>
                          </defs>
                          <path d="M50 85 L20 55 C10 45 10 28 20 18 C30 8 45 8 50 18 C55 8 70 8 80 18 C90 28 90 45 80 55 Z" 
                                fill={`url(#${svgIds.heartGradient})`} stroke="#b71c1c" strokeWidth="2" filter={`url(#${svgIds.heartShadow})`} />
                          <ellipse cx="35" cy="30" rx="12" ry="10" fill={`url(#${svgIds.heartHighlight})`} opacity="0.7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex flex-col items-center px-[8%] pb-[3%]" style={{ height: '100%', paddingTop: '0' }}>
                  <div className="w-full mb-2 overflow-visible" style={{ minHeight: 'calc(100% - 100px)', maxHeight: 'calc(100% - 100px)' }}>
                    {topPlayers.length === 0 ? (
                      <div className="text-center text-white py-8">
                        <p className="text-lg">{t('dailyWinners.noData')}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center items-end gap-2 mb-4 px-1" style={{ transform: 'translateY(-30%)' }}>
                          {topPlayers[1] && (
                            <div className="flex flex-col items-center relative" style={{ 
                              width: '36.225%',
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
                                <p className="text-white font-bold leading-none truncate px-1" style={{
                                  WebkitTextStroke: '0.5px rgba(0,0,0,0.8)',
                                  fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
                                  maxWidth: '100%'
                                }}>
                                  {topPlayers[1].username}
                                </p>
                              </div>
                            </div>
                          )}

                          {topPlayers[0] && (
                            <div className="flex flex-col items-center relative" style={{ 
                              width: '43.47%',
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
                                <p className="text-white font-bold leading-none truncate px-1" style={{
                                  WebkitTextStroke: '0.5px rgba(0,0,0,0.8)',
                                  fontSize: 'clamp(0.65rem, 3vw, 0.8rem)',
                                  maxWidth: '100%'
                                }}>
                                  {topPlayers[0].username}
                                </p>
                              </div>
                            </div>
                          )}

                          {topPlayers[2] && (
                            <div className="flex flex-col items-center relative" style={{ 
                              width: '36.225%',
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
                                <p className="text-white font-bold leading-none truncate px-1" style={{
                                  WebkitTextStroke: '0.5px rgba(0,0,0,0.8)',
                                  fontSize: 'clamp(0.6rem, 2.8vw, 0.75rem)',
                                  maxWidth: '100%'
                                }}>
                                  {topPlayers[2].username}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Positions 4-10 - 2 rows: first row 4 items, second row 3 items centered */}
                        <div style={{ transform: 'translateY(-8%)' }}>
                          {/* First row: positions 4-7 */}
                          <div className="grid grid-cols-4 gap-2 mb-2" style={{ transform: 'scale(1.15)' }}>
                            {rankFourToTen.slice(0, 4).map((player) => {
                              return (
                                <div
                                  key={player.user_id}
                                  className="flex flex-col items-center relative"
                                  style={{ width: '100%' }}
                                >
                                  <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                                    {/* Profile Picture with 3D Royal Blue Border - Same structure as TOP 3 */}
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                      <div className="absolute inset-0 rounded-full" style={{
                                        background: 'linear-gradient(135deg, hsl(225, 73%, 70%) 0%, hsl(220, 80%, 70%) 25%, hsl(225, 73%, 57%) 50%, hsl(225, 73%, 47%) 75%, hsl(225, 73%, 70%) 100%)',
                                        boxShadow: '0 8px 16px rgba(65, 105, 225, 0.6), inset 0 2px 4px rgba(135, 206, 250, 0.8), inset 0 -2px 4px rgba(0, 0, 139, 0.5)'
                                      }} />
                                      <div className="absolute inset-[6px] rounded-full overflow-hidden">
                                        {player.avatar_url ? (
                                          <img 
                                            src={player.avatar_url} 
                                            alt={player.username}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div 
                                            className="w-full h-full flex items-center justify-center font-bold bg-gray-800"
                                            style={{ 
                                              color: 'hsl(225, 73%, 70%)',
                                              fontSize: 'clamp(0.9rem, 4vw, 1.2rem)'
                                            }}
                                          >
                                            {player.username.substring(0, 2).toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Rank Badge - Exact copy of TOP 3 structure with royal blue colors */}
                                    <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                      <div className="aspect-square rounded-full relative">
                                        <div className="absolute inset-0 rounded-full" style={{
                                          background: 'radial-gradient(circle at 30% 30%, #b3d1ff 0%, #4169e1 30%, #2e5cb8 60%, #1e3a8a 100%)',
                                          boxShadow: '0 6px 12px rgba(65,105,225,0.6), 0 2px 4px rgba(0,0,0,0.3)'
                                        }} />
                                        <div className="absolute inset-[3px] rounded-full" style={{
                                          background: 'linear-gradient(135deg, #a8c8ff 0%, #4169e1 50%, #1e3a8a 100%)',
                                          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -2px 6px rgba(30,58,138,0.5)'
                                        }} />
                                        <div className="absolute inset-[6px] rounded-full flex items-center justify-center" style={{
                                          background: 'radial-gradient(circle at 35% 35%, #dae8ff 0%, #4169e1 40%, #2e5cb8 100%)',
                                          boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.9), inset 0 -1px 3px rgba(30,58,138,0.3)'
                                        }}>
                                          <span className="font-black relative" style={{ 
                                            fontSize: '3vw',
                                            background: 'linear-gradient(180deg, #f0f9ff 0%, #bae6fd 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
                                          }}>
                                            {player.rank}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Username */}
                                  <div className="text-center w-full mt-1">
                                     <p 
                                      className="text-white font-bold leading-none truncate px-1" 
                                      style={{
                                        WebkitTextStroke: '0.5px rgba(0,0,0,0.8)',
                                        fontSize: 'clamp(0.55rem, 2.5vw, 0.7rem)',
                                        maxWidth: '100%'
                                      }}
                                    >
                                      {player.username}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Second row: positions 8-10 centered */}
                          <div className="flex justify-center gap-2">
                            {rankFourToTen.slice(4, 7).map((player) => {
                              return (
                                <div
                                  key={player.user_id}
                                  className="flex flex-col items-center relative"
                                  style={{ width: 'calc(28.75% - 6px)' }}
                                >
                                  <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                                    {/* Profile Picture with 3D Royal Blue Border - Same structure as TOP 3 */}
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                      <div className="absolute inset-0 rounded-full" style={{
                                        background: 'linear-gradient(135deg, hsl(225, 73%, 70%) 0%, hsl(220, 80%, 70%) 25%, hsl(225, 73%, 57%) 50%, hsl(225, 73%, 47%) 75%, hsl(225, 73%, 70%) 100%)',
                                        boxShadow: '0 8px 16px rgba(65, 105, 225, 0.6), inset 0 2px 4px rgba(135, 206, 250, 0.8), inset 0 -2px 4px rgba(0, 0, 139, 0.5)'
                                      }} />
                                      <div className="absolute inset-[6px] rounded-full overflow-hidden">
                                        {player.avatar_url ? (
                                          <img 
                                            src={player.avatar_url} 
                                            alt={player.username}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div 
                                            className="w-full h-full flex items-center justify-center font-bold bg-gray-800"
                                            style={{ 
                                              color: 'hsl(225, 73%, 70%)',
                                              fontSize: 'clamp(0.9rem, 4vw, 1.2rem)'
                                            }}
                                          >
                                            {player.username.substring(0, 2).toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Rank Badge - Exact copy of TOP 3 structure with royal blue colors */}
                                    <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                      <div className="aspect-square rounded-full relative">
                                        <div className="absolute inset-0 rounded-full" style={{
                                          background: 'radial-gradient(circle at 30% 30%, #b3d1ff 0%, #4169e1 30%, #2e5cb8 60%, #1e3a8a 100%)',
                                          boxShadow: '0 6px 12px rgba(65,105,225,0.6), 0 2px 4px rgba(0,0,0,0.3)'
                                        }} />
                                        <div className="absolute inset-[3px] rounded-full" style={{
                                          background: 'linear-gradient(135deg, #a8c8ff 0%, #4169e1 50%, #1e3a8a 100%)',
                                          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -2px 6px rgba(30,58,138,0.5)'
                                        }} />
                                        <div className="absolute inset-[6px] rounded-full flex items-center justify-center" style={{
                                          background: 'radial-gradient(circle at 35% 35%, #dae8ff 0%, #4169e1 40%, #2e5cb8 100%)',
                                          boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.9), inset 0 -1px 3px rgba(30,58,138,0.3)'
                                        }}>
                                          <span className="font-black relative" style={{ 
                                            fontSize: '3vw',
                                            background: 'linear-gradient(180deg, #f0f9ff 0%, #bae6fd 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
                                          }}>
                                            {player.rank}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Username */}
                                  <div className="text-center w-full mt-1">
                                     <p 
                                      className="text-white font-bold leading-none truncate px-1" 
                                      style={{
                                        WebkitTextStroke: '0.5px rgba(0,0,0,0.8)',
                                        fontSize: 'clamp(0.55rem, 2.5vw, 0.7rem)',
                                        maxWidth: '100%'
                                      }}
                                    >
                                      {player.username}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                       </>
                    )}
                  </div>

                  <div className="absolute bottom-[8%] left-0 right-0 flex justify-center w-full px-4">
                    <HexAcceptButton 
                      onClick={onClose}
                      className="w-full max-w-[280px]"
                      style={{ transform: 'scale(0.9)' }}
                    >
                      {t('common.accept')}
                    </HexAcceptButton>
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
