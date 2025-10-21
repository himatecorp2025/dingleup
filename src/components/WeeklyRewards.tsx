import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Coins, Heart, Sparkles } from 'lucide-react';

const WeeklyRewards = () => {
  const rewards = [
    { place: '🥇 1.', coins: 5000, lives: 100 },
    { place: '🥈 2.', coins: 2500, lives: 50 },
    { place: '🥉 3.', coins: 1500, lives: 30 },
    { place: '4.', coins: 1000, lives: 20 },
    { place: '5.', coins: 800, lives: 15 },
    { place: '6.', coins: 700, lives: 10 },
    { place: '7.', coins: 600, lives: 10 },
    { place: '8.', coins: 500, lives: 8 },
    { place: '9.', coins: 500, lives: 6 },
    { place: '10.', coins: 500, lives: 5 }
  ];

  return (
    <div 
      className="relative mb-4 px-3 py-4 sm:px-4 sm:py-5 overflow-hidden rounded-2xl"
      style={{ 
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF8C00 50%, #FFA500 75%, #FFD700 100%)',
        boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 60px rgba(255, 255, 255, 0.3)',
        border: '3px solid #FFD700',
        animation: 'shimmer 3s ease-in-out infinite'
      }}
    >
      {/* Arany ragyogás effekt */}
      <div 
        className="absolute inset-0 opacity-30 rounded-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      
      {/* Belső arany keret */}
      <div 
        className="absolute inset-2 rounded-xl"
        style={{
          border: '2px solid rgba(255, 215, 0, 0.5)',
          boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.4)'
        }}
      />

      <div className="relative z-10 text-center">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Sparkles className="w-5 h-5 text-yellow-900 animate-pulse" />
          <Trophy className="w-6 h-6 text-yellow-900" />
          <span className="text-yellow-900 font-black text-lg drop-shadow-lg">HETI JUTALMAK</span>
          <Trophy className="w-6 h-6 text-yellow-900" />
          <Sparkles className="w-5 h-5 text-yellow-900 animate-pulse" />
        </div>
        <p className="text-[11px] text-yellow-900/90 font-semibold drop-shadow">
          Minden vasárnap 23:55-kor lezárul a rangsorolás. 5 perc szünet után hétfő 00:00-kor kihirdetjük a nyerteseket!
        </p>
      </div>
      
      <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
        {rewards.map((reward, index) => (
          <div
            key={index}
            className={`relative rounded-xl p-3 backdrop-blur-sm transition-all hover:scale-105 ${
              index < 3
                ? 'bg-gradient-to-br from-yellow-200/90 to-orange-200/90 border-3 border-yellow-600 shadow-lg shadow-yellow-500/50'
                : 'bg-gradient-to-br from-amber-100/80 to-yellow-100/80 border-2 border-yellow-500'
            }`}
            style={{
              boxShadow: index < 3 
                ? '0 4px 15px rgba(255, 215, 0, 0.5), inset 0 2px 10px rgba(255, 255, 255, 0.5)' 
                : '0 2px 8px rgba(255, 215, 0, 0.3), inset 0 1px 5px rgba(255, 255, 255, 0.4)'
            }}
          >
            {index < 3 && (
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-4 h-4 text-yellow-600 animate-pulse" />
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-900 font-black text-base drop-shadow">{reward.place}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mb-1">
              <Coins className="w-4 h-4 text-yellow-700" />
              <span className="text-yellow-900 font-bold">{reward.coins}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-red-600" />
              <span className="text-yellow-900 font-bold">{reward.lives}</span>
            </div>
          </div>
        ))}
      </div>
      
      <p className="relative z-10 text-[11px] text-yellow-900/80 font-semibold text-center mt-4 drop-shadow">
        💰 A jóváírás automatikusan történik a hét lezárása után 💰
      </p>
    </div>
  );
};

export default WeeklyRewards;
