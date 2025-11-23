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
                        <div className="flex justify-center items-end gap-4 mb-6 px-2">
                          {/* 2nd Place - Silver */}
                          {topPlayers[1] && (
                            <div className="flex flex-col items-center" style={{ width: '28%' }}>
                              <svg viewBox="0 0 120 140" className="w-full">
                                {/* Silver Laurel Wreath */}
                                <defs>
                                  <radialGradient id="silverGrad" cx="50%" cy="50%">
                                    <stop offset="0%" style={{ stopColor: '#f0f0f0', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#c0c0c0', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#909090', stopOpacity: 1 }} />
                                  </radialGradient>
                                </defs>
                                {/* Wreath circle */}
                                <circle cx="60" cy="50" r="35" fill="url(#silverGrad)" stroke="#707070" strokeWidth="2" />
                                <circle cx="60" cy="50" r="32" fill="none" stroke="#e0e0e0" strokeWidth="1.5" opacity="0.6" />
                                
                                {/* Laurel leaves - left side */}
                                <path d="M 30,35 Q 25,40 30,45" fill="#b0b0b0" stroke="#909090" strokeWidth="1"/>
                                <path d="M 28,42 Q 23,47 28,52" fill="#b0b0b0" stroke="#909090" strokeWidth="1"/>
                                <path d="M 26,50 Q 21,55 26,60" fill="#b0b0b0" stroke="#909090" strokeWidth="1"/>
                                
                                {/* Laurel leaves - right side */}
                                <path d="M 90,35 Q 95,40 90,45" fill="#b0b0b0" stroke="#909090" strokeWidth="1"/>
                                <path d="M 92,42 Q 97,47 92,52" fill="#b0b0b0" stroke="#909090" strokeWidth="1"/>
                                <path d="M 94,50 Q 99,55 94,60" fill="#b0b0b0" stroke="#909090" strokeWidth="1"/>
                                
                                {/* Rank number */}
                                <text x="60" y="58" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">2</text>
                                
                                {/* Username */}
                                <text x="60" y="90" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                                  {topPlayers[1].username.length > 12 ? topPlayers[1].username.substring(0, 12) + '...' : topPlayers[1].username}
                                </text>
                                
                                {/* Correct answers */}
                                <text x="60" y="105" textAnchor="middle" fill="#e0e0e0" fontSize="8">
                                  {topPlayers[1].total_correct_answers} {t('dailyWinners.correctAnswers')}
                                </text>
                              </svg>
                            </div>
                          )}

                          {/* 1st Place - Gold (larger) */}
                          {topPlayers[0] && (
                            <div className="flex flex-col items-center" style={{ width: '36%' }}>
                              <svg viewBox="0 0 120 150" className="w-full">
                                {/* Gold Laurel Wreath */}
                                <defs>
                                  <radialGradient id="goldGrad" cx="50%" cy="50%">
                                    <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#ffb700', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#cc8800', stopOpacity: 1 }} />
                                  </radialGradient>
                                </defs>
                                {/* Wreath circle */}
                                <circle cx="60" cy="55" r="40" fill="url(#goldGrad)" stroke="#cc8800" strokeWidth="2.5" />
                                <circle cx="60" cy="55" r="37" fill="none" stroke="#ffe44d" strokeWidth="2" opacity="0.7" />
                                
                                {/* Laurel leaves - left side */}
                                <path d="M 25,38 Q 20,43 25,48" fill="#e6b800" stroke="#cc9900" strokeWidth="1.2"/>
                                <path d="M 23,46 Q 18,51 23,56" fill="#e6b800" stroke="#cc9900" strokeWidth="1.2"/>
                                <path d="M 21,54 Q 16,59 21,64" fill="#e6b800" stroke="#cc9900" strokeWidth="1.2"/>
                                <path d="M 23,62 Q 18,67 23,72" fill="#e6b800" stroke="#cc9900" strokeWidth="1.2"/>
                                
                                {/* Laurel leaves - right side */}
                                <path d="M 95,38 Q 100,43 95,48" fill="#e6b800" stroke="#cc9900" strokeWidth="1.2"/>
                                <path d="M 97,46 Q 102,51 97,56" fill="#e6b800" stroke="#cc9900" strokeWidth="1.2"/>
                                <path d="M 99,54 Q 104,59 99,64" fill="#e6b800" stroke="#cc9900" strokeWidth="1.2"/>
                                <path d="M 97,62 Q 102,67 97,72" fill="#e6b800" stroke="#cc9900" strokeWidth="1.2"/>
                                
                                {/* Rank number */}
                                <text x="60" y="63" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="bold" stroke="#cc8800" strokeWidth="0.5">1</text>
                                
                                {/* Username */}
                                <text x="60" y="100" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                                  {topPlayers[0].username.length > 12 ? topPlayers[0].username.substring(0, 12) + '...' : topPlayers[0].username}
                                </text>
                                
                                {/* Correct answers */}
                                <text x="60" y="116" textAnchor="middle" fill="#ffd700" fontSize="9" fontWeight="bold">
                                  {topPlayers[0].total_correct_answers} {t('dailyWinners.correctAnswers')}
                                </text>
                              </svg>
                            </div>
                          )}

                          {/* 3rd Place - Bronze */}
                          {topPlayers[2] && (
                            <div className="flex flex-col items-center" style={{ width: '28%' }}>
                              <svg viewBox="0 0 120 140" className="w-full">
                                {/* Bronze Laurel Wreath */}
                                <defs>
                                  <radialGradient id="bronzeGrad" cx="50%" cy="50%">
                                    <stop offset="0%" style={{ stopColor: '#e89b5a', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#cd7f32', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#8b5a2b', stopOpacity: 1 }} />
                                  </radialGradient>
                                </defs>
                                {/* Wreath circle */}
                                <circle cx="60" cy="50" r="35" fill="url(#bronzeGrad)" stroke="#8b5a2b" strokeWidth="2" />
                                <circle cx="60" cy="50" r="32" fill="none" stroke="#d4a574" strokeWidth="1.5" opacity="0.6" />
                                
                                {/* Laurel leaves - left side */}
                                <path d="M 30,35 Q 25,40 30,45" fill="#b8793e" stroke="#8b5a2b" strokeWidth="1"/>
                                <path d="M 28,42 Q 23,47 28,52" fill="#b8793e" stroke="#8b5a2b" strokeWidth="1"/>
                                <path d="M 26,50 Q 21,55 26,60" fill="#b8793e" stroke="#8b5a2b" strokeWidth="1"/>
                                
                                {/* Laurel leaves - right side */}
                                <path d="M 90,35 Q 95,40 90,45" fill="#b8793e" stroke="#8b5a2b" strokeWidth="1"/>
                                <path d="M 92,42 Q 97,47 92,52" fill="#b8793e" stroke="#8b5a2b" strokeWidth="1"/>
                                <path d="M 94,50 Q 99,55 94,60" fill="#b8793e" stroke="#8b5a2b" strokeWidth="1"/>
                                
                                {/* Rank number */}
                                <text x="60" y="58" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">3</text>
                                
                                {/* Username */}
                                <text x="60" y="90" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                                  {topPlayers[2].username.length > 12 ? topPlayers[2].username.substring(0, 12) + '...' : topPlayers[2].username}
                                </text>
                                
                                {/* Correct answers */}
                                <text x="60" y="105" textAnchor="middle" fill="#d4a574" fontSize="8">
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
