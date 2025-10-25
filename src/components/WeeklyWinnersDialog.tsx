import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';

interface WeeklyWinnersDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TopPlayer {
  rank: number;
  username: string;
  avatar_url: string | null;
  total_correct_answers: number;
}

export const WeeklyWinnersDialog = ({ open, onClose }: WeeklyWinnersDialogProps) => {
  const [contentVisible, setContentVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const confettiCount = isMobile ? 25 : 50;

  useEffect(() => {
    const handleResize = () => {
      try {
        setIsMobile(window.innerWidth <= 768);
      } catch {}
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (open) {
      fetchTopPlayers();
      const t = setTimeout(() => setContentVisible(true), 10);
      return () => {
        clearTimeout(t);
        setContentVisible(false);
      };
    } else {
      setContentVisible(false);
    }
  }, [open]);

  const fetchTopPlayers = async () => {
    try {
      // Get current week start
      const { data: weekData } = await supabase.rpc('get_current_week_start');
      if (!weekData) return;

      const currentWeekStart = weekData as string;

      // Fetch top 10 players from weekly_rankings for the current week
      const { data: rankings } = await supabase
        .from('weekly_rankings')
        .select('user_id, rank, total_correct_answers')
        .eq('week_start', currentWeekStart)
        .order('rank', { ascending: true })
        .limit(10);

      if (!rankings || rankings.length === 0) return;

      // Fetch user profiles for these players
      const userIds = rankings.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (!profiles) return;

      // Combine rankings with profiles
      const players: TopPlayer[] = rankings.map(ranking => {
        const profile = profiles.find(p => p.id === ranking.user_id);
        return {
          rank: ranking.rank,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          total_correct_answers: ranking.total_correct_answers
        };
      });

      setTopPlayers(players);
    } catch (error) {
      console.error('[WEEKLY-WINNERS] Error fetching top players:', error);
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
          maxHeight: '100vh',
          minHeight: '100vh',
          borderRadius: 0
        }}
      >
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ 
            minHeight: '100vh', 
            minWidth: '100vw'
          }}
        >
          {/* Confetti explosions - firework-like animations */}
          {contentVisible && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(confettiCount)].map((_, i) => {
                const delay = Math.random() * 2;
                const duration = 0.8 + Math.random() * 0.5;
                const startX = 20 + Math.random() * 60;
                const startY = 20 + Math.random() * 60;
                const explodeDistance = 50 + Math.random() * 100;
                const angle = Math.random() * 360;
                const moveX = Math.cos(angle * Math.PI / 180) * explodeDistance;
                const moveY = Math.sin(angle * Math.PI / 180) * explodeDistance;
                const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F59E0B', '#EC4899'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${startX}%`,
                      top: `${startY}%`,
                      animation: `confettiExplosion${i} ${duration}s ease-out ${delay}s infinite`,
                      zIndex: 3
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <style>{`
                      @keyframes confettiExplosion${i} {
                        0% { 
                          transform: translate(0, 0) scale(0) rotate(0deg);
                          opacity: 0;
                        }
                        10% { 
                          transform: translate(0, 0) scale(1.5) rotate(0deg);
                          opacity: 1;
                        }
                        100% { 
                          transform: translate(${moveX}px, ${moveY}px) scale(0) rotate(${angle * 2}deg);
                          opacity: 0;
                        }
                      }
                    `}</style>
                  </div>
                );
              })}
            </div>
          )}

          {/* ZOOM WRAPPER - Pulzáló lila fénysugár háttér */}
          <div 
            className="relative z-10"
            style={{ 
              transform: contentVisible ? 'scale(1)' : 'scale(0)',
              opacity: contentVisible ? 1 : 0,
              transition: 'transform 1.125s cubic-bezier(0.34, 1.56, 0.64, 1) 0ms, opacity 1.125s ease-in-out 0ms',
              transformOrigin: 'center center',
              willChange: contentVisible ? 'transform, opacity' : 'auto',
            }}
          >
            {/* Pulzáló lila fénysugár háttér */}
            <div 
              className="absolute -inset-12"
              style={{
                background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(168,85,247,0.4) 0%, rgba(147,51,234,0.2) 40%, transparent 70%)',
                filter: 'blur(40px)',
                animation: 'winnersShieldGlow 2s ease-in-out infinite',
                zIndex: -1,
                pointerEvents: 'none'
              }}
            ></div>
            <style>{`
              @keyframes winnersShieldGlow {
                0%, 100% { 
                  filter: blur(40px) brightness(1);
                  opacity: 0.6;
                }
                50% { 
                  filter: blur(50px) brightness(1.3);
                  opacity: 1;
                }
              }
            `}</style>

            <HexShieldFrame showShine={true}>
              {/* Premium BEST PLAYERS badge - 3D LILA/RÓZSASZÍN */}
              <div 
                className="relative -mt-12 mb-4 mx-auto z-20" 
                style={{ width: '80%' }}
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
                       background: 'linear-gradient(135deg, hsl(280, 70%, 50%), hsl(300, 70%, 60%) 50%, hsl(280, 70%, 40%))',
                       boxShadow: 'inset 0 0 0 2px hsl(280, 60%, 30%), 0 6px 16px rgba(0,0,0,0.35)'
                     }} />
                
                <div className="absolute inset-[3px]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                       background: 'linear-gradient(180deg, hsl(290, 80%, 70%), hsl(280, 75%, 60%) 40%, hsl(270, 70%, 50%))',
                       boxShadow: 'inset 0 1px 0 hsl(300, 80%, 80%)'
                     }} />
                
                <div className="relative px-[5vw] py-[1.2vh]"
                     style={{
                       clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                     }}>
                  <div className="absolute inset-[6px]"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(290, 100% 85%) 0%, hsl(285, 95% 70%) 30%, hsl(280, 90% 58%) 60%, hsl(275, 85% 45%) 100%)',
                         boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.25), inset 0 -12px 24px rgba(0,0,0,0.4)'
                       }} />
                  
                  <div className="absolute inset-[6px] pointer-events-none"
                       style={{
                         clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                         background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.08) 8px, rgba(255,255,255,0.08) 12px, transparent 12px, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 24px)',
                         opacity: 0.7
                       }} />
                  
                  <div className="absolute inset-[6px] pointer-events-none" style={{
                    clipPath: 'path("M 12% 0 L 88% 0 L 100% 50% L 88% 100% L 12% 100% L 0 50% Z")',
                    background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.6), transparent 60%)'
                  }} />
                  
                  <h1 className="relative z-10 font-black text-white text-center drop-shadow-[0_0_18px_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.9)]"
                      style={{ 
                        fontSize: 'clamp(1.25rem, 5.2cqw, 2.1rem)', 
                        letterSpacing: '0.05em',
                        textShadow: '0 0 12px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.9)'
                      }}>
                    BEST PLAYERS
                  </h1>
                </div>
              </div>

              {/* Content - Player List */}
              <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[8%] pb-[8%] pt-[2%]">
                
                {/* Players List */}
                <div className="w-full max-w-[90%] space-y-2 mb-4 overflow-y-auto max-h-[50vh]">
                  {topPlayers.map((player, index) => (
                    <div 
                      key={index}
                      className="relative"
                      style={{
                        animation: `fadeInUp ${0.3 + index * 0.1}s ease-out ${index * 0.05}s both`
                      }}
                    >
                      {/* 3D Card Shadow */}
                      <div className="absolute inset-0 translate-y-1 translate-x-1 bg-black/40 rounded-xl blur-sm" />
                      
                      {/* 3D Card Border - Purple/Pink gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 rounded-xl" 
                           style={{ boxShadow: 'inset 0 0 0 2px hsl(280, 60%, 40%), 0 4px 12px rgba(0,0,0,0.3)' }} />
                      
                      {/* 3D Card Inner Layer */}
                      <div className="absolute inset-[2px] bg-gradient-to-b from-purple-400 via-pink-400 to-purple-500 rounded-xl"
                           style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }} />
                      
                      {/* Card Content */}
                      <div className="relative bg-gradient-to-br from-purple-500/95 via-pink-500/95 to-purple-600/95 rounded-xl px-3 py-2.5 flex items-center gap-3"
                           style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }}>
                        
                        {/* Rank Number - Left */}
                        <div className="flex-shrink-0 w-8 text-center">
                          <span className="font-black text-white drop-shadow-lg" 
                                style={{ 
                                  fontSize: 'clamp(1rem, 4cqw, 1.5rem)',
                                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                }}>
                            {player.rank}
                          </span>
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {player.avatar_url ? (
                            <img 
                              src={player.avatar_url} 
                              alt={player.username}
                              className="w-12 h-12 rounded-full border-4 border-white shadow-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Username */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate drop-shadow-md" 
                             style={{ 
                               fontSize: 'clamp(0.85rem, 3.5cqw, 1.1rem)',
                               textShadow: '0 2px 4px rgba(0,0,0,0.7)'
                             }}>
                            {player.username}
                          </p>
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0">
                          <p className="font-black text-yellow-200 drop-shadow-md" 
                             style={{ 
                               fontSize: 'clamp(0.9rem, 3.8cqw, 1.2rem)',
                               textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                             }}>
                            {player.total_correct_answers.toLocaleString()}
                          </p>
                        </div>

                        {/* Gift Icon */}
                        <div className="flex-shrink-0">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
                            <defs>
                              <linearGradient id={`giftGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="50%" stopColor="#FFA500" />
                                <stop offset="100%" stopColor="#FFD700" />
                              </linearGradient>
                            </defs>
                            <rect x="4" y="10" width="16" height="11" rx="1" fill={`url(#giftGrad${index})`} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5"/>
                            <rect x="4.5" y="10.5" width="15" height="1.5" fill="rgba(255,255,255,0.3)"/>
                            <rect x="11" y="10" width="2" height="11" fill="rgba(220,38,38,0.9)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3"/>
                            <rect x="4" y="13" width="16" height="2" fill="rgba(220,38,38,0.9)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3"/>
                            <circle cx="9" cy="8" r="2" fill="rgba(220,38,38,0.9)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3"/>
                            <circle cx="15" cy="8" r="2" fill="rgba(220,38,38,0.9)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3"/>
                            <circle cx="12" cy="7" r="1.5" fill="rgba(220,38,38,1)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <style>{`
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(20px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>

                {/* Bottom Text - Instead of button */}
                <div className="mt-auto pt-4">
                  <p className="text-center text-yellow-100 font-bold px-4 py-3 rounded-xl"
                     style={{
                       fontSize: 'clamp(0.85rem, 3.8cqw, 1.1rem)',
                       textShadow: '0 2px 6px rgba(0,0,0,0.8)',
                       background: 'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(168,85,247,0.3) 100%)',
                       boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.2), inset 0 -2px 8px rgba(0,0,0,0.3)',
                       border: '2px solid rgba(255,215,0,0.4)'
                     }}>
                    Ha nem vagy a listán, se baj,<br/>remélem jövő héten találkozunk!
                  </p>
                </div>

                {/* Close button (X) - Small, top right */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white font-bold transition-all border-2 border-yellow-400 shadow-lg z-30"
                  style={{
                    fontSize: '1.5rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  ×
                </button>
              </div>
            </HexShieldFrame>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};