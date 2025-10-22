import { Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface GeniusCrownBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const GeniusCrownBadge = ({ size = 'md', showTooltip = true }: GeniusCrownBadgeProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const crownIcon = (
    <Crown 
      className={`${sizeClasses[size]} text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse`}
      style={{ animationDuration: '2s' }}
    />
  );

  if (!showTooltip) {
    return crownIcon;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{crownIcon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold text-yellow-400">Genius tag</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};