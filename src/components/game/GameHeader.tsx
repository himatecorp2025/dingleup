import { LogOut } from "lucide-react";
import { DiamondHexagon } from "@/components/DiamondHexagon";

interface GameHeaderProps {
  lives: number;
  maxLives: number;
  coins: number;
  onExit: () => void;
}

export const GameHeader = ({ lives, maxLives, coins, onExit }: GameHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-2 px-2 sm:px-3 md:px-4">
      {/* Exit button with 3D Box Style matching Leaderboard back button */}
      <button
        onClick={onExit}
        className="relative p-3 rounded-full hover:scale-110 transition-all"
        title="Kilépés a játékból"
        aria-label="Kilépés a játékból"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExit();
          }
        }}
      >
        {/* BASE SHADOW */}
        <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
        
        {/* OUTER FRAME */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
        
        {/* MIDDLE FRAME */}
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
        
        {/* INNER LAYER */}
        <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
        
        {/* SPECULAR HIGHLIGHT */}
        <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
        
        {/* Icon */}
        <LogOut className="w-6 h-6 text-white relative z-10 -scale-x-100" />
      </button>

      <div className="flex gap-2 sm:gap-3 md:gap-4">
        <DiamondHexagon
          type="lives"
          value={`${lives}/${maxLives}`}
        />
        <DiamondHexagon
          type="coins"
          value={coins}
        />
      </div>
    </div>
  );
};
