import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
import HexAcceptButton from './ui/HexAcceptButton';
import { useI18n } from '@/i18n/useI18n';
import { Coins, Heart } from 'lucide-react';

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
  gold_awarded?: number;
  lives_awarded?: number;
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

    } catch (error) {
      console.error('[DAILY-WINNERS] Exception fetching yesterday TOP 10:', error);
      setTopPlayers([]);
    }
  };

  if (!open) return null;

  // Calculate totals
  const totalGold = topPlayers.reduce((sum, p) => sum + (p.gold_awarded || 0), 0);
  const totalLives = topPlayers.reduce((sum, p) => sum + (p.lives_awarded || 0), 0);

  const top3 = topPlayers.slice(0, 3);
  const rest = topPlayers.slice(3);

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
                {/* CASINO-STYLE HEADER with Badge and Stats */}
                <div className="relative -mt-12 mb-6 flex items-start justify-between gap-4 px-[8%]">
                  {/* LEFT: Casino-style Badge */}
                  <div 
                    ref={badgeRef}
                    className="relative flex-shrink-0 animate-pulse" 
                    style={{ width: '55%' }}
                  >
                    {/* Shadow layer */}
                    <div className="absolute inset-0 translate-y-2 translate-x-2"
                         style={{
                           clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                           background: 'rgba(0,0,0,0.6)',
                           filter: 'blur(8px)',
                           zIndex: -1
                         }} />
                    
                    {/* Outer gold frame with glow */}
                    <div className="absolute inset-0 animate-shimmer"
                         style={{
                           clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                           background: 'linear-gradient(135deg, hsl(45 100% 60%), hsl(45 100% 75%) 25%, hsl(45 100% 90%) 50%, hsl(45 100% 75%) 75%, hsl(45 100% 60%))',
                           boxShadow: '0 0 20px hsl(45 100% 60%), inset 0 0 0 2px hsl(45 100% 50%)'
                         }} />
                    
                    {/* Inner gradient */}
                    <div className="absolute inset-[4px]"
                         style={{
                           clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                           background: 'linear-gradient(180deg, hsl(0 95% 55%), hsl(0 85% 45%) 50%, hsl(0 75% 35%))',
                           boxShadow: 'inset 0 4px 12px rgba(255,255,255,0.3), inset 0 -4px 12px rgba(0,0,0,0.4)'
                         }} />
                    
                    {/* Content */}
                    <div className="relative px-[4vw] py-[1vh]"
                         style={{
                           clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         }}>
                      {/* Shimmer overlay */}
                      <div className="absolute inset-[6px] pointer-events-none animate-shine"
                           style={{
                             clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                             background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                             backgroundSize: '200% 100%'
                           }} />
                      
                      <h1 className="relative z-10 font-black text-white text-center uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                          style={{ 
                            fontSize: 'clamp(0.9rem, 3.8vw, 1.4rem)', 
                            letterSpacing: '0.1em',
                            textShadow: '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.5)',
                            fontFamily: '"Poppins", system-ui, -apple-system, sans-serif'
                          }}>
                        {t('dailyWinners.title')}
                      </h1>
                    </div>
                  </div>

                  {/* RIGHT: Total Rewards Stats */}
                  <div className="relative flex-1 min-w-0 animate-fade-in" style={{ marginTop: '0.5rem' }}>
                    <div className="relative bg-gradient-to-br from-yellow-500/20 via-amber-600/30 to-orange-700/20 backdrop-blur-sm rounded-2xl p-3 border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/10 to-transparent animate-pulse pointer-events-none" />
                      
                      <div className="relative z-10 space-y-1.5">
                        <p className="text-[0.65rem] font-bold text-yellow-100 text-center uppercase tracking-wider mb-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                          Kiosztott Nyeremények
                        </p>
                        
                        {/* Gold */}
                        <div className="flex items-center justify-center gap-2 bg-black/30 rounded-lg px-2 py-1.5">
                          <Coins className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                          <span className="text-base font-black text-yellow-300" style={{ textShadow: '0 0 8px rgba(234,179,8,0.9), 0 1px 2px rgba(0,0,0,0.8)' }}>
                            {totalGold.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Lives */}
                        <div className="flex items-center justify-center gap-2 bg-black/30 rounded-lg px-2 py-1.5">
                          <Heart className="w-4 h-4 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                          <span className="text-base font-black text-red-300" style={{ textShadow: '0 0 8px rgba(239,68,68,0.9), 0 1px 2px rgba(0,0,0,0.8)' }}>
                            {totalLives}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex flex-col items-center justify-between px-[8%] pb-[6%] pt-[1%]" style={{ height: 'calc(100% - 100px)' }}>
                  
                  {topPlayers.length === 0 ? (
                    <div className="text-center text-white py-8">
                      <p className="text-lg">{t('dailyWinners.noData')}</p>
                    </div>
                  ) : (
                    <>
                      {/* TOP 3 with Laurel Wreaths */}
                      <div className="w-full mb-6 space-y-4">
                        {top3.map((player, index) => {
                          const wreathColors = [
                            { outer: 'from-yellow-500 via-yellow-400 to-yellow-600', inner: 'from-yellow-300 to-yellow-500', glow: 'rgba(234,179,8,0.6)' },
                            { outer: 'from-gray-300 via-gray-200 to-gray-400', inner: 'from-gray-100 to-gray-300', glow: 'rgba(156,163,175,0.6)' },
                            { outer: 'from-orange-600 via-orange-500 to-orange-700', inner: 'from-orange-400 to-orange-600', glow: 'rgba(234,88,12,0.6)' }
                          ];
                          const colors = wreathColors[index];

                          return (
                            <div
                              key={player.user_id}
                              className="relative animate-scale-in"
                              style={{ animationDelay: `${index * 150}ms` }}
                            >
                              {/* Laurel Wreath SVG Background */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: 'scale(1.15)' }}>
                                <div className={`w-full h-full bg-gradient-to-br ${colors.outer} rounded-full opacity-90 animate-pulse`}
                                     style={{ 
                                       clipPath: 'polygon(50% 0%, 60% 20%, 80% 10%, 75% 30%, 95% 40%, 80% 50%, 95% 60%, 75% 70%, 80% 90%, 60% 80%, 50% 100%, 40% 80%, 20% 90%, 25% 70%, 5% 60%, 20% 50%, 5% 40%, 25% 30%, 20% 10%, 40% 20%)',
                                       boxShadow: `0 0 40px ${colors.glow}, inset 0 0 20px rgba(255,255,255,0.4)`
                                     }} />
                              </div>

                              {/* Player Card */}
                              <div className="relative flex items-center gap-4 px-5 py-3 bg-gradient-to-r from-purple-900/40 via-purple-800/50 to-purple-900/40 rounded-2xl border-2 border-yellow-400/60 shadow-[0_0_30px_rgba(234,179,8,0.3)] backdrop-blur-sm">
                                {/* Avatar with glow */}
                                <div className="relative flex-shrink-0">
                                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.inner} rounded-full blur-lg opacity-70 animate-pulse`} />
                                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-2xl font-bold text-white border-2 border-yellow-300 shadow-lg">
                                    {player.avatar_url ? (
                                      <img src={player.avatar_url} alt={player.username} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      player.username.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                </div>

                                {/* Player Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-lg font-black text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 10px rgba(234,179,8,0.5)' }}>
                                    {player.username}
                                  </p>
                                  <p className="text-sm text-yellow-200 font-semibold">
                                    {player.total_correct_answers} {t('dailyWinners.correctAnswers')}
                                  </p>
                                </div>

                                {/* Rank Badge */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${colors.outer} flex items-center justify-center text-2xl font-black text-white border-2 border-white shadow-[0_0_20px_${colors.glow}]`}>
                                  {index + 1}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Rest 4-10 Simple List */}
                      {rest.length > 0 && (
                        <div className="w-full mb-4 space-y-2">
                          {rest.map((player) => (
                            <div
                              key={player.user_id}
                              className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-purple-900/25 to-purple-800/25 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition-all"
                            >
                              {/* Avatar */}
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-sm font-bold text-white border border-purple-400/50">
                                {player.avatar_url ? (
                                  <img src={player.avatar_url} alt={player.username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  player.username.charAt(0).toUpperCase()
                                )}
                              </div>

                              {/* Player Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">
                                  {player.username}
                                </p>
                                <p className="text-xs text-gray-300">
                                  {player.total_correct_answers} {t('dailyWinners.correctAnswers')}
                                </p>
                              </div>

                              {/* Rank */}
                              <div className="flex-shrink-0 text-lg font-bold text-yellow-400">
                                #{player.rank}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Close Button */}
                  <div className="flex justify-center w-full mt-auto">
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
