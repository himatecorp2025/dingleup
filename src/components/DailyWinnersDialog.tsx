import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';
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
  const [isMobile, setIsMobile] = useState(false);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const confettiCount = isMobile ? 25 : 50;

  const listRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState<number | undefined>(undefined);
  const measureList = () => {
    try {
      const list = listRef.current;
      if (!list) return;
      const first = list.querySelector('[data-row-index="0"]') as HTMLElement | null;
      const second = list.querySelector('[data-row-index="1"]') as HTMLElement | null;
      if (!first) return;
      const rowH = first.offsetHeight;
      const gap = second ? parseFloat(getComputedStyle(second).marginTop || '6') : 6;
      setListHeight(Math.max(0, Math.round((rowH * 7 + gap * 6) * 1.04) - 8));
    } catch {}
  };

  useEffect(() => {
    const handleResize = () => {
      try {
        setIsMobile(window.innerWidth <= 768);
        measureList();
      } catch {}
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (open) {
      fetchYesterdayTopPlayers();
      const t = setTimeout(() => {
        setContentVisible(true);
        measureList();
      }, 10);
      
      return () => {
        clearTimeout(t);
        setContentVisible(false);
      };
    } else {
      setContentVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (!contentVisible) return;
    measureList();
  }, [topPlayers, contentVisible]);

  const fetchYesterdayTopPlayers = async () => {
    try {
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      console.log('[DAILY-WINNERS] Fetching yesterday winners for:', yesterdayDate);

      // Fetch from daily_leaderboard_snapshot for yesterday
      const { data, error } = await supabase
        .from('daily_leaderboard_snapshot' as any)
        .select('user_id, username, total_correct_answers, avatar_url, rank')
        .eq('snapshot_date', yesterdayDate)
        .order('rank', { ascending: true })
        .limit(10);

      if (error) {
        console.error('[DAILY-WINNERS] Error fetching yesterday winners:', error);
        // Fallback to empty array
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
        overlayClassName="bg-transparent backdrop-blur-none"
        className="overflow-hidden p-0 border-0 bg-transparent w-screen h-screen max-w-none rounded-none [&>button[data-dialog-close]]:hidden"
        style={{ 
          margin: 0,
          maxHeight: '100dvh',
          minHeight: '100dvh',
          borderRadius: 0
        }}
      >
        <DialogTitle className="sr-only">Tegnapi Nyertesek</DialogTitle>
        <DialogDescription className="sr-only">TOP 10 tegnapi nyertesek listája</DialogDescription>
        
        <div 
          className="relative w-full h-full overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0a0015 0%, #1a0033 50%, #0f0033 100%)',
          }}
        >
          {/* Animated background orbs */}
          {Array.from({ length: confettiCount }).map((_, i) => {
            const size = Math.random() * 150 + 50;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 5;
            const duration = Math.random() * 10 + 10;
            const colors = ['rgba(255,20,147,0.15)', 'rgba(138,43,226,0.15)', 'rgba(75,0,130,0.15)', 'rgba(0,191,255,0.15)'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            return (
              <div
                key={i}
                className="absolute rounded-full blur-3xl animate-pulse"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  top: `${top}%`,
                  background: color,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  opacity: contentVisible ? 1 : 0,
                  transition: 'opacity 0.8s ease-in-out'
                }}
              />
            );
          })}

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-start w-full h-full px-4 pt-8 pb-20 overflow-y-auto">
            {/* Title Badge */}
            <div 
              ref={headerRef}
              className="relative mb-6"
              style={{
                opacity: contentVisible ? 1 : 0,
                transform: contentVisible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.9)',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className="relative px-8 py-4 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-2xl blur-xl animate-pulse" />
                <h2 className="relative text-2xl md:text-3xl font-bold text-white text-center tracking-wider drop-shadow-lg">
                  🏆 {t('dailyWinners.title')} 🏆
                </h2>
              </div>
            </div>

            {/* Players List */}
            <div 
              ref={listRef}
              className="w-full max-w-2xl space-y-2"
              style={{
                maxHeight: listHeight ? `${listHeight}px` : 'auto',
                opacity: contentVisible ? 1 : 0,
                transform: contentVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s'
              }}
            >
              {topPlayers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-lg">{t('dailyWinners.noData')}</p>
                </div>
              ) : (
                topPlayers.map((player, index) => {
                  const delay = index * 0.08;
                  const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
                  
                  return (
                    <div
                      key={player.user_id}
                      data-row-index={index}
                      className="relative"
                      style={{
                        opacity: contentVisible ? 1 : 0,
                        transform: contentVisible ? 'translateX(0)' : 'translateX(-30px)',
                        transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`
                      }}
                    >
                      <HexShieldFrame className="w-full">
                        <div className="flex items-center gap-4 px-6 py-4">
                          {/* Rank Badge */}
                          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-white font-bold text-xl shadow-lg">
                            {medalEmoji}
                          </div>

                          {/* Player Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-bold text-foreground truncate">
                              {player.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {player.total_correct_answers} {t('dailyWinners.correctAnswers')}
                            </p>
                          </div>

                          {/* Rank Number */}
                          <div className="flex-shrink-0 text-2xl font-bold text-accent">
                            #{player.rank}
                          </div>
                        </div>
                      </HexShieldFrame>
                    </div>
                  );
                })
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="mt-8 px-12 py-4 bg-gradient-to-r from-accent via-primary to-accent text-white text-xl font-bold rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
              style={{
                opacity: contentVisible ? 1 : 0,
                transform: contentVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s'
              }}
            >
              {t('dailyWinners.close')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
