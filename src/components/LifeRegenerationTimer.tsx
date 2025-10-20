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
    <div className="flex items-center gap-1 text-xs text-white/80">
      <Heart className="w-3 h-3" />
      <span>{timeUntilNext}</span>
    </div>
  );
};
