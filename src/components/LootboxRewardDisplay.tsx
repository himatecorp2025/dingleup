import { useEffect, useState } from "react";
import boxGold from "@/assets/box-gold.svg";
import { Coins, Heart } from "lucide-react";

interface LootboxRewardDisplayProps {
  gold: number;
  life: number;
  onClose: () => void;
}

export const LootboxRewardDisplay = ({ gold, life, onClose }: LootboxRewardDisplayProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation immediately
    setIsVisible(true);

    // Auto-close after 1.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 1500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`relative flex flex-col items-center gap-6 p-8 transition-all duration-500 ${
          isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-3xl opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, transparent 70%)",
          }}
        />

        {/* Lootbox icon with glow */}
        <div className="relative">
          <div 
            className="absolute inset-0 blur-2xl opacity-80"
            style={{
              background: "radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, transparent 60%)",
            }}
          />
          <img 
            src={boxGold} 
            alt="Lootbox" 
            className="relative w-32 h-32 object-contain animate-pulse"
            style={{
              filter: "drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))",
            }}
          />
        </div>

        {/* Rewards container */}
        <div className="relative flex flex-col gap-4 bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-2 border-yellow-500/60 rounded-2xl p-6 backdrop-blur-md min-w-[280px]"
          style={{
            boxShadow: "0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)",
          }}
        >
          {/* Gold reward */}
          <div className="flex items-center justify-between gap-4 bg-black/30 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center"
                style={{
                  boxShadow: "0 0 20px rgba(255, 215, 0, 0.6)",
                }}
              >
                <Coins className="w-6 h-6 text-black" />
              </div>
              <span className="text-white font-bold text-lg">Aranyérme</span>
            </div>
            <span 
              className="text-3xl font-black text-yellow-400"
              style={{
                textShadow: "0 0 20px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
              +{gold}
            </span>
          </div>

          {/* Life reward */}
          <div className="flex items-center justify-between gap-4 bg-black/30 rounded-xl p-4 border border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center"
                style={{
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)",
                }}
              >
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-white font-bold text-lg">Élet</span>
            </div>
            <span 
              className="text-3xl font-black text-red-400"
              style={{
                textShadow: "0 0 20px rgba(239, 68, 68, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
              +{life}
            </span>
          </div>
        </div>

        {/* Sparkle effects */}
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yellow-400 animate-ping"
          style={{
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.8)",
          }}
        />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-yellow-400 animate-ping"
          style={{
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.8)",
            animationDelay: "0.5s",
          }}
        />
      </div>
    </div>
  );
};
