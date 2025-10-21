import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

interface Coin {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
  delay: number;
}

export const FallingCoins = () => {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    // Generate 15 coins with random properties
    const generatedCoins: Coin[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 8 + Math.random() * 7, // 8-15s
      size: 20 + Math.random() * 15, // 20-35px
      delay: Math.random() * 5, // 0-5s delay
    }));
    setCoins(generatedCoins);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute -top-10 animate-fall opacity-30"
          style={{
            left: `${coin.left}%`,
            animationDuration: `${coin.animationDuration}s`,
            animationDelay: `${coin.delay}s`,
          }}
        >
          <Coins
            className="text-yellow-500 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]"
            style={{ width: `${coin.size}px`, height: `${coin.size}px` }}
          />
        </div>
      ))}
    </div>
  );
};
