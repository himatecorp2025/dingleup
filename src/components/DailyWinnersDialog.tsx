import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';
import { useI18n } from '@/i18n/useI18n';

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

export const DailyWinnersDialog = ({ open, onClose }: DailyWinnersDialogProps) => {
  const { t } = useI18n();
  const [contentVisible, setContentVisible] = useState(false);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const badgeRef = useRef<HTMLDivElement>(null);

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
      // Get current user's country code
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

      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      console.log('[DAILY-WINNERS] Fetching yesterday TOP 10 from daily_leaderboard_snapshot, country:', userCountry, 'date:', yesterdayDate);

      // Fetch top 10 from daily_leaderboard_snapshot for user's country and yesterday's date
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
        {/* Középre igazító konténer - blur háttérrel */}
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

          {/* Zoom animáció wrapper */}
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
                {/* Top Hex Badge - "TEGNAPI TOP 10" - UGYANAZ mint Daily Gift */}
                <div 
                  ref={badgeRef}
                  className="relative -mt-12 mb-3 mx-auto z-20" 
                  style={{ width: '78%' }}
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

                {/* Content Area - Fixed height to fit exactly 10 players */}
                <div className="relative z-10 flex flex-col items-center justify-between px-[8%] pb-[6%] pt-[2%]" style={{ height: 'calc(100% - 80px)' }}>
                  
                  {/* Players List */}
                  <div className="w-full mb-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
                    {topPlayers.length === 0 ? (
                      <div className="text-center text-white py-8">
                        <p className="text-lg">{t('dailyWinners.noData')}</p>
                      </div>
                    ) : (
                      <>
                        {/* TOP 3 - Horizontal Layout with Laurel Wreaths */}
                        <div className="flex justify-center items-center gap-3 mb-6 px-2">
                          {/* 2nd Place - Silver */}
                          {topPlayers[1] && (
                            <div className="flex flex-col items-center" style={{ width: '30%' }}>
                              <svg viewBox="0 0 140 180" className="w-full">
                                <defs>
                                  <radialGradient id="silverGrad" cx="50%" cy="50%">
                                    <stop offset="0%" style={{ stopColor: '#f5f5f5', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#d0d0d0', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#a0a0a0', stopOpacity: 1 }} />
                                  </radialGradient>
                                  <clipPath id="circleClip2">
                                    <circle cx="70" cy="65" r="32" />
                                  </clipPath>
                                </defs>
                                
                                {/* Left laurel branch */}
                                <path d="M 35,45 Q 28,50 32,56 L 30,54 Q 24,59 28,65 L 26,63 Q 20,68 24,74 L 22,72 Q 16,77 20,83" 
                                      fill="none" stroke="#b8b8b8" strokeWidth="3" strokeLinecap="round"/>
                                {/* Left leaves */}
                                <ellipse cx="32" cy="52" rx="6" ry="10" fill="#c8c8c8" stroke="#a0a0a0" strokeWidth="1" transform="rotate(-30 32 52)"/>
                                <ellipse cx="28" cy="60" rx="6" ry="10" fill="#c8c8c8" stroke="#a0a0a0" strokeWidth="1" transform="rotate(-25 28 60)"/>
                                <ellipse cx="24" cy="69" rx="6" ry="10" fill="#c8c8c8" stroke="#a0a0a0" strokeWidth="1" transform="rotate(-20 24 69)"/>
                                <ellipse cx="20" cy="78" rx="6" ry="10" fill="#c8c8c8" stroke="#a0a0a0" strokeWidth="1" transform="rotate(-15 20 78)"/>
                                
                                {/* Right laurel branch */}
                                <path d="M 105,45 Q 112,50 108,56 L 110,54 Q 116,59 112,65 L 114,63 Q 120,68 116,74 L 118,72 Q 124,77 120,83" 
                                      fill="none" stroke="#b8b8b8" strokeWidth="3" strokeLinecap="round"/>
                                {/* Right leaves */}
                                <ellipse cx="108" cy="52" rx="6" ry="10" fill="#c8c8c8" stroke="#a0a0a0" strokeWidth="1" transform="rotate(30 108 52)"/>
                                <ellipse cx="112" cy="60" rx="6" ry="10" fill="#c8c8c8" stroke="#a0a0a0" strokeWidth="1" transform="rotate(25 112 60)"/>
                                <ellipse cx="116" cy="69" rx="6" ry="10" fill="#c8c8c8" stroke="#a0a0a0" strokeWidth="1" transform="rotate(20 116 69)"/>
                                <ellipse cx="120" cy="78" rx="6" ry="10" fill="#c8c8c8" stroke="#a0a0a0" strokeWidth="1" transform="rotate(15 120 78)"/>
                                
                                {/* Avatar background circle */}
                                <circle cx="70" cy="65" r="34" fill="url(#silverGrad)" stroke="#e0e0e0" strokeWidth="2"/>
                                <circle cx="70" cy="65" r="32" fill="#1a1a1a" stroke="#c0c0c0" strokeWidth="2"/>
                                
                                {/* Avatar image or placeholder */}
                                {topPlayers[1].avatar_url ? (
                                  <image href={topPlayers[1].avatar_url} x="38" y="33" width="64" height="64" clipPath="url(#circleClip2)" preserveAspectRatio="xMidYMid slice"/>
                                ) : (
                                  <text x="70" y="72" textAnchor="middle" fill="#888" fontSize="14" fontWeight="bold">
                                    {topPlayers[1].username.substring(0, 2).toUpperCase()}
                                  </text>
                                )}
                                
                                {/* Rank badge at bottom */}
                                <circle cx="70" cy="110" r="16" fill="url(#silverGrad)" stroke="#fff" strokeWidth="2"/>
                                <text x="70" y="117" textAnchor="middle" fill="#000" fontSize="20" fontWeight="bold">2</text>
                                
                                {/* Username */}
                                <text x="70" y="140" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                                  {topPlayers[1].username.length > 10 ? topPlayers[1].username.substring(0, 10) + '...' : topPlayers[1].username}
                                </text>
                                
                                {/* Correct answers */}
                                <text x="70" y="155" textAnchor="middle" fill="#c0c0c0" fontSize="9">
                                  {topPlayers[1].total_correct_answers} {t('dailyWinners.correctAnswers')}
                                </text>
                              </svg>
                            </div>
                          )}

                          {/* 1st Place - Gold (larger) */}
                          {topPlayers[0] && (
                            <div className="flex flex-col items-center" style={{ width: '35%' }}>
                              <svg viewBox="0 0 140 190" className="w-full">
                                <defs>
                                  <radialGradient id="goldGrad2" cx="50%" cy="50%">
                                    <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#ffb700', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#cc9900', stopOpacity: 1 }} />
                                  </radialGradient>
                                  <clipPath id="circleClip1">
                                    <circle cx="70" cy="70" r="36" />
                                  </clipPath>
                                </defs>
                                
                                {/* Left laurel branch */}
                                <path d="M 30,45 Q 22,52 26,60 L 24,58 Q 17,65 21,73 L 19,71 Q 12,78 16,86 L 14,84 Q 7,91 11,99" 
                                      fill="none" stroke="#ccaa00" strokeWidth="3.5" strokeLinecap="round"/>
                                {/* Left leaves */}
                                <ellipse cx="26" cy="54" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(-30 26 54)"/>
                                <ellipse cx="21" cy="64" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(-25 21 64)"/>
                                <ellipse cx="16" cy="75" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(-20 16 75)"/>
                                <ellipse cx="11" cy="86" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(-15 11 86)"/>
                                <ellipse cx="9" cy="95" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(-10 9 95)"/>
                                
                                {/* Right laurel branch */}
                                <path d="M 110,45 Q 118,52 114,60 L 116,58 Q 123,65 119,73 L 121,71 Q 128,78 124,86 L 126,84 Q 133,91 129,99" 
                                      fill="none" stroke="#ccaa00" strokeWidth="3.5" strokeLinecap="round"/>
                                {/* Right leaves */}
                                <ellipse cx="114" cy="54" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(30 114 54)"/>
                                <ellipse cx="119" cy="64" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(25 119 64)"/>
                                <ellipse cx="124" cy="75" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(20 124 75)"/>
                                <ellipse cx="129" cy="86" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(15 129 86)"/>
                                <ellipse cx="131" cy="95" rx="7" ry="11" fill="#e6c200" stroke="#cc9900" strokeWidth="1" transform="rotate(10 131 95)"/>
                                
                                {/* Avatar background circle */}
                                <circle cx="70" cy="70" r="38" fill="url(#goldGrad2)" stroke="#ffe44d" strokeWidth="2.5"/>
                                <circle cx="70" cy="70" r="36" fill="#1a1a1a" stroke="#ffcc00" strokeWidth="2.5"/>
                                
                                {/* Avatar image or placeholder */}
                                {topPlayers[0].avatar_url ? (
                                  <image href={topPlayers[0].avatar_url} x="34" y="34" width="72" height="72" clipPath="url(#circleClip1)" preserveAspectRatio="xMidYMid slice"/>
                                ) : (
                                  <text x="70" y="78" textAnchor="middle" fill="#888" fontSize="16" fontWeight="bold">
                                    {topPlayers[0].username.substring(0, 2).toUpperCase()}
                                  </text>
                                )}
                                
                                {/* Rank badge at bottom */}
                                <circle cx="70" cy="120" r="18" fill="url(#goldGrad2)" stroke="#fff" strokeWidth="2.5"/>
                                <text x="70" y="128" textAnchor="middle" fill="#000" fontSize="24" fontWeight="bold">1</text>
                                
                                {/* Username */}
                                <text x="70" y="153" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                                  {topPlayers[0].username.length > 10 ? topPlayers[0].username.substring(0, 10) + '...' : topPlayers[0].username}
                                </text>
                                
                                {/* Correct answers */}
                                <text x="70" y="169" textAnchor="middle" fill="#ffd700" fontSize="10" fontWeight="bold">
                                  {topPlayers[0].total_correct_answers} {t('dailyWinners.correctAnswers')}
                                </text>
                              </svg>
                            </div>
                          )}

                          {/* 3rd Place - Bronze */}
                          {topPlayers[2] && (
                            <div className="flex flex-col items-center" style={{ width: '30%' }}>
                              <svg viewBox="0 0 140 180" className="w-full">
                                <defs>
                                  <radialGradient id="bronzeGrad2" cx="50%" cy="50%">
                                    <stop offset="0%" style={{ stopColor: '#e89b5a', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#cd7f32', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#8b5a2b', stopOpacity: 1 }} />
                                  </radialGradient>
                                  <clipPath id="circleClip3">
                                    <circle cx="70" cy="65" r="32" />
                                  </clipPath>
                                </defs>
                                
                                {/* Left laurel branch */}
                                <path d="M 35,45 Q 28,50 32,56 L 30,54 Q 24,59 28,65 L 26,63 Q 20,68 24,74 L 22,72 Q 16,77 20,83" 
                                      fill="none" stroke="#9d6b3a" strokeWidth="3" strokeLinecap="round"/>
                                {/* Left leaves */}
                                <ellipse cx="32" cy="52" rx="6" ry="10" fill="#cd7f32" stroke="#8b5a2b" strokeWidth="1" transform="rotate(-30 32 52)"/>
                                <ellipse cx="28" cy="60" rx="6" ry="10" fill="#cd7f32" stroke="#8b5a2b" strokeWidth="1" transform="rotate(-25 28 60)"/>
                                <ellipse cx="24" cy="69" rx="6" ry="10" fill="#cd7f32" stroke="#8b5a2b" strokeWidth="1" transform="rotate(-20 24 69)"/>
                                <ellipse cx="20" cy="78" rx="6" ry="10" fill="#cd7f32" stroke="#8b5a2b" strokeWidth="1" transform="rotate(-15 20 78)"/>
                                
                                {/* Right laurel branch */}
                                <path d="M 105,45 Q 112,50 108,56 L 110,54 Q 116,59 112,65 L 114,63 Q 120,68 116,74 L 118,72 Q 124,77 120,83" 
                                      fill="none" stroke="#9d6b3a" strokeWidth="3" strokeLinecap="round"/>
                                {/* Right leaves */}
                                <ellipse cx="108" cy="52" rx="6" ry="10" fill="#cd7f32" stroke="#8b5a2b" strokeWidth="1" transform="rotate(30 108 52)"/>
                                <ellipse cx="112" cy="60" rx="6" ry="10" fill="#cd7f32" stroke="#8b5a2b" strokeWidth="1" transform="rotate(25 112 60)"/>
                                <ellipse cx="116" cy="69" rx="6" ry="10" fill="#cd7f32" stroke="#8b5a2b" strokeWidth="1" transform="rotate(20 116 69)"/>
                                <ellipse cx="120" cy="78" rx="6" ry="10" fill="#cd7f32" stroke="#8b5a2b" strokeWidth="1" transform="rotate(15 120 78)"/>
                                
                                {/* Avatar background circle */}
                                <circle cx="70" cy="65" r="34" fill="url(#bronzeGrad2)" stroke="#e89b5a" strokeWidth="2"/>
                                <circle cx="70" cy="65" r="32" fill="#1a1a1a" stroke="#cd7f32" strokeWidth="2"/>
                                
                                {/* Avatar image or placeholder */}
                                {topPlayers[2].avatar_url ? (
                                  <image href={topPlayers[2].avatar_url} x="38" y="33" width="64" height="64" clipPath="url(#circleClip3)" preserveAspectRatio="xMidYMid slice"/>
                                ) : (
                                  <text x="70" y="72" textAnchor="middle" fill="#888" fontSize="14" fontWeight="bold">
                                    {topPlayers[2].username.substring(0, 2).toUpperCase()}
                                  </text>
                                )}
                                
                                {/* Rank badge at bottom */}
                                <circle cx="70" cy="110" r="16" fill="url(#bronzeGrad2)" stroke="#fff" strokeWidth="2"/>
                                <text x="70" y="117" textAnchor="middle" fill="#000" fontSize="20" fontWeight="bold">3</text>
                                
                                {/* Username */}
                                <text x="70" y="140" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                                  {topPlayers[2].username.length > 10 ? topPlayers[2].username.substring(0, 10) + '...' : topPlayers[2].username}
                                </text>
                                
                                {/* Correct answers */}
                                <text x="70" y="155" textAnchor="middle" fill="#d4a574" fontSize="9">
                                  {topPlayers[2].total_correct_answers} {t('dailyWinners.correctAnswers')}
                                </text>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* 4-10th Place - Original List Design */}
                        {topPlayers.slice(3).length > 0 && (
                          <div className="space-y-2">
                            {topPlayers.slice(3).map((player, index) => {
                              const actualRank = index + 4;
                              
                              return (
                                <div
                                  key={player.user_id}
                                  className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/20"
                                >
                                  {/* Medal */}
                                  <div className="flex-shrink-0 text-2xl">
                                    🏅
                                  </div>

                                  {/* Player Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-white truncate">
                                      {player.username}
                                    </p>
                                    <p className="text-xs text-gray-300">
                                      {player.total_correct_answers} {t('dailyWinners.correctAnswers')}
                                    </p>
                                  </div>

                                  {/* Rank Number */}
                                  <div className="flex-shrink-0 text-xl font-bold text-yellow-400">
                                    #{player.rank}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-center w-full" style={{ height: '60px' }}>
                    <HexAcceptButton
                      onClick={onClose}
                      style={{ width: '100%', maxWidth: '300px' }}
                    >
                      {t('dailyWinners.close')}
                    </HexAcceptButton>
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
