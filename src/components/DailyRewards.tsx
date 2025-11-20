interface LeaderboardPlayer {
  username: string;
  total_correct_answers: number;
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
      <div className="relative mx-2 mb-4">
        <div 
          className="relative rounded-3xl p-1 mb-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(45 100% 50%), hsl(280 70% 50%), hsl(45 100% 50%))',
            boxShadow: '0 12px 48px rgba(255, 215, 0, 0.6), 0 0 80px rgba(138, 43, 226, 0.4)',
          }}
        >
          <div 
            className="relative rounded-3xl p-6 text-center"
            style={{ background: 'linear-gradient(135deg, hsl(280 80% 15%), hsl(280 70% 20%), hsl(45 100% 20%))' }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-5xl animate-bounce">🎰</span>
              <h2 
                className="text-4xl font-black tracking-widest uppercase"
                style={{
                  background: 'linear-gradient(135deg, hsl(45 100% 70%), hsl(45 100% 50%), hsl(280 100% 60%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px hsla(45, 100%, 60%, 1))',
                }}
              >
                VASÁRNAPI JACKPOT
              </h2>
              <span className="text-5xl animate-bounce">💎</span>
            </div>
            <p className="text-xl font-bold mt-3" style={{ color: 'hsl(45 100% 80%)' }}>
              🏆 TOP25 NAPI JUTALOM 🏆
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {topPlayers.slice(0, maxRank).map((player, index) => {
            const place = index + 1;
            const reward = getRewardForRank(place);
            const isTop3 = place <= 3;
            return (
              <div key={index} className="relative rounded-xl p-4" style={{
                background: isTop3 ? (place === 1 ? 'linear-gradient(135deg, hsl(45 100% 35%), hsl(45 100% 25%))' : place === 2 ? 'linear-gradient(135deg, hsl(0 0% 60%), hsl(0 0% 45%))' : 'linear-gradient(135deg, hsl(30 60% 45%), hsl(30 60% 35%))') : 'linear-gradient(135deg, hsl(280 40% 25%), hsl(280 50% 20%))',
                border: isTop3 ? '3px solid' : '2px solid hsl(280 30% 40%)',
                borderColor: isTop3 ? (place === 1 ? 'hsl(45 100% 60%)' : place === 2 ? 'hsl(0 0% 75%)' : 'hsl(30 60% 55%)') : undefined
              }}>
                <div className="flex items-center justify-between">
                  {/* BAL OLDAL: emoji + rangsor + név */}
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-3xl">{getCrownIcon(place)}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold" style={{ color: isTop3 ? (place === 1 ? 'hsl(45 100% 75%)' : place === 2 ? 'hsl(0 0% 85%)' : 'hsl(30 60% 75%)') : 'hsl(45 80% 65%)' }}>#{place}</span>
                        <span className="text-lg font-semibold text-white truncate">{player.username}</span>
                      </div>
                      <span className="text-xs ml-10" style={{ color: 'hsl(45 80% 60%)' }}>{player.total_correct_answers} helyes válasz</span>
                    </div>
                  </div>
                  
                  {/* JOBB OLDAL: jutalmak + nagy szám */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">🪙</span>
                        <span className="text-sm font-bold" style={{ color: 'hsl(45 100% 70%)' }}>+{reward.coins.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">❤️</span>
                        <span className="text-sm font-bold" style={{ color: 'hsl(0 80% 70%)' }}>+{reward.lives}</span>
                      </div>
                    </div>
                    <span className="text-3xl font-bold" style={{ color: isTop3 ? 'white' : 'hsl(45 80% 70%)' }}>{player.total_correct_answers}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Éjféli jutalom jóváírás info - Jackpot */}
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold" style={{ color: 'hsl(45 100% 75%)' }}>
            ⏰ A jutalmak minden nap éjfélkor automatikusan jóváíródnak a TOP25 játékosoknak
          </p>
        </div>
      </div>
    );
  }

  // NORMÁL NAPOK (H-Szo)
  return (
    <div className="relative mx-2 mb-4">
      <div className="relative rounded-3xl p-1" style={{ background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-500)), hsl(var(--dup-gold-700)))' }}>
        <div className="relative rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, hsl(var(--dup-purple-900)), hsl(var(--dup-purple-800)))' }}>
          <h2 className="text-2xl font-black text-center mb-4" style={{ background: 'linear-gradient(135deg, hsl(45 100% 70%), hsl(45 100% 60%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A GÉNIUSZOK</h2>
          <div className="space-y-2">
            {topPlayers.slice(0, maxRank).map((player, index) => {
              const place = index + 1;
              const reward = getRewardForRank(place);
              const isTop3 = place <= 3;
              return (
                <div key={index} className="relative rounded-xl p-4" style={{
                  background: isTop3 ? (place === 1 ? 'linear-gradient(135deg, hsl(45 90% 40%), hsl(45 100% 30%))' : place === 2 ? 'linear-gradient(135deg, hsl(0 0% 65%), hsl(0 0% 50%))' : 'linear-gradient(135deg, hsl(30 70% 50%), hsl(30 80% 40%))') : 'linear-gradient(135deg, hsl(280 40% 30%), hsl(280 50% 25%))'
                }}>
                  <div className="flex items-center justify-between">
                    {/* BAL OLDAL: emoji + rangsor + név */}
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{getCrownIcon(place)}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold" style={{ color: isTop3 ? (place === 1 ? 'hsl(45 100% 80%)' : place === 2 ? 'hsl(0 0% 90%)' : 'hsl(30 70% 80%)') : 'hsl(var(--dup-gold-400))' }}>#{place}</span>
                          <span className="text-lg font-semibold text-white truncate">{player.username}</span>
                        </div>
                        <span className="text-xs ml-10" style={{ color: 'hsl(45 80% 60%)' }}>{player.total_correct_answers} helyes válasz</span>
                      </div>
                    </div>
                    
                    {/* JOBB OLDAL: jutalmak + nagy szám */}
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🪙</span>
                          <span className="text-sm font-bold" style={{ color: 'hsl(45 100% 75%)' }}>+{reward.coins.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">❤️</span>
                          <span className="text-sm font-bold" style={{ color: 'hsl(0 80% 70%)' }}>+{reward.lives}</span>
                        </div>
                      </div>
                      <span className="text-3xl font-bold" style={{ color: isTop3 ? 'white' : 'hsl(var(--dup-gold-400))' }}>{player.total_correct_answers}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Éjféli jutalom jóváírás info - Normál napok */}
          <div className="mt-6 text-center">
            <p className="text-sm font-semibold" style={{ color: 'hsl(45 100% 70%)' }}>
              ⏰ A jutalmak minden nap éjfélkor automatikusan jóváíródnak a TOP10 játékosoknak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyRewards;
