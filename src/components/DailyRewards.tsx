import { useI18n } from '@/i18n';
import { DiamondHexagon } from './DiamondHexagon';

interface LeaderboardPlayer {
  username: string;
  total_correct_answers: number;
  avatar_url: string | null;
}

interface RankReward {
  rank: number;
  gold: number;
  life: number;
}

interface DailyRewardsData {
  day: string;
  type: 'NORMAL' | 'JACKPOT';
  rewards: RankReward[];
}

interface DailyRewardsProps {
  topPlayers: LeaderboardPlayer[];
  userRank: number | null;
  userUsername: string | null;
  userCorrectAnswers: number;
  dailyRewards: DailyRewardsData | null;
}

const DailyRewards = ({ topPlayers, userRank, userUsername, userCorrectAnswers, dailyRewards }: DailyRewardsProps) => {
  const { t } = useI18n();
  const isJackpot = dailyRewards?.type === 'JACKPOT';
  const maxRank = isJackpot ? 25 : 10;

  const getRewardForRank = (rank: number): { coins: number; lives: number } => {
    if (!dailyRewards) {
      return { coins: 0, lives: 0 };
    }
    const reward = dailyRewards.rewards.find(r => r.rank === rank);
    return { coins: reward?.gold || 0, lives: reward?.life || 0 };
  };

  const getCrownIcon = (place: number) => {
    if (place === 1) return '👑';
    if (place === 2) return '🥈';
    if (place === 3) return '🥉';
    return '⭐';
  };

  // JACKPOT VASÁRNAPI DESIGN
  if (isJackpot) {
    return (
      <div className="relative" style={{ margin: '0 clamp(6px, 1.5vw, 8px)', marginBottom: 'clamp(12px, 2vh, 16px)' }}>
        <div 
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(45 100% 50%), hsl(280 70% 50%), hsl(45 100% 50%))',
            boxShadow: '0 12px 48px rgba(255, 215, 0, 0.6), 0 0 80px rgba(138, 43, 226, 0.4)',
            borderRadius: 'clamp(16px, 3vw, 24px)',
            padding: 'clamp(3px, 0.6vw, 4px)',
            marginBottom: 'clamp(20px, 3vh, 24px)'
          }}
        >
          <div 
            className="relative text-center"
            style={{ background: 'linear-gradient(135deg, hsl(280 80% 15%), hsl(280 70% 20%), hsl(45 100% 20%))', borderRadius: 'clamp(16px, 3vw, 24px)', padding: 'clamp(20px, 3vh, 24px)' }}
          >
            <div className="flex items-center justify-center mb-2" style={{ gap: 'clamp(8px, 1.5vw, 12px)' }}>
              <span className="animate-bounce" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>🎰</span>
              <h2 
                className="font-black tracking-widest uppercase"
                style={{
                  background: 'linear-gradient(135deg, hsl(45 100% 70%), hsl(45 100% 50%), hsl(280 100% 60%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px hsla(45, 100%, 60%, 1))',
                  fontSize: 'clamp(1.5rem, 5vw, 2.25rem)'
                }}
              >
                {t('daily_rewards.jackpot_title')}
              </h2>
              <span className="animate-bounce" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>💎</span>
            </div>
            <p className="font-bold" style={{ color: 'hsl(45 100% 80%)', fontSize: 'clamp(1rem, 3vw, 1.25rem)', marginTop: 'clamp(8px, 1.5vh, 12px)' }}>
              {t('daily_rewards.top25_reward')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vh, 12px)' }}>
          {topPlayers.slice(0, maxRank).map((player, index) => {
            const place = index + 1;
            const reward = getRewardForRank(place);
            const isTop3 = place <= 3;
            return (
              <div 
                key={index} 
                className="relative transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden" 
                style={{
                  background: isTop3 
                    ? (place === 1 
                        ? 'linear-gradient(135deg, hsl(45 100% 48%), hsl(45 100% 38%), hsl(45 100% 28%))' 
                        : place === 2 
                        ? 'linear-gradient(135deg, hsl(0 0% 75%), hsl(0 0% 65%), hsl(0 0% 55%))' 
                        : 'linear-gradient(135deg, hsl(30 75% 58%), hsl(30 75% 48%), hsl(30 75% 38%))') 
                    : 'linear-gradient(135deg, hsl(280 55% 33%), hsl(280 55% 28%), hsl(280 55% 23%))',
                  boxShadow: isTop3 
                    ? `0 12px 24px rgba(0, 0, 0, 0.5), 
                       0 0 ${place === 1 ? '30px' : place === 2 ? '20px' : '15px'} ${place === 1 ? 'rgba(255, 215, 0, 0.4)' : place === 2 ? 'rgba(192, 192, 192, 0.3)' : 'rgba(205, 127, 50, 0.3)'},
                       inset 0 2px 0 rgba(255, 255, 255, ${place === 1 ? '0.35' : '0.25'}), 
                       inset 0 -3px 12px rgba(0, 0, 0, 0.35)` 
                    : '0 6px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -2px 8px rgba(0, 0, 0, 0.2)',
                  border: isTop3 ? '3px solid' : '1.5px solid hsl(280 30% 42%)',
                  borderColor: isTop3 ? (place === 1 ? 'hsl(45 100% 68%)' : place === 2 ? 'hsl(0 0% 85%)' : 'hsl(30 75% 65%)') : undefined,
                  borderRadius: 'clamp(10px, 2vw, 12px)',
                  padding: 'clamp(12px, 2vh, 16px)'
                }}
              >
                {/* Shimmer overlay csak TOP3-ra */}
                {isTop3 && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
                      animation: 'shimmer 3s infinite',
                      backgroundSize: '200% 100%'
                    }}
                  />
                )}
                
                <div className="flex items-center justify-between" style={{ gap: 'clamp(12px, 2vw, 16px)' }}>
                  {/* BAL OLDAL: emoji + rangsor + hexagon profilkép + név */}
                  <div className="flex items-center flex-1 min-w-0" style={{ gap: 'clamp(8px, 1.5vw, 12px)' }}>
                    <span className="flex-shrink-0" style={{ filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))', fontSize: 'clamp(1.5rem, 4vw, 1.875rem)' }}>
                      {getCrownIcon(place)}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center min-w-0" style={{ gap: 'clamp(6px, 1vw, 8px)' }}>
                        <span 
                          className="font-black flex-shrink-0" 
                          style={{ 
                            color: isTop3 ? (place === 1 ? 'hsl(45 100% 88%)' : place === 2 ? 'hsl(0 0% 97%)' : 'hsl(30 75% 88%)') : 'hsl(45 90% 72%)',
                            textShadow: isTop3 
                              ? `0 3px 6px rgba(0, 0, 0, 0.6), 0 0 ${place === 1 ? '15px' : '10px'} ${place === 1 ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.4)'}`
                              : '0 2px 4px rgba(0, 0, 0, 0.5)',
                            fontSize: 'clamp(1.25rem, 3.5vw, 1.5rem)'
                          }}
                        >
                          #{place}
                        </span>
                        <div className="flex-shrink-0">
                          <DiamondHexagon 
                            type="avatar" 
                            value={player.username} 
                            avatarUrl={player.avatar_url} 
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span 
                            className="font-bold text-white truncate overflow-hidden whitespace-nowrap" 
                            style={{ 
                              textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
                              textOverflow: 'ellipsis',
                              maxWidth: 'clamp(120px, 25vw, 140px)',
                              fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)'
                            }}
                          >
                            {player.username}
                          </span>
                          <span 
                            className="font-semibold" 
                            style={{ 
                              color: isTop3 ? 'rgba(255, 255, 255, 0.85)' : 'hsl(45 85% 68%)',
                              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                              fontSize: 'clamp(0.625rem, 1.8vw, 0.75rem)'
                            }}
                          >
                            {t('daily_rewards.correct_answers').replace('{count}', String(player.total_correct_answers))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* JOBB OLDAL: 3D jutalmak SVG ikonokkal */}
                  <div className="flex flex-col items-end flex-shrink-0" style={{ minWidth: 'clamp(90px, 18vw, 100px)', gap: 'clamp(6px, 1vh, 8px)' }}>
                    <div className="flex items-center justify-end w-full" style={{ gap: 'clamp(6px, 1vw, 8px)' }}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))', width: 'clamp(18px, 3.5vw, 22px)', height: 'clamp(18px, 3.5vw, 22px)' }}>
                        <circle cx="12" cy="12" r="10" fill="url(#goldGradient)" stroke="hsl(45 100% 30%)" strokeWidth="2.5"/>
                        <circle cx="12" cy="12" r="7" fill="url(#goldInner)" opacity="0.85"/>
                        <circle cx="9" cy="9" r="2.5" fill="rgba(255, 255, 255, 0.5)"/>
                        <defs>
                          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(45 100% 70%)" />
                            <stop offset="50%" stopColor="hsl(45 100% 58%)" />
                            <stop offset="100%" stopColor="hsl(45 95% 48%)" />
                          </linearGradient>
                          <radialGradient id="goldInner">
                            <stop offset="0%" stopColor="hsl(45 100% 75%)" />
                            <stop offset="100%" stopColor="hsl(45 100% 55%)" />
                          </radialGradient>
                        </defs>
                      </svg>
                      <span 
                        className="font-black tabular-nums" 
                        style={{ 
                          color: 'hsl(45 100% 80%)',
                          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 215, 0, 0.5)',
                          minWidth: 'clamp(55px, 12vw, 65px)',
                          textAlign: 'right',
                          fontSize: 'clamp(0.875rem, 2.2vw, 1rem)'
                        }}
                      >
                        +{reward.coins.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-end w-full" style={{ gap: 'clamp(6px, 1vw, 8px)' }}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))', width: 'clamp(18px, 3.5vw, 22px)', height: 'clamp(18px, 3.5vw, 22px)' }}>
                        <path 
                          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                          fill="url(#heartGradient)" 
                          stroke="hsl(0 85% 40%)" 
                          strokeWidth="2.5"
                        />
                        <ellipse cx="9" cy="8" rx="2.5" ry="2" fill="rgba(255, 255, 255, 0.5)"/>
                        <defs>
                          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(0 92% 68%)" />
                            <stop offset="50%" stopColor="hsl(0 87% 58%)" />
                            <stop offset="100%" stopColor="hsl(0 82% 48%)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span 
                        className="font-black tabular-nums" 
                        style={{ 
                          color: 'hsl(0 88% 75%)',
                          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 0, 0, 0.4)',
                          minWidth: 'clamp(55px, 12vw, 65px)',
                          textAlign: 'right',
                          fontSize: 'clamp(0.875rem, 2.2vw, 1rem)'
                        }}
                      >
                        +{reward.lives}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>

        <div className="mt-6 text-center" style={{ marginTop: 'clamp(20px, 3vh, 24px)' }}>
          <p className="font-semibold" style={{ color: 'hsl(45 100% 75%)', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
            {t('daily_rewards.midnight_info')}
          </p>
        </div>
      </div>
    );
  }

  // NORMÁL NAPOK (H-Szo) - similar structure with t() translation
  return (
    <div className="relative" style={{ margin: '0 clamp(6px, 1.5vw, 8px)', marginBottom: 'clamp(12px, 2vh, 16px)' }}>
      <div className="relative" style={{ background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-500)), hsl(var(--dup-gold-700)))', borderRadius: 'clamp(16px, 3vw, 24px)', padding: 'clamp(3px, 0.6vw, 4px)' }}>
        <div className="relative" style={{ background: 'linear-gradient(135deg, hsl(var(--dup-purple-900)), hsl(var(--dup-purple-800)))', borderRadius: 'clamp(16px, 3vw, 24px)', padding: 'clamp(16px, 2.5vh, 20px)' }}>
          <h2 className="font-black text-center" style={{ background: 'linear-gradient(135deg, hsl(45 100% 70%), hsl(45 100% 60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 'clamp(1.25rem, 3.5vw, 1.5rem)', marginBottom: 'clamp(12px, 2vh, 16px)' }}>{t('daily_rewards.geniuses_title')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vh, 12px)' }}>
            {/* ... rest of normal days design with same t() pattern ... */}
            {topPlayers.slice(0, maxRank).map((player, index) => {
              const place = index + 1;
              const reward = getRewardForRank(place);
              const isTop3 = place <= 3;
              return (
                <div key={index} className="relative transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden" 
                  style={{
                    background: isTop3 
                      ? (place === 1 ? 'linear-gradient(135deg, hsl(45 98% 48%), hsl(45 98% 38%), hsl(45 98% 28%))' 
                        : place === 2 ? 'linear-gradient(135deg, hsl(0 0% 75%), hsl(0 0% 65%), hsl(0 0% 55%))' 
                        : 'linear-gradient(135deg, hsl(30 78% 58%), hsl(30 78% 48%), hsl(30 78% 38%))') 
                      : 'linear-gradient(135deg, hsl(280 55% 33%), hsl(280 55% 28%), hsl(280 55% 23%))',
                    boxShadow: isTop3 
                      ? `0 12px 24px rgba(0, 0, 0, 0.5), 0 0 ${place === 1 ? '30px' : place === 2 ? '20px' : '15px'} ${place === 1 ? 'rgba(255, 215, 0, 0.4)' : place === 2 ? 'rgba(192, 192, 192, 0.3)' : 'rgba(205, 127, 50, 0.3)'}, inset 0 2px 0 rgba(255, 255, 255, ${place === 1 ? '0.35' : '0.25'}), inset 0 -3px 12px rgba(0, 0, 0, 0.35)` 
                      : '0 6px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -2px 8px rgba(0, 0, 0, 0.2)',
                    border: isTop3 ? '3px solid' : '1.5px solid hsl(280 30% 42%)',
                    borderColor: isTop3 ? (place === 1 ? 'hsl(45 100% 68%)' : place === 2 ? 'hsl(0 0% 85%)' : 'hsl(30 78% 65%)') : undefined,
                    borderRadius: 'clamp(10px, 2vw, 12px)',
                    padding: 'clamp(12px, 2vh, 16px)'
                  }}
                >
                  {isTop3 && (
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)', animation: 'shimmerNormal 3s infinite', backgroundSize: '200% 100%' }} />
                  )}
                  <div className="flex items-center justify-between" style={{ gap: 'clamp(12px, 2vw, 16px)' }}>
                    <div className="flex items-center flex-1 min-w-0" style={{ gap: 'clamp(8px, 1.5vw, 12px)' }}>
                      <span className="flex-shrink-0" style={{ filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5))', fontSize: 'clamp(1.5rem, 4vw, 1.875rem)' }}>
                        {getCrownIcon(place)}
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center min-w-0" style={{ gap: 'clamp(6px, 1vw, 8px)' }}>
                          <span className="font-black flex-shrink-0" style={{ color: isTop3 ? (place === 1 ? 'hsl(45 100% 88%)' : place === 2 ? 'hsl(0 0% 97%)' : 'hsl(30 78% 88%)') : 'hsl(var(--dup-gold-400))', textShadow: isTop3 ? `0 3px 6px rgba(0, 0, 0, 0.6), 0 0 ${place === 1 ? '15px' : '10px'} ${place === 1 ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.4)'}` : '0 2px 4px rgba(0, 0, 0, 0.5)', fontSize: 'clamp(1.25rem, 3.5vw, 1.5rem)' }}>#{place}</span>
                          <div className="flex-shrink-0">
                            <DiamondHexagon 
                              type="avatar" 
                              value={player.username} 
                              avatarUrl={player.avatar_url} 
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white truncate overflow-hidden whitespace-nowrap" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)', textOverflow: 'ellipsis', maxWidth: 'clamp(120px, 25vw, 140px)', fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)' }}>{player.username}</span>
                            <span className="font-semibold" style={{ color: isTop3 ? 'rgba(255, 255, 255, 0.85)' : 'hsl(45 85% 68%)', textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)', fontSize: 'clamp(0.625rem, 1.8vw, 0.75rem)' }}>
                              {t('daily_rewards.correct_answers').replace('{count}', String(player.total_correct_answers))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0" style={{ minWidth: 'clamp(90px, 18vw, 100px)', gap: 'clamp(6px, 1vh, 8px)' }}>
                      <div className="flex items-center justify-end w-full" style={{ gap: 'clamp(6px, 1vw, 8px)' }}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))', width: 'clamp(18px, 3.5vw, 22px)', height: 'clamp(18px, 3.5vw, 22px)' }}>
                          <circle cx="12" cy="12" r="10" fill="url(#goldGradient3)" stroke="hsl(45 100% 30%)" strokeWidth="2.5"/>
                          <circle cx="12" cy="12" r="7" fill="url(#goldInner3)" opacity="0.85"/>
                          <circle cx="9" cy="9" r="2.5" fill="rgba(255, 255, 255, 0.5)"/>
                          <defs>
                            <linearGradient id="goldGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="hsl(45 100% 70%)" />
                              <stop offset="50%" stopColor="hsl(45 100% 58%)" />
                              <stop offset="100%" stopColor="hsl(45 95% 48%)" />
                            </linearGradient>
                            <radialGradient id="goldInner3">
                              <stop offset="0%" stopColor="hsl(45 100% 75%)" />
                              <stop offset="100%" stopColor="hsl(45 100% 55%)" />
                            </radialGradient>
                          </defs>
                        </svg>
                        <span className="font-black tabular-nums" style={{ color: 'hsl(45 100% 80%)', textShadow: '0 2px 6px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 215, 0, 0.5)', minWidth: 'clamp(55px, 12vw, 65px)', textAlign: 'right', fontSize: 'clamp(0.875rem, 2.2vw, 1rem)' }}>+{reward.coins.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-end w-full" style={{ gap: 'clamp(6px, 1vw, 8px)' }}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))', width: 'clamp(18px, 3.5vw, 22px)', height: 'clamp(18px, 3.5vw, 22px)' }}>
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="url(#heartGradient2)" stroke="hsl(0 85% 40%)" strokeWidth="2.5"/>
                          <ellipse cx="9" cy="8" rx="2.5" ry="2" fill="rgba(255, 255, 255, 0.5)"/>
                          <defs>
                            <linearGradient id="heartGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="hsl(0 92% 68%)" />
                              <stop offset="50%" stopColor="hsl(0 87% 58%)" />
                              <stop offset="100%" stopColor="hsl(0 82% 48%)" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="font-black tabular-nums" style={{ color: 'hsl(0 88% 75%)', textShadow: '0 2px 6px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 0, 0, 0.4)', minWidth: 'clamp(55px, 12vw, 65px)', textAlign: 'right', fontSize: 'clamp(0.875rem, 2.2vw, 1rem)' }}>+{reward.lives}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`@keyframes shimmerNormal { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      <div className="text-center" style={{ marginTop: 'clamp(20px, 3vh, 24px)' }}>
        <p className="font-semibold" style={{ color: 'hsl(45 100% 75%)', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>{t('daily_rewards.midnight_info')}</p>
      </div>
    </div>
  );
};

export default DailyRewards;
