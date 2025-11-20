import { useEffect, useState } from "react";

interface CoinRewardAnimationProps {
  amount: number;
  trigger: number; // increment this to trigger new animation
}

export const CoinRewardAnimation = ({ amount, trigger }: CoinRewardAnimationProps) => {
  const [visible, setVisible] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(amount);

  useEffect(() => {
    if (trigger > 0) {
      setCurrentAmount(amount);
      setVisible(true);
      // NO automatic hide - stays visible until next question
    } else if (trigger === 0) {
      // Hide when trigger resets to 0 (new question)
      setVisible(false);
    }
  }, [trigger, amount]);

  if (!visible) return null;

  // Use the same success green color from the game (--success: 88 80% 60%)
  const successGreen = "88, 80%, 60%";

  return (
    <div
      className="flex items-center gap-1"
      style={{
        animation: "coinPop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {/* Neon glow container */}
      <div className="relative">
        {/* Multiple glow layers for intense neon effect */}
        <div 
          className="absolute inset-0 blur-xl opacity-80 animate-pulse"
          style={{
            background: `radial-gradient(circle, hsl(${successGreen}) 0%, transparent 70%)`,
          }}
        />
        <div 
          className="absolute inset-0 blur-lg opacity-90"
          style={{
            background: `radial-gradient(circle, hsl(${successGreen}) 0%, transparent 60%)`,
          }}
        />
        
        {/* Main content with casino-style animation */}
        <div className="relative flex items-center gap-1 px-3 py-1.5 rounded-lg"
          style={{
            background: `linear-gradient(135deg, hsl(88, 80%, 35%) 0%, hsl(88, 80%, 45%) 100%)`,
            boxShadow: `
              0 0 20px hsl(${successGreen}),
              0 0 40px hsl(88, 80%, 50%),
              0 0 60px hsl(88, 80%, 40%),
              inset 0 0 20px hsl(88, 80%, 70%)
            `,
            border: `2px solid hsl(${successGreen})`,
          }}
        >
          {/* Amount text with extra glow - NO ICON */}
          <span 
            className="font-bold text-lg tracking-wider"
            style={{
              color: "hsl(88, 100%, 95%)",
              textShadow: `
                0 0 10px hsl(88, 80%, 70%),
                0 0 20px hsl(${successGreen}),
                0 0 30px hsl(88, 80%, 50%),
                0 2px 4px rgba(0, 0, 0, 0.8)
              `,
            }}
          >
            +{currentAmount}
          </span>
        </div>

        {/* Sparkle effects */}
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping"
          style={{
            background: `hsl(${successGreen})`,
            boxShadow: `0 0 10px hsl(${successGreen})`,
          }}
        />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full animate-ping"
          style={{
            background: `hsl(${successGreen})`,
            boxShadow: `0 0 10px hsl(${successGreen})`,
            animationDelay: "0.3s",
          }}
        />
      </div>
      
      <style>{`
        @keyframes coinPop {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
