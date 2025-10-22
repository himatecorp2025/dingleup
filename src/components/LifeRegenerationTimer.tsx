import { Heart } from 'lucide-react';
import { useLifeRegeneration } from '@/hooks/useLifeRegeneration';

interface LifeRegenerationTimerProps {
  currentLives: number;
  maxLives: number;
  lastRegeneration: string | null;
  boosterActive: boolean;
  boosterType: string | null;
  boosterExpiresAt: string | null;
}

export const LifeRegenerationTimer = ({
  currentLives,
  maxLives,
  lastRegeneration,
  boosterActive,
  boosterType,
  boosterExpiresAt
}: LifeRegenerationTimerProps) => {
  const { timeUntilNext, shouldShowTimer } = useLifeRegeneration({
    currentLives,
    maxLives,
    lastRegeneration,
    boosterActive,
    boosterType,
    boosterExpiresAt
  });

  if (!shouldShowTimer) return null;

  return (
    <div 
      className="bg-red-500 border border-red-400 rounded px-1.5 py-0.5 shadow-[0_0_8px_rgba(239,68,68,0.6)] text-[8px] sm:text-[9px]"
      title="Következő élet regenerálás"
    >
      <span className="font-extrabold text-white drop-shadow leading-none whitespace-nowrap">
        {timeUntilNext}
      </span>
    </div>
  );
};
