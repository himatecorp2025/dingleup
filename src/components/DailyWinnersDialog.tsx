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
                {/* Top Hex Badge - "TEGNAPI TOP 10" */}
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
                <div className="relative z-10 flex flex-col items-center justify-between px-[8%] pb-[6%]" style={{ height: 'calc(100% - 60px)', paddingTop: '0' }}>
                  
                  {/* Players List */}
                  <div className="w-full mb-4 overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
                    {topPlayers.length === 0 ? (
                      <div className="text-center text-white py-8">
                        <p className="text-lg">{t('dailyWinners.noData')}</p>
                      </div>
                    ) : (
                      <>
                        {/* TOP 3 - Horizontal Layout with Realistic Laurel Wreaths */}
                        <div className="flex justify-center items-end gap-2 mb-4 px-1 -mt-3">
                          {/* 2nd Place - Silver */}
                          {topPlayers[1] && (
                            <div className="flex flex-col items-center relative" style={{ width: '30%' }}>
                              <div className="relative w-full" style={{ aspectRatio: '744.09/1052.36' }}>
                                {/* Background wreath - Silver */}
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: `url(${laurelWreathGold})`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    filter: 'grayscale(1) brightness(1.3) contrast(0.9)'
                                  }}
                                />
                                {/* Avatar in center */}
                                <div className="absolute" style={{ left: '19.5%', top: '18%', width: '63%', height: '45%' }}>
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    {/* 3D Silver Border Effect */}
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'linear-gradient(135deg, #f0f0f0 0%, #d0d0d0 25%, #b8b8b8 50%, #a0a0a0 75%, #c8c8c8 100%)',
                                      boxShadow: '0 8px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)'
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
                                {/* Rank badge at bottom - 3D Effect */}
                                <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                  <div className="aspect-square rounded-full relative">
                                    {/* Outer shadow */}
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e0e0e0 30%, #b0b0b0 60%, #888888 100%)',
                                      boxShadow: '0 6px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)'
                                    }} />
                                    {/* Inner highlight ring */}
                                    <div className="absolute inset-[3px] rounded-full" style={{
                                      background: 'linear-gradient(135deg, #f8f8f8 0%, #d8d8d8 50%, #a8a8a8 100%)',
                                      boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.7), inset 0 -2px 6px rgba(0,0,0,0.4)'
                                    }} />
                                    {/* Number container */}
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
                              {/* Username below wreath */}
                              <div className="text-center w-full" style={{ marginTop: '-4px' }}>
                                <p className="text-white font-bold text-[0.65rem] leading-none truncate px-1">
                                  {topPlayers[1].username}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 1st Place - Gold (larger) */}
                          {topPlayers[0] && (
                            <div className="flex flex-col items-center relative" style={{ width: '36%' }}>
                              <div className="relative w-full" style={{ aspectRatio: '744.09/1052.36' }}>
                                {/* Background wreath - Gold (exact user SVG) */}
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: `url(${laurelWreathGold})`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                  }}
                                />
                                {/* Avatar in center */}
                                <div className="absolute" style={{ left: '19.5%', top: '18%', width: '63%', height: '45%' }}>
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    {/* 3D Gold Border Effect */}
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
                                {/* Rank badge at bottom - 3D Effect */}
                                <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                  <div className="aspect-square rounded-full relative">
                                    {/* Outer shadow */}
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'radial-gradient(circle at 30% 30%, #fffacd 0%, #ffd700 30%, #ffb700 60%, #d4af37 100%)',
                                      boxShadow: '0 6px 12px rgba(218,165,32,0.6), 0 2px 4px rgba(0,0,0,0.3)'
                                    }} />
                                    {/* Inner highlight ring */}
                                    <div className="absolute inset-[3px] rounded-full" style={{
                                      background: 'linear-gradient(135deg, #fff9c4 0%, #ffd700 50%, #d4af37 100%)',
                                      boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -2px 6px rgba(139,69,0,0.5)'
                                    }} />
                                    {/* Number container */}
                                    <div className="absolute inset-[6px] rounded-full flex items-center justify-center" style={{
                                      background: 'radial-gradient(circle at 35% 35%, #fffacd 0%, #ffd700 40%, #d4af37 100%)',
                                      boxShadow: 'inset 0 1px 3px rgba(255,255,255,1), inset 0 -1px 3px rgba(139,69,0,0.3)'
                                    }}>
                                      <span className="font-black relative" style={{ 
                                        fontSize: '3.8vw',
                                        background: 'linear-gradient(180deg, #333333 0%, #000000 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        filter: 'drop-shadow(0 1px 1px rgba(255,215,0,0.5))'
                                      }}>1</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Username below wreath */}
                              <div className="text-center w-full" style={{ marginTop: '-4px' }}>
                                <p className="text-white font-bold text-[0.7rem] leading-none truncate px-1">
                                  {topPlayers[0].username}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 3rd Place - Bronze */}
                          {topPlayers[2] && (
                            <div className="flex flex-col items-center relative" style={{ width: '30%' }}>
                              <div className="relative w-full" style={{ aspectRatio: '744.09/1052.36' }}>
                                {/* Background wreath - Bronze */}
                                <div 
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: `url(${laurelWreathGold})`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    filter: 'hue-rotate(-30deg) saturate(0.8) brightness(0.9)'
                                  }}
                                />
                                {/* Avatar in center */}
                                <div className="absolute" style={{ left: '19.5%', top: '18%', width: '63%', height: '45%' }}>
                                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    {/* 3D Bronze Border Effect */}
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'linear-gradient(135deg, #cd7f32 0%, #e89757 25%, #b5651d 50%, #8b4513 75%, #cd7f32 100%)',
                                      boxShadow: '0 8px 16px rgba(139,69,19,0.5), inset 0 2px 4px rgba(255,200,150,0.6), inset 0 -2px 4px rgba(80,40,10,0.4)'
                                    }} />
                                    <div className="absolute inset-[6px] rounded-full overflow-hidden">
                                      {topPlayers[2].avatar_url ? (
                                        <img 
                                          src={topPlayers[2].avatar_url} 
                                          alt={topPlayers[2].username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-orange-400 font-bold text-2xl bg-gray-800">
                                          {topPlayers[2].username.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Rank badge at bottom - 3D Effect */}
                                <div className="absolute" style={{ left: '38%', bottom: '10%', width: '24%' }}>
                                  <div className="aspect-square rounded-full relative">
                                    {/* Outer shadow */}
                                    <div className="absolute inset-0 rounded-full" style={{
                                      background: 'radial-gradient(circle at 30% 30%, #ffb347 0%, #cd7f32 30%, #b5651d 60%, #8b4513 100%)',
                                      boxShadow: '0 6px 12px rgba(139,69,19,0.5), 0 2px 4px rgba(0,0,0,0.3)'
                                    }} />
                                    {/* Inner highlight ring */}
                                    <div className="absolute inset-[3px] rounded-full" style={{
                                      background: 'linear-gradient(135deg, #e89757 0%, #cd7f32 50%, #8b4513 100%)',
                                      boxShadow: 'inset 0 2px 6px rgba(255,200,150,0.7), inset 0 -2px 6px rgba(80,40,10,0.5)'
                                    }} />
                                    {/* Number container */}
                                    <div className="absolute inset-[6px] rounded-full flex items-center justify-center" style={{
                                      background: 'radial-gradient(circle at 35% 35%, #ffb347 0%, #cd7f32 40%, #8b4513 100%)',
                                      boxShadow: 'inset 0 1px 3px rgba(255,200,150,0.8), inset 0 -1px 3px rgba(80,40,10,0.3)'
                                    }}>
                                      <span className="font-black relative" style={{ 
                                        fontSize: '3.5vw',
                                        color: '#ffffff',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 3px rgba(255,180,70,0.3)'
                                      }}>3</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Username below wreath */}
                              <div className="text-center w-full" style={{ marginTop: '-4px' }}>
                                <p className="text-white font-bold text-[0.65rem] leading-none truncate px-1">
                                  {topPlayers[2].username}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Players 4-10 - Ranked List */}
                        <div className="space-y-2">
                          {topPlayers.slice(3).map((player) => (
                            <div 
                              key={player.user_id} 
                              className="flex items-center justify-between bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-white font-bold text-lg flex-shrink-0 w-6">
                                  {player.rank}
                                </span>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                                  {player.avatar_url ? (
                                    <img 
                                      src={player.avatar_url} 
                                      alt={player.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                      {player.username.substring(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span className="text-white font-medium text-sm truncate flex-1">
                                  {player.username}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Accept Button */}
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
