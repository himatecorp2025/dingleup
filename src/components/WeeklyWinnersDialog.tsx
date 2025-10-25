import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import HexShieldFrame from './frames/HexShieldFrame';

interface WeeklyWinnersDialogProps {
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
      const players: TopPlayer[] = (rankings || []).map((ranking: any) => {
        const profile = profiles.find((p: any) => p.id === ranking.user_id);
        return {
          user_id: ranking.user_id,
          rank: ranking.rank,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          total_correct_answers: ranking.total_correct_answers
        } as TopPlayer;
      }).sort((a: TopPlayer, b: TopPlayer) => a.rank - b.rank);

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
                const colors = ['#FFD700', '#1E40AF', '#7C3AED', '#F59E0B'];
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

          {/* ZOOM WRAPPER - Pulzáló KÉK fénysugár háttér */}
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
            {/* Pulzáló KÉK fénysugár háttér */}
            <div 
              className="absolute -inset-12"
              style={{
                background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(30,64,175,0.4) 0%, rgba(37,99,235,0.2) 40%, transparent 70%)',
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

            {/* Close button (X) - jobb felső sarok, kívül a boxon */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 w-10 h-10 flex items-center justify-center bg-black/70 hover:bg-black/90 rounded-full text-white font-bold transition-all shadow-lg z-50"
              style={{
                fontSize: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              ×
            </button>

            <HexShieldFrame showShine={true}>
              {/* Premium WEEKLY WINNERS badge - ARANY 3D - ugyanaz mint Welcome */}
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
                       background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-600)) 50%, hsl(var(--dup-gold-800)))',
                       boxShadow: 'inset 0 0 0 2px hsl(var(--dup-gold-900)), 0 6px 16px rgba(0,0,0,0.35)'
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
                         background: 'radial-gradient(ellipse 100% 80% at 50% -10%, hsl(48 100% 85%) 0%, hsl(45 95% 70%) 30%, hsl(42 90% 58%) 60%, hsl(38 85% 45%) 100%)',
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
                        fontSize: 'clamp(1.15rem, 4.8cqw, 1.9rem)', 
                        letterSpacing: '0.05em',
                        textShadow: '0 0 12px rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.9)'
                      }}>
                    WEEKLY WINNERS
                  </h1>
                </div>
              </div>

              {/* Content - Player List */}
              <div className="relative z-10 flex flex-col items-center justify-between flex-1 px-[2%] pb-[4%] pt-[1%]">
                
                {/* Players List - szélesebb, kisebb boxok, belső görgetés, első 7 látszik */}
                <div
                  className="w-full max-w-[98%] space-y-1.5 overflow-y-auto pr-1"
                  style={{ maxHeight: 'clamp(280px, 45vh, 420px)' }}
                >
                  {topPlayers
                    .slice(0, 10)
                    .map((player, index) => (
                      <div 
                        key={player.user_id || index}
                        className="relative"
                        style={{
                          animation: `fadeInUp ${0.28 + index * 0.07}s ease-out ${index * 0.04}s both`
                        }}
                      >
                        {/* 3D Card Shadow */}
                        <div className="absolute inset-0 translate-y-0.5 translate-x-0.5 bg-black/40 rounded-lg blur-sm" />
                        
                        {/* 3D Card Border - KÉK/ARANY gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 rounded-lg" 
                             style={{ boxShadow: 'inset 0 0 0 1.5px hsl(220, 70%, 30%), 0 3px 8px rgba(0,0,0,0.3)' }} />
                        
                        {/* 3D Card Inner Layer */}
                        <div className="absolute inset-[1.5px] bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 rounded-lg"
                             style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }} />
                        
                        {/* Card Content */}
                        <div className="relative bg-gradient-to-br from-blue-600/95 via-blue-700/95 to-blue-800/95 rounded-lg px-2 py-1.5 flex items-center gap-2"
                             style={{ boxShadow: 'inset 0 6px 12px rgba(255,255,255,0.15), inset 0 -6px 12px rgba(0,0,0,0.25)' }}>
                          
                          {/* Rank Number - Left */}
                          <div className="flex-shrink-0 w-6 text-center">
                            <span className="font-black text-yellow-300 drop-shadow-lg" 
                                  style={{ 
                                    fontSize: 'clamp(0.85rem, 3.5cqw, 1.1rem)',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                  }}>
                              {player.rank ?? index + 1}
                            </span>
                          </div>

                          {/* Avatar - Kisebb */}
                          <div className="flex-shrink-0">
                            {player.avatar_url ? (
                              <img 
                                src={player.avatar_url} 
                                alt={player.username}
                                className="w-9 h-9 rounded-full border-2 border-yellow-400 shadow-lg object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full border-2 border-yellow-400 shadow-lg bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Username */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate drop-shadow-md" 
                               style={{ 
                                 fontSize: 'clamp(0.75rem, 3cqw, 0.95rem)',
                                 textShadow: '0 2px 4px rgba(0,0,0,0.7)'
                               }}>
                              {player.username}
                            </p>
                          </div>

                          {/* Score */}
                          <div className="flex-shrink-0">
                            <p className="font-black text-yellow-200 drop-shadow-md" 
                               style={{ 
                                 fontSize: 'clamp(0.8rem, 3.2cqw, 1rem)',
                                 textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                               }}>
                              {player.total_correct_answers.toLocaleString()}
                            </p>
                          </div>

                          {/* Crowns for Top 3 */}
                          <div className="flex-shrink-0">
                            {player.rank === 1 && (
                              <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <linearGradient id={`crownGold${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFE08A"/>
                                    <stop offset="50%" stopColor="#F59E0B"/>
                                    <stop offset="100%" stopColor="#D97706"/>
                                  </linearGradient>
                                </defs>
                                <path d="M4 7l4 4 4-6 4 6 4-4 0 10H4z" fill={`url(#crownGold${index})`} stroke="#7c5800" strokeWidth="0.8"/>
                              </svg>
                            )}
                            {player.rank === 2 && (
                              <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <linearGradient id={`crownSilver${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#F3F4F6"/>
                                    <stop offset="50%" stopColor="#D1D5DB"/>
                                    <stop offset="100%" stopColor="#9CA3AF"/>
                                  </linearGradient>
                                </defs>
                                <path d="M4 7l4 4 4-6 4 6 4-4 0 10H4z" fill={`url(#crownSilver${index})`} stroke="#4b5563" strokeWidth="0.8"/>
                              </svg>
                            )}
                            {player.rank === 3 && (
                              <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <linearGradient id={`crownBronze${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#F59E0B"/>
                                    <stop offset="50%" stopColor="#B45309"/>
                                    <stop offset="100%" stopColor="#78350F"/>
                                  </linearGradient>
                                </defs>
                                <path d="M4 7l4 4 4-6 4 6 4-4 0 10H4z" fill={`url(#crownBronze${index})`} stroke="#6b4000" strokeWidth="0.8"/>
                              </svg>
                            )}
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
              </div>
            </HexShieldFrame>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};