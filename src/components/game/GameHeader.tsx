import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Button
        variant="ghost"
        size="icon"
        onClick={onExit}
        className="text-foreground hover:bg-muted"
      >
        <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
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
