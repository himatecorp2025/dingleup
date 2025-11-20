interface LeaderboardPlayer {
  username: string;
  total_correct_answers: number;
}

interface DailyRewardsProps {
  topPlayers: LeaderboardPlayer[];
  userRank: number | null;
  userUsername: string | null;
  userCorrectAnswers: number;
}

const DailyRewards = ({ topPlayers, userRank, userUsername, userCorrectAnswers }: DailyRewardsProps) => {
  const rewards = [
    { place: 1, coins: 5000, lives: 100 },
    { place: 2, coins: 2500, lives: 50 },
    { place: 3, coins: 1500, lives: 30 },
    { place: 4, coins: 1000, lives: 20 },
    { place: 5, coins: 800, lives: 15 },
    { place: 6, coins: 700, lives: 10 },
    { place: 7, coins: 600, lives: 10 },
    { place: 8, coins: 500, lives: 8 },
    { place: 9, coins: 500, lives: 6 },
    { place: 10, coins: 500, lives: 5 }
  ];

  const getCrownIcon = (place: number) => {
    if (place === 1) return '👑';
    if (place === 2) return '🥈';
    if (place === 3) return '🥉';
    return '⭐';
  };

  return (
    <div className="relative mx-2 mb-4">
      {/* Outer gold frame with ornate border */}
      <div 
        className="relative rounded-3xl p-1 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--dup-gold-700)), hsl(var(--dup-gold-500)), hsl(var(--dup-gold-700)))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Animated gold shimmer */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s infinite linear'
          }}
        />

        {/* Inner border decoration */}
        <div 
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--dup-purple-900)), hsl(var(--dup-purple-800)), hsl(280 60% 25%))',
            border: '2px solid hsl(var(--dup-gold-600))',
          }}
        >
          {/* Glossy overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(255, 255, 255, 0.15) 0%, transparent 60%)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 px-4 py-5">
            {/* Title */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6 text-[hsl(var(--dup-gold-300))] animate-pulse drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15 8.5L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9 8.5L12 2Z"/>
                </svg>
                <h2 
                  className="text-2xl font-black tracking-wider"
                  style={{
                    background: 'linear-gradient(135deg, hsl(45 100% 70%), hsl(45 100% 60%), hsl(45 95% 55%))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 16px hsla(45, 100%, 65%, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))'
                  }}
                >
                  A ZSENIKNEK
                </h2>
                <svg className="w-6 h-6 text-[hsl(var(--dup-gold-300))] animate-pulse drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15 8.5L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9 8.5L12 2Z"/>
                </svg>
              </div>
            </div>

            {/* User's own ranking box (only if user has a rank and NOT in top 10) */}
            {userRank && userUsername && userRank > 10 && (
              <div className="mb-4">
                <div
                  className="relative rounded-xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, hsl(var(--dup-purple-800)), hsl(280 60% 25%))',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {/* Shimmer effect on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: 'linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite'
                    }}
                  />

                  <div className="relative flex items-center gap-3 px-4 py-3">
                    {/* Star icon */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <span className="text-2xl" style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))'
                      }}>
                        ⭐
                      </span>
                    </div>

                    {/* Username and stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-black text-lg flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, hsl(45 85% 65%), hsl(45 80% 55%))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8))'
                          }}
                        >
                          {userRank}.
                        </span>
                        <span className="text-white/90 font-bold text-sm truncate">
                          {userUsername}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 ml-8">
                        Helyes: {userCorrectAnswers}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top 10 Players with rewards */}
            <div className="space-y-1.5">
              {rewards.map((reward, index) => {
                const player = topPlayers[index];
                return (
                  <div
                    key={index}
                    className="relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:z-10"
                    style={{
                      background: index < 3 
                        ? 'linear-gradient(90deg, hsl(var(--dup-purple-700)), hsl(280 70% 35%))'
                        : 'linear-gradient(90deg, hsl(var(--dup-purple-800)), hsl(280 60% 25%))',
                      boxShadow: index < 3
                      ? '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                      : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {/* Gold left border for top 3 */}
                  {index < 3 && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ background: 'linear-gradient(180deg, hsl(var(--dup-gold-500)), hsl(var(--dup-gold-600)))' }}
                    />
                  )}

                  {/* Shimmer effect on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: 'linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite'
                    }}
                  />

                  <div className="relative flex items-center px-4 py-3">
                    {/* Crown/medal icon */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <span className="text-2xl" style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))'
                      }}>
                        {getCrownIcon(reward.place)}
                      </span>
                    </div>

                    {/* Rank and username */}
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-black text-lg flex-shrink-0"
                          style={{
                            background: index < 3 
                              ? 'linear-gradient(135deg, hsl(45 100% 70%), hsl(45 100% 60%))'
                              : 'linear-gradient(135deg, hsl(45 85% 65%), hsl(45 80% 55%))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8))'
                          }}
                        >
                          {reward.place}.
                        </span>
                        <span className="text-white/90 font-bold text-sm truncate">
                          {player ? player.username : `${reward.place}. helyezett`}
                        </span>
                      </div>
                      {/* Correct answers count */}
                      {player && (
                        <p className="text-xs text-white/60 ml-8">
                          Helyes: {player.total_correct_answers}
                        </p>
                      )}
                    </div>
                    
                    {/* Rewards - vertically centered */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-[hsl(var(--dup-gold-500))] drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" fill="currentColor" stroke="hsl(var(--dup-gold-700))" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="7" fill="none" stroke="hsl(var(--dup-gold-700))" strokeWidth="1" opacity="0.5"/>
                          <text x="12" y="16" textAnchor="middle" fill="hsl(var(--dup-gold-900))" fontSize="10" fontWeight="bold">$</text>
                        </svg>
                        <span 
                          className="font-bold text-base"
                          style={{
                            background: 'linear-gradient(135deg, hsl(45 100% 70%), hsl(45 100% 55%))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))'
                          }}
                        >
                          {reward.coins}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-[hsl(var(--destructive))] drop-shadow-lg animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span 
                          className="font-bold text-base"
                          style={{
                            background: 'linear-gradient(135deg, hsl(0 100% 70%), hsl(0 100% 55%))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))'
                          }}
                        >
                          {reward.lives}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Footer message */}
            <div className="mt-4 text-center">
              <p 
                className="text-xs font-semibold px-2"
                style={{
                  color: 'hsl(var(--dup-gold-300))',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}
              >
                💰 A jóváírás automatikusan történik minden nap éjfélkor 💰
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyRewards;
