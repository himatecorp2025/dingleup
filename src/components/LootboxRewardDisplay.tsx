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
        className={`relative flex flex-col items-center transition-all duration-500 ${
          isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
        style={{ gap: 'clamp(1rem, 3vh, 1.5rem)', padding: 'clamp(1.5rem, 4vh, 2rem)' }}
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
            className="relative object-contain animate-pulse"
            style={{
              width: 'clamp(80px, 20vw, 128px)',
              height: 'clamp(80px, 20vw, 128px)',
              filter: "drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))",
            }}
          />
        </div>

        {/* Rewards container */}
        <div className="relative flex flex-col bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-2 border-yellow-500/60 backdrop-blur-md"
          style={{
            gap: 'clamp(0.75rem, 2vh, 1rem)',
            padding: 'clamp(1rem, 3vh, 1.5rem)',
            borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
            minWidth: 'clamp(240px, 70vw, 280px)',
            boxShadow: "0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)",
          }}
        >
          {/* Gold reward */}
          <div className="flex items-center justify-between bg-black/30 border border-yellow-500/30"
            style={{
              gap: 'clamp(0.75rem, 2vw, 1rem)',
              padding: 'clamp(0.75rem, 2vh, 1rem)',
              borderRadius: 'clamp(0.5rem, 1.5vw, 0.75rem)'
            }}
          >
            <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              <div className="rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center"
                style={{
                  width: 'clamp(32px, 8vw, 40px)',
                  height: 'clamp(32px, 8vw, 40px)',
                  boxShadow: "0 0 20px rgba(255, 215, 0, 0.6)",
                }}
              >
                <Coins style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }} className="text-black" />
              </div>
              <span className="text-white font-bold" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)' }}>Aranyérme</span>
            </div>
            <span 
              className="font-black text-yellow-400"
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
                textShadow: "0 0 20px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
              +{gold}
            </span>
          </div>

          {/* Life reward */}
          <div className="flex items-center justify-between bg-black/30 border border-red-500/30"
            style={{
              gap: 'clamp(0.75rem, 2vw, 1rem)',
              padding: 'clamp(0.75rem, 2vh, 1rem)',
              borderRadius: 'clamp(0.5rem, 1.5vw, 0.75rem)'
            }}
          >
            <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              <div className="rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center"
                style={{
                  width: 'clamp(32px, 8vw, 40px)',
                  height: 'clamp(32px, 8vw, 40px)',
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)",
                }}
              >
                <Heart style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }} className="text-white fill-white" />
              </div>
              <span className="text-white font-bold" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)' }}>Élet</span>
            </div>
            <span 
              className="font-black text-red-400"
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
                textShadow: "0 0 20px rgba(239, 68, 68, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
              +{life}
            </span>
          </div>
        </div>

        {/* Sparkle effects */}
        <div className="absolute rounded-full bg-yellow-400 animate-ping"
          style={{
            top: 'clamp(-0.5rem, -1vw, -0.25rem)',
            right: 'clamp(-0.5rem, -1vw, -0.25rem)',
            width: 'clamp(12px, 3vw, 16px)',
            height: 'clamp(12px, 3vw, 16px)',
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.8)",
          }}
        />
        <div className="absolute rounded-full bg-yellow-400 animate-ping"
          style={{
            bottom: 'clamp(-0.5rem, -1vw, -0.25rem)',
            left: 'clamp(-0.5rem, -1vw, -0.25rem)',
            width: 'clamp(12px, 3vw, 16px)',
            height: 'clamp(12px, 3vw, 16px)',
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.8)",
            animationDelay: "0.5s",
          }}
        />
      </div>
    </div>
  );
};
