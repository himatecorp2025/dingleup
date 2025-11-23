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

      console.log('[DAILY-WINNERS] Fetching yesterday winners for:', yesterdayDate, 'country:', userCountry);

      // Fetch from daily_leaderboard_snapshot for yesterday (country-specific)
      const { data, error } = await supabase
        .from('daily_leaderboard_snapshot' as any)
        .select('user_id, username, total_correct_answers, avatar_url, rank')
        .eq('snapshot_date', yesterdayDate)
        .eq('country_code', userCountry)
        .order('rank', { ascending: true })
        .limit(10);

      if (error) {
        console.error('[DAILY-WINNERS] Error fetching yesterday winners:', error);
        setTopPlayers([]);
        return;
      }

      const rankedData = (data || []).map((entry: any) => ({
        user_id: entry.user_id,
        username: entry.username,
        total_correct_answers: entry.total_correct_answers || 0,
        avatar_url: entry.avatar_url,
        rank: entry.rank
      }));

      setTopPlayers(rankedData as TopPlayer[]);
      console.log('[DAILY-WINNERS] Loaded yesterday TOP 10:', rankedData.length, 'players');
    } catch (error) {
      console.error('[DAILY-WINNERS] Exception fetching yesterday winners:', error);
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

          {/* Bezáró X */}
          <button
            onClick={onClose}
            aria-label="Bezárás"
            className="absolute z-[10001] rounded-full text-white/80 hover:text-white bg-black/30 hover:bg-black/50 transition-all flex items-center justify-center"
            style={{
              top: "max(1vh, env(safe-area-inset-top))",
              right: "max(1vh, env(safe-area-inset-right))",
              width: "clamp(36px, 8svw, 48px)",
              height: "clamp(36px, 8svw, 48px)",
              fontSize: "clamp(18px, 5svw, 28px)",
              lineHeight: 1,
            }}
          >
            ×
          </button>

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
                    
                    <h1 className="relative z-10 font-black text-foreground text-center drop-shadow-[0_0_18px_hsl(var(--foreground)/0.3),0_2px_8px_rgba(0,0,0,0.9)]"
                        style={{ 
                          fontSize: 'clamp(1.25rem, 5.2vw, 2.1rem)', 
                          letterSpacing: '0.05em',
                          textShadow: '0 0 12px rgba(255,255,255,0.25)'
                        }}>
                      {t('dailyWinners.title')}
                    </h1>
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[8%] pb-[8%] pt-[2%]">
                  
                  {/* Players List */}
                  <div className="w-full space-y-3 mb-6 max-h-[50vh] overflow-y-auto">
                    {topPlayers.length === 0 ? (
                      <div className="text-center text-white py-8">
                        <p className="text-lg">{t('dailyWinners.noData')}</p>
                      </div>
                    ) : (
                      topPlayers.map((player, index) => {
                        const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
                        
                        return (
                          <div
                            key={player.user_id}
                            className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/20"
                          >
                            {/* Medal */}
                            <div className="flex-shrink-0 text-3xl">
                              {medalEmoji}
                            </div>

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-lg font-bold text-white truncate">
                                {player.username}
                              </p>
                              <p className="text-sm text-gray-300">
                                {player.total_correct_answers} {t('dailyWinners.correctAnswers')}
                              </p>
                            </div>

                            {/* Rank Number */}
                            <div className="flex-shrink-0 text-2xl font-bold text-yellow-400">
                              #{player.rank}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-center w-full">
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
