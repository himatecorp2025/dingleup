import { useState, useEffect } from "react";
import GamePreview from "@/components/GamePreview";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import gameBackground from "@/assets/game-background.png";
import { useAudioStore } from "@/stores/audioStore";
import { ScreenshotProtection } from "@/components/ScreenshotProtection";
import { GameErrorBoundary } from "@/components/GameErrorBoundary";
import { useI18n } from "@/i18n";
import AudioManager from "@/lib/audioManager";

const Game = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const navigate = useNavigate();
  const { musicEnabled, volume, loaded } = useAudioStore();
  const { t } = useI18n();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force play game music when Game page mounts on mobile
  useEffect(() => {
    if (!isMobile || !loaded) return;

    console.log('[Game Page] Mounted - forcing game music to play', {
      musicEnabled,
      volume,
      isMobile
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
  }, [isMobile, musicEnabled, volume, loaded]);

  if (!isMobile) {
    return (
      <div className="min-h-dvh min-h-svh relative flex items-center justify-center p-4">
        {/* Background extends beyond safe-area */}
        <div 
          className="absolute bg-cover bg-no-repeat"
          style={{ 
            backgroundImage: `url(${gameBackground})`,
            backgroundPosition: '50% 50%',
            left: 'calc(-1 * env(safe-area-inset-left, 0px))',
            right: 'calc(-1 * env(safe-area-inset-right, 0px))',
            top: 'calc(-1 * env(safe-area-inset-top, 0px))',
            bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
            pointerEvents: 'none'
          }}
        />
        <div className="max-w-2xl w-full bg-background/80 backdrop-blur-sm rounded-2xl p-8 text-center border-2 border-primary/50 relative z-10">
          <Smartphone className="w-24 h-24 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-black text-foreground mb-4">{t('game.mobile_only')}</h1>
          <p className="text-xl text-foreground/70 mb-8">
            {t('game.mobile_description')}
          </p>
          <Button 
            onClick={() => navigate('/')}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            {t('game.back_home')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GameErrorBoundary>
      <ScreenshotProtection enabled={true}>
        <div className="min-h-dvh min-h-svh overflow-hidden relative" style={{
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
