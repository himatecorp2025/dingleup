import { useEffect } from "react";
import GamePreview from "@/components/GamePreview";
import { useNavigate } from "react-router-dom";
import gameBackground from "@/assets/game-background.png";
import { useAudioStore } from "@/stores/audioStore";
import { ScreenshotProtection } from "@/components/ScreenshotProtection";
import { GameErrorBoundary } from "@/components/GameErrorBoundary";
import AudioManager from "@/lib/audioManager";
import { useFullscreen } from "@/hooks/useFullscreen";

const Game = () => {
  const navigate = useNavigate();
  const { musicEnabled, volume, loaded } = useAudioStore();

  // FULLSCREEN MODE: Hide status bar on mobile devices
  useFullscreen({
    enabled: true,
    autoReenter: true,
  });

  // CRITICAL: Game is MOBILE-ONLY - redirect desktop users
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Force play game music when Game page mounts (mobile-only)
  useEffect(() => {
    if (!loaded) return;

    console.log('[Game Page] Mounted - forcing game music to play', {
      musicEnabled,
      volume
    });

    if (musicEnabled && volume > 0) {
      const audioManager = AudioManager.getInstance();
      // Multiple attempts to ensure music starts
      const attemptPlay = async () => {
        await audioManager.forcePlay();
      };

      // Immediate attempt
      attemptPlay();

      // Retry after 200ms
      const timer = setTimeout(attemptPlay, 200);

      return () => clearTimeout(timer);
    }
  }, [musicEnabled, volume, loaded]);

  return (
    <GameErrorBoundary>
      <ScreenshotProtection enabled={true}>
        <div className="h-dvh overflow-hidden relative" style={{
          paddingTop: 'max(calc(env(safe-area-inset-top) + 2%), env(safe-area-inset-top) + 8px)'
        }}>
          {/* Fixed background layer - extends beyond safe-area, does NOT scroll */}
          <div 
            className="fixed bg-cover bg-no-repeat"
            style={{ 
              backgroundImage: `url(${gameBackground})`,
              backgroundPosition: '50% 50%',
              left: 'calc(-1 * env(safe-area-inset-left, 0px))',
              right: 'calc(-1 * env(safe-area-inset-right, 0px))',
              top: 'calc(-1 * env(safe-area-inset-top, 0px))',
              bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
          <div className="relative z-10">
            <GamePreview />
          </div>
        </div>
      </ScreenshotProtection>
    </GameErrorBoundary>
  );
};

export default Game;
