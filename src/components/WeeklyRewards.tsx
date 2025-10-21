import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Coins, Heart } from 'lucide-react';

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
    <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border-2 border-yellow-500/40 backdrop-blur-sm mb-4 px-3 py-3 sm:px-4 sm:py-4" 
      style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
      <div className="text-center">
        <div className="flex items-center gap-2 justify-center mb-1">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-white font-bold">Heti Jutalmak</span>
        </div>
        <p className="text-[10px] text-white/70">
          Minden vasárnap 23:55-kor lezárul a rangsorolás. 5 perc szünet után hétfő 00:00-kor kihirdetjük a nyerteseket!
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {rewards.map((reward, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-2 ${
              index < 3
                ? 'border-yellow-500/50 bg-yellow-500/10'
                : 'border-purple-500/30 bg-black/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-bold text-sm">{reward.place}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Coins className="w-3 h-3 text-yellow-500" />
              <span className="text-white">{reward.coins}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Heart className="w-3 h-3 text-red-500" />
              <span className="text-white">{reward.lives}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/50 text-center mt-3">
        A jóváírás automatikusan történik a hét lezárása után.
      </p>
    </div>
  );
};

export default WeeklyRewards;
