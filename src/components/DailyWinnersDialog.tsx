import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';
import { useI18n } from '@/i18n/useI18n';
import { toast } from 'sonner';
import laurelWreathGold from '@/assets/laurel_wreath_gold.svg';
import { useDailyRankReward } from '@/hooks/useDailyRankReward';

// Fix artboard dimensions (iPhone 11/12/13/14 portrait)
const BASE_WIDTH = 414;
const BASE_HEIGHT = 896;

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
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [contentVisible, setContentVisible] = useState(false);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [totalRewards, setTotalRewards] = useState<TotalRewards>({ totalGold: 150000, totalLives: 20000 });
  const [isLoading, setIsLoading] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  
  // Fetch current user for pendingReward check
  const [userId, setUserId] = useState<string | undefined>();
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    fetchUser();
  }, []);
  
  // Integrate useDailyRankReward hook for dynamic button
  const { pendingReward, claimReward, isClaiming } = useDailyRankReward(userId);
  
  // Generate unique IDs once per component instance
  const svgIds = useMemo(() => ({
    coinGold: generateUniqueId('coinGold3D'),
    coinInner: generateUniqueId('coinInner'),
    coinShadow: generateUniqueId('coinShadow'),
    heartGradient: generateUniqueId('heartGradient3D'),
    heartHighlight: generateUniqueId('heartHighlight'),
    heartShadow: generateUniqueId('heartShadow'),
  }), []);

  // Calculate scale based on viewport
  useLayoutEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = vw / BASE_WIDTH;
      const scaleY = vh / BASE_HEIGHT;
      const nextScale = Math.min(scaleX, scaleY, 1.1); // Allow slight upscaling
      
      setScale(nextScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('country_code, user_timezone')
        .eq('id', user.id)
        .single();

      if (!profile?.country_code || !isMountedRef.current) {
        console.error('[DAILY-WINNERS] No country_code');
        setTopPlayers([]);
        return;
      }

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateStr = yesterday.toISOString().split('T')[0];

      let players: TopPlayer[] = [];

      const { data: cachedData, error: cacheError } = await supabase
        .from('daily_leaderboard_snapshot')
        .select('*')
        .eq('snapshot_date', yesterdayDateStr)
        .eq('country_code', profile.country_code)
        .order('rank', { ascending: true })
        .limit(10);

      if (cacheError) {
        console.error('[DAILY-WINNERS] Cache error:', cacheError);
      }

      if (cachedData && cachedData.length > 0) {
        players = cachedData.map(row => ({
          user_id: row.user_id,
          rank: row.rank,
          username: row.username,
          avatar_url: row.avatar_url,
          total_correct_answers: row.total_correct_answers || 0
        }));
      } else {
        const { data, error } = await supabase.functions.invoke('process-daily-winners', {
          body: { p_date: yesterdayDateStr }
        });

        if (error) {
          console.error('[DAILY-WINNERS] Process error:', error);
        }

        const { data: freshData, error: freshError } = await supabase
          .from('daily_leaderboard_snapshot')
          .select('*')
          .eq('snapshot_date', yesterdayDateStr)
          .eq('country_code', profile.country_code)
          .order('rank', { ascending: true })
          .limit(10);

        if (freshError) {
          console.error('[DAILY-WINNERS] Fresh fetch error:', freshError);
        }

        if (freshData && freshData.length > 0) {
          players = freshData.map(row => ({
            user_id: row.user_id,
            rank: row.rank,
            username: row.username,
            avatar_url: row.avatar_url,
            total_correct_answers: row.total_correct_answers || 0
          }));
        }
      }

      if (!isMountedRef.current) {
        return;
      }

      setTopPlayers(players as TopPlayer[]);
      
      const { data: rewards } = await supabase
        .from('daily_winner_awarded')
        .select('gold_awarded, lives_awarded')
        .eq('day_date', yesterdayDateStr)
        .lte('rank', 10);
      
      if (rewards && isMountedRef.current) {
        const totalGold = rewards.reduce((sum, r) => sum + r.gold_awarded, 0);
        const totalLives = rewards.reduce((sum, r) => sum + r.lives_awarded, 0);
        setTotalRewards({ totalGold, totalLives });
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('[DAILY-WINNERS] Exception:', error);
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

  const handlePlayNow = useCallback(() => {
    onClose();
    navigate('/game');
  }, [onClose, navigate]);

  const handleAccept = useCallback(async () => {
    if (!userId) return;

    try {
      if (pendingReward) {
        await claimReward();
        toast.success(t('dailyWinners.claimSuccess') || 'Reward claimed successfully!');
      }
      onClose();
    } catch (error) {
      console.error('[DAILY-WINNERS] Accept error:', error);
      toast.error(t('dailyWinners.claimError') || 'Failed to claim reward');
      onClose();
    }
  }, [userId, pendingReward, claimReward, onClose, t]);

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
          minHeight: '100vh',
          borderRadius: 0,
          zIndex: 99999
        }}
      >
        <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
          <DialogTitle className="sr-only">{t('dailyWinners.dialog_title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('dailyWinners.dialog_description')}</DialogDescription>

          {/* Close X button - Only when no data */}
          {topPlayers.length === 0 && (
            <button
              onClick={onClose}
              className={`absolute top-[clamp(2rem,10vh,4rem)] right-[clamp(0.75rem,3vw,1.5rem)] text-white/70 hover:text-white text-[clamp(2rem,8vw,3rem)] font-bold z-30 flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-all ${contentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
              style={{ width: 'clamp(2.5rem,10vw,4rem)', height: 'clamp(2.5rem,10vw,4rem)' }}
              aria-label="Close"
            >
              ×
            </button>
          )}

          {/* SCALED CONTAINER */}
          <div
            style={{
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              position: 'relative',
              opacity: contentVisible ? 1 : 0,
              transition: 'opacity 1500ms ease-in-out'
            }}
          >
            <div 
              className="daily-winners-card relative w-full h-full"
            >
              <HexShieldFrame showShine={true}>
                {/* RED BANNER - GENIUSES / JACKPOT */}
                <div 
                  ref={badgeRef}
                  className="relative z-20 mx-auto" 
                  style={{ 
                    width: 'clamp(18rem, 77vw, 24rem)',
                    maxWidth: '95%',
                    transform: 'translateY(-75%)' 
                  }}
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
                  
                  <div className="absolute" style={{ inset: '3px' }}>
                    <div style={{
                      clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                      background: 'linear-gradient(180deg, hsl(var(--dup-gold-400)), hsl(var(--dup-gold-500)) 40%, hsl(var(--dup-gold-700)))',
                      boxShadow: 'inset 0 1px 0 hsl(var(--dup-gold-300))',
                      height: '100%'
                    }} />
                  </div>
                  
                  <div className="relative" style={{
                    clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                    padding: 'clamp(0.375rem, 1.5vh, 0.625rem) clamp(1rem, 4vw, 1.5rem)'
                  }}>
                    <div className="absolute" style={{
                      inset: '6px',
                      clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                      background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(0 95% 75%) 0%, hsl(0 90% 65%) 30%, hsl(0 85% 55%) 60%, hsl(0 78% 48%) 100%)',
                      boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.125), inset 0 -6px 12px rgba(0,0,0,0.2)'
                    }} />
                    
                    <div className="absolute pointer-events-none" style={{
                      inset: '6px',
                      clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                      opacity: 0.7
                    }} />
                    
                    <div className="absolute pointer-events-none" style={{
                      inset: '6px',
                      clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                      background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5), transparent 60%)'
                    }} />
                    
                    <h1 className="relative z-10 font-black text-white text-center uppercase px-2"
                        style={{ 
                          fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)',
                          letterSpacing: '0.05em',
                          fontWeight: 'bold',
                          WebkitTextStroke: '1.5px rgba(0,0,0,0.8)',
                          lineHeight: '1.2'
                        }}>
                      {t('dailyWinners.geniuses')}
                    </h1>
                    
                    {/* Jackpot info row */}
                    <div className="relative z-10 mt-1 flex items-center justify-center gap-1 text-white px-2"
                         style={{
                           fontSize: 'clamp(0.75rem, 3vw, 1rem)',
                           fontWeight: 700,
                           flexWrap: 'wrap'
                         }}>
                      <span style={{
                        color: '#ffd700',
                        WebkitTextStroke: '0.8px rgba(0,0,0,0.8)',
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        fontWeight: 900
                      }}>
                        JACKPOT:
                      </span>
                      <div className="flex items-center gap-1">
                        <svg width="clamp(14, 3.5vw, 20)" height="clamp(14, 3.5vw, 20)" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <radialGradient id={svgIds.coinGold} cx="35%" cy="35%">
                              <stop offset="0%" stopColor="#fffacd" />
                              <stop offset="40%" stopColor="#ffd700" />
                              <stop offset="70%" stopColor="#daa520" />
                              <stop offset="100%" stopColor="#b8860b" />
                            </radialGradient>
                            <radialGradient id={svgIds.coinInner} cx="50%" cy="50%">
                              <stop offset="0%" stopColor="#ffed4e" />
                              <stop offset="100%" stopColor="#ff9500" />
                            </radialGradient>
                            <filter id={svgIds.coinShadow}>
                              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.5"/>
                            </filter>
                          </defs>
                          <circle cx="50" cy="50" r="45" fill={`url(#${svgIds.coinGold})`} stroke="#b8860b" strokeWidth="2" filter={`url(#${svgIds.coinShadow})`} />
                          <circle cx="50" cy="50" r="35" fill={`url(#${svgIds.coinInner})`} opacity="0.9" />
                          <ellipse cx="40" cy="35" rx="15" ry="12" fill="rgba(255,255,255,0.5)" opacity="0.7" />
                        </svg>
                        <span style={{ fontWeight: 900 }}>{totalRewards.totalGold.toLocaleString()}</span>
                      </div>
                      <span style={{ fontWeight: 900 }}>+</span>
                      <div className="flex items-center gap-1">
                        <svg width="clamp(14, 3.5vw, 20)" height="clamp(14, 3.5vw, 20)" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <radialGradient id={svgIds.heartGradient} cx="35%" cy="35%">
                              <stop offset="0%" stopColor="#ff6b6b" />
                              <stop offset="40%" stopColor="#ee5a5a" />
                              <stop offset="70%" stopColor="#dc4848" />
                              <stop offset="100%" stopColor="#c92a2a" />
                            </radialGradient>
                            <radialGradient id={svgIds.heartHighlight} cx="30%" cy="30%">
                              <stop offset="0%" stopColor="#ffffff" />
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
                        <span style={{ fontWeight: 900 }}>{totalRewards.totalLives.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONTENT AREA */}
                <div 
                  className="relative z-10 flex flex-col items-center justify-between px-4" 
                  style={{ 
                    height: '100%',
                    paddingBottom: 'clamp(3rem, 8vh, 4.5rem)',
                    transform: 'translateY(-15%)'
                  }}
                >
                  {topPlayers.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg width="clamp(80, 20vw, 120)" height="clamp(80, 20vw, 120)" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <radialGradient id="faceGradient" cx="35%" cy="35%">
                            <stop offset="0%" stopColor="#FFD54F" />
                            <stop offset="40%" stopColor="#FFB300" />
                            <stop offset="70%" stopColor="#FF8F00" />
                            <stop offset="100%" stopColor="#E65100" />
                          </radialGradient>
                          <radialGradient id="shadowGradient" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#000000" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="eyeGradient" cx="30%" cy="30%">
                            <stop offset="0%" stopColor="#4A4A4A" />
                            <stop offset="100%" stopColor="#1A1A1A" />
                          </radialGradient>
                          <linearGradient id="mouthShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8B4513" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#8B4513" stopOpacity="0" />
                          </linearGradient>
                          <radialGradient id="highlight" cx="30%" cy="30%">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <ellipse cx="60" cy="105" rx="35" ry="8" fill="url(#shadowGradient)" />
                        <circle cx="60" cy="60" r="48" fill="url(#faceGradient)" />
                        <circle cx="60" cy="60" r="48" fill="none" stroke="#E65100" strokeWidth="1.5" opacity="0.6" />
                        <ellipse cx="45" cy="40" rx="18" ry="14" fill="url(#highlight)" opacity="0.5" />
                        <ellipse cx="42" cy="50" rx="7" ry="8" fill="url(#eyeGradient)" />
                        <ellipse cx="44" cy="48" rx="2" ry="2.5" fill="#FFFFFF" opacity="0.6" />
                        <ellipse cx="78" cy="50" rx="7" ry="8" fill="url(#eyeGradient)" />
                        <ellipse cx="80" cy="48" rx="2" ry="2.5" fill="#FFFFFF" opacity="0.6" />
                        <path d="M 35 78 Q 60 68 85 78" stroke="#6D4C41" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.9" />
                        <path d="M 38 77 Q 60 69 82 77" stroke="url(#mouthShadow)" strokeWidth="3" strokeLinecap="round" fill="none" />
                        <ellipse cx="60" cy="90" rx="40" ry="12" fill="#E65100" opacity="0.2" />
                      </svg>
                      
                      <div className="mt-4 mb-6">
                        <p className="font-bold text-white text-center" style={{
                          fontSize: 'clamp(1.125rem, 4.5vw, 1.5rem)',
                          WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                        }}>
                          {t('dailyWinners.noWinnersFirstLine')}
                        </p>
                        <p className="font-bold text-white text-center mt-2" style={{
                          fontSize: 'clamp(1.125rem, 4.5vw, 1.5rem)',
                          WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                        }}>
                          {t('dailyWinners.noWinnersSecondLine')}
                        </p>
                      </div>

                      <HexAcceptButton 
                        onClick={handlePlayNow}
                        className="w-full max-w-[280px]"
                        style={{ transform: 'scale(0.9)' }}
                      >
                        {t('dailyWinners.playNowButton')}
                      </HexAcceptButton>
                    </div>
                  ) : (
                    <>
                      {/* TOP 3 WINNERS ROW - 3rd(Bronze) 1st(Gold) 2nd(Silver) */}
                      <div className="flex justify-center items-end w-full gap-2 mt-3">
                        {/* 3RD PLACE - BRONZE - LEFT */}
                        {topPlayers[2] && (
                          <div className="flex flex-col items-center" style={{ 
                            width: 'clamp(5rem, 20vw, 6.25rem)',
                            minWidth: 'clamp(50px, 20vw, 81px)',
                            minHeight: 'clamp(99px, 31.5vw, 144px)'
                          }}>
                            <div
                              className="w-full flex flex-col items-center"
                              style={{
                                transform: 'scale(0.9)',
                                transformOrigin: 'center bottom'
                              }}
                            >
                              <div className="w-full">
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
                                      <div className="absolute" style={{ inset: '6px' }}>
                                        <div className="w-full h-full rounded-full overflow-hidden">
                                          {topPlayers[2].avatar_url ? (
                                            <img 
                                              src={topPlayers[2].avatar_url} 
                                              alt={topPlayers[2].username}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-orange-700 font-bold bg-gray-800"
                                                 style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)' }}>
                                              {topPlayers[2].username.substring(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                    <div className="w-full" style={{ aspectRatio: '1/1' }}>
                                      <div className="relative w-full h-full">
                                        <div className="absolute inset-0 rounded-full" style={{
                                          background: 'radial-gradient(circle at 30% 30%, #cd7f32 0%, #c87533 30%, #b87333 60%, #a0522d 100%)',
                                          boxShadow: '0 4px 8px rgba(205,127,50,0.5)'
                                        }} />
                                        <div className="absolute rounded-full" style={{
                                          inset: '3px',
                                          background: 'linear-gradient(135deg, #d2a679 0%, #cd7f32 50%, #b87333 100%)',
                                          boxShadow: 'inset 0 2px 6px rgba(255,200,150,0.7), inset 0 -2px 6px rgba(0,0,0,0.4)'
                                        }} />
                                        <div className="absolute rounded-full flex items-center justify-center" style={{
                                          inset: '6px',
                                          background: 'radial-gradient(circle at 35% 35%, #daa06d 0%, #cd7f32 40%, #a0522d 100%)'
                                        }}>
                                          <span className="font-black" style={{ 
                                            fontSize: 'clamp(0.75rem, 3vw, 1rem)',
                                            background: 'linear-gradient(180deg, #fffacd 0%, #daa520 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                          }}>{topPlayers[2].rank}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <p className="text-white font-bold text-center truncate w-full px-1 mt-1" style={{
                              fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)',
                              WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                            }}>
                              {topPlayers[2].username}
                            </p>
                          </div>
                        )}

                        {/* 1ST PLACE - GOLD - MIDDLE (BIGGEST) */}
                        {topPlayers[0] && (
                          <div className="flex flex-col items-center" style={{ 
                            width: 'clamp(5rem, 21vw, 7rem)',
                            minWidth: 'clamp(50px, 22vw, 90px)',
                            minHeight: 'clamp(110px, 35vh, 160px)'
                          }}>
                            <div
                              className="w-full flex flex-col items-center"
                              style={{
                                transform: 'scale(1.2) translateY(-20px)',
                                transformOrigin: 'center bottom'
                              }}
                            >
                              <div
                                className="w-full"
                                style={{ animation: 'pulse-scale 2.4s ease-in-out infinite' }}
                              >
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
                                      <div className="absolute" style={{ inset: '6px' }}>
                                        <div className="w-full h-full rounded-full overflow-hidden">
                                          {topPlayers[0].avatar_url ? (
                                            <img 
                                              src={topPlayers[0].avatar_url} 
                                              alt={topPlayers[0].username}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-yellow-400 font-bold bg-gray-800"
                                                 style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
                                              {topPlayers[0].username.substring(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                    <div className="w-full" style={{ aspectRatio: '1/1' }}>
                                      <div className="relative w-full h-full">
                                        <div className="absolute inset-0 rounded-full" style={{
                                          background: 'radial-gradient(circle at 30% 30%, #fffacd 0%, #ffd700 30%, #ffb700 60%, #d4af37 100%)',
                                          boxShadow: '0 6px 12px rgba(218,165,32,0.6)'
                                        }} />
                                        <div className="absolute rounded-full" style={{
                                          inset: '3px',
                                          background: 'linear-gradient(135deg, #fff9c4 0%, #ffd700 50%, #d4af37 100%)',
                                          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -2px 6px rgba(139,69,0,0.5)'
                                        }} />
                                        <div className="absolute rounded-full flex items-center justify-center" style={{
                                          inset: '6px',
                                          background: 'radial-gradient(circle at 35% 35%, #ffffe0 0%, #ffd700 40%, #daa520 100%)'
                                        }}>
                                          <span className="font-black" style={{ 
                                            fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)',
                                            background: 'linear-gradient(180deg, #8b4513 0%, #4a2511 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                          }}>{topPlayers[0].rank}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <p className="text-white font-bold text-center truncate w-full px-1 mt-1" style={{
                              fontSize: 'clamp(0.625rem, 2.75vw, 0.9375rem)',
                              WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                            }}>
                              {topPlayers[0].username}
                            </p>
                          </div>
                        )}

                        {/* 2ND PLACE - SILVER - RIGHT */}
                        {topPlayers[1] && (
                          <div className="flex flex-col items-center" style={{ 
                            width: 'clamp(5rem, 20vw, 6.25rem)',
                            minWidth: 'clamp(50px, 20vw, 81px)',
                            minHeight: 'clamp(99px, 31.5vw, 144px)'
                          }}>
                            <div
                              className="w-full flex flex-col items-center"
                              style={{
                                transform: 'scale(0.9)',
                                transformOrigin: 'center bottom'
                              }}
                            >
                              <div className="w-full">
                                <div className="relative w-full" style={{ aspectRatio: '744.09/1052.36' }}>
                                  <div 
                                    className="absolute inset-0"
                                    style={{
                                      backgroundImage: `url(${laurelWreathGold})`,
                                      backgroundSize: 'contain',
                                      backgroundPosition: 'center',
                                      backgroundRepeat: 'no-repeat',
                                      filter: 'grayscale(50%) brightness(1.2) contrast(1.1) saturate(0.4)'
                                    }}
                                  />
                                  <div className="absolute" style={{ left: '19.5%', top: '18%', width: '63%', height: '45%' }}>
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                      <div className="absolute inset-0 rounded-full" style={{
                                        background: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 25%, #c0c0c0 50%, #b0b0b0 75%, #a8a8a8 100%)',
                                        boxShadow: '0 6px 12px rgba(192,192,192,0.5), inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.3)'
                                      }} />
                                      <div className="absolute" style={{ inset: '6px' }}>
                                        <div className="w-full h-full rounded-full overflow-hidden">
                                          {topPlayers[1].avatar_url ? (
                                            <img 
                                              src={topPlayers[1].avatar_url} 
                                              alt={topPlayers[1].username}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-800"
                                                 style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)' }}>
                                              {topPlayers[1].username.substring(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                    <div className="w-full" style={{ aspectRatio: '1/1' }}>
                                      <div className="relative w-full h-full">
                                        <div className="absolute inset-0 rounded-full" style={{
                                          background: 'radial-gradient(circle at 30% 30%, #f0f0f0 0%, #d0d0d0 30%, #c0c0c0 60%, #a0a0a0 100%)',
                                          boxShadow: '0 4px 8px rgba(192,192,192,0.5)'
                                        }} />
                                        <div className="absolute rounded-full" style={{
                                          inset: '3px',
                                          background: 'linear-gradient(135deg, #f5f5f5 0%, #d0d0d0 50%, #b0b0b0 100%)',
                                          boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.8), inset 0 -2px 6px rgba(0,0,0,0.4)'
                                        }} />
                                        <div className="absolute rounded-full flex items-center justify-center" style={{
                                          inset: '6px',
                                          background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #d0d0d0 40%, #a0a0a0 100%)'
                                        }}>
                                          <span className="font-black" style={{ 
                                            fontSize: 'clamp(0.75rem, 3vw, 1rem)',
                                            background: 'linear-gradient(180deg, #555 0%, #222 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                          }}>{topPlayers[1].rank}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <p className="text-white font-bold text-center truncate w-full px-1 mt-1" style={{
                              fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)',
                              WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                            }}>
                              {topPlayers[1].username}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* RANKS 4-10 - TWO ROWS */}
                      <div className="w-full mt-4 px-2">
                        {/* FIRST ROW: 4-7 (4 circles) */}
                        {rankFourToTen.slice(0, 4).length > 0 && (
                          <div className="grid grid-cols-4 gap-[clamp(0.375rem,2vw,0.75rem)] mb-3">
                            {rankFourToTen.slice(0, 4).map((player) => (
                              <div key={player.user_id} className="flex flex-col items-center w-full">
                                <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'linear-gradient(135deg, hsl(225, 73%, 70%) 0%, hsl(220, 80%, 70%) 25%, hsl(225, 73%, 57%) 50%, hsl(225, 73%, 47%) 75%, hsl(225, 73%, 70%) 100%)',
                                      boxShadow: '0 4px 8px rgba(65, 105, 225, 0.5), inset 0 1px 2px rgba(135, 206, 250, 0.6)'
                                    }} />
                                    <div className="absolute rounded-full overflow-hidden" style={{ inset: '4px' }}>
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
                                            fontSize: 'clamp(0.75rem, 3vw, 1rem)'
                                          }}
                                        >
                                          {player.username.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Rank badge */}
                                  <div className="absolute left-[35%] bottom-[5%] w-[30%]">
                                    <div style={{ aspectRatio: '1/1' }}>
                                      <div className="relative w-full h-full">
                                        <div className="absolute inset-0 rounded-full" style={{
                                          background: 'radial-gradient(circle at 30% 30%, #b3d1ff 0%, #4169e1 30%, #2e5cb8 60%, #1e3a8a 100%)',
                                          boxShadow: '0 3px 6px rgba(65,105,225,0.5)'
                                        }} />
                                        <div className="absolute rounded-full flex items-center justify-center" style={{
                                          inset: '2px',
                                          background: 'radial-gradient(circle at 35% 35%, #dae8ff 0%, #4169e1 40%, #2e5cb8 100%)'
                                        }}>
                                          <span className="font-black" style={{ 
                                            fontSize: 'clamp(0.625rem, 2.5vw, 0.8125rem)',
                                            color: '#f0f9ff'
                                          }}>
                                            {player.rank}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-white font-bold text-center truncate w-full mt-1 px-0.5" style={{
                                  fontSize: 'clamp(0.5rem, 2vw, 0.6875rem)',
                                  WebkitTextStroke: '0.3px rgba(0,0,0,0.8)'
                                }}>
                                  {player.username}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SECOND ROW: 8-10 (3 circles centered) */}
                        {rankFourToTen.slice(4, 7).length > 0 && (
                          <div className="grid grid-cols-3 gap-[clamp(0.375rem,2vw,0.75rem)] max-w-[15rem] mx-auto">
                            {rankFourToTen.slice(4, 7).map((player) => (
                              <div key={player.user_id} className="flex flex-col items-center w-full">
                                <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'linear-gradient(135deg, hsl(225, 73%, 70%) 0%, hsl(220, 80%, 70%) 25%, hsl(225, 73%, 57%) 50%, hsl(225, 73%, 47%) 75%, hsl(225, 73%, 70%) 100%)',
                                      boxShadow: '0 4px 8px rgba(65, 105, 225, 0.5), inset 0 1px 2px rgba(135, 206, 250, 0.6)'
                                    }} />
                                    <div className="absolute rounded-full overflow-hidden" style={{ inset: '4px' }}>
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
                                            fontSize: 'clamp(0.75rem, 3vw, 1rem)'
                                          }}
                                        >
                                          {player.username.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Rank badge */}
                                  <div className="absolute left-[35%] bottom-[5%] w-[30%]">
                                    <div style={{ aspectRatio: '1/1' }}>
                                      <div className="relative w-full h-full">
                                        <div className="absolute inset-0 rounded-full" style={{
                                          background: 'radial-gradient(circle at 30% 30%, #b3d1ff 0%, #4169e1 30%, #2e5cb8 60%, #1e3a8a 100%)',
                                          boxShadow: '0 3px 6px rgba(65,105,225,0.5)'
                                        }} />
                                        <div className="absolute rounded-full flex items-center justify-center" style={{
                                          inset: '2px',
                                          background: 'radial-gradient(circle at 35% 35%, #dae8ff 0%, #4169e1 40%, #2e5cb8 100%)'
                                        }}>
                                          <span className="font-black" style={{ 
                                            fontSize: 'clamp(0.625rem, 2.5vw, 0.8125rem)',
                                            color: '#f0f9ff'
                                          }}>
                                            {player.rank}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-white font-bold text-center truncate w-full mt-1 px-0.5" style={{
                                  fontSize: 'clamp(0.5rem, 2vw, 0.6875rem)',
                                  WebkitTextStroke: '0.3px rgba(0,0,0,0.8)'
                                }}>
                                  {player.username}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CONGRATULATIONS BUTTON - Fixed at bottom */}
                      <div 
                        className="w-full flex justify-center mt-5 px-4"
                        style={{ 
                          transform: 'translateY(-5%)'
                        }}
                      >
                        <HexAcceptButton 
                          onClick={handleAccept}
                          className="w-full max-w-full"
                          disabled={isClaiming}
                        >
                          <span className="font-bold leading-tight flex items-center justify-center w-full" style={{ fontSize: 'clamp(0.75rem, 3vw, 1rem)' }}>
                            {pendingReward 
                              ? t('dailyWinners.claimReward')
                              : t('dailyWinners.congratulate')
                            }
                          </span>
                        </HexAcceptButton>
                      </div>
                    </>
                  )}
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
