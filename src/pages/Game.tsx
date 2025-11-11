import { useState, useEffect } from "react";
import GamePreview from "@/components/GamePreview";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import gameBackground from "@/assets/game-background.jpg";
import { useAudioStore } from "@/stores/audioStore";
import { ScreenshotProtection } from "@/components/ScreenshotProtection";
const Game = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { loaded } = useAudioStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Wait for audio store to load before rendering game
  if (!loaded) {
    return (
      <div className="min-h-dvh min-h-svh flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <div className="text-white text-lg">Betöltés...</div>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="min-h-dvh min-h-svh relative flex items-center justify-center p-4">
        {/* Background extends beyond safe-area */}
        <div 
          className="absolute bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${gameBackground})`,
            left: 'calc(-1 * env(safe-area-inset-left, 0px))',
            right: 'calc(-1 * env(safe-area-inset-right, 0px))',
            top: 'calc(-1 * env(safe-area-inset-top, 0px))',
            bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
            pointerEvents: 'none'
          }}
        />
        <div className="max-w-2xl w-full bg-black/80 backdrop-blur-sm rounded-2xl p-8 text-center border-2 border-blue-500/50 relative z-10">
          <Smartphone className="w-24 h-24 mx-auto mb-6 text-blue-500" />
          <h1 className="text-4xl font-black text-white mb-4">Mobil Játék</h1>
          <p className="text-xl text-white/70 mb-8">
            Ez a játék kizárólag mobil nézetben érhető el. 
            Kérjük, nyissa meg telefonján vagy szűkítse le a böngésző ablakát!
          </p>
          <Button 
            onClick={() => navigate('/')}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Vissza a főoldalra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ScreenshotProtection enabled={true}>
      <div className="min-h-dvh min-h-svh overflow-hidden relative" style={{
        paddingTop: 'max(calc(env(safe-area-inset-top) + 2%), env(safe-area-inset-top) + 8px)'
      }}>
        {/* Status bar mask - dark gradient covering device status icons */}
        <div 
          className="fixed left-0 right-0 pointer-events-none z-[100]"
          style={{
            top: 'calc(-1 * env(safe-area-inset-top, 0px))',
            height: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.85) 70%, transparent 100%)'
          }}
        />
        <GamePreview />
      </div>
    </ScreenshotProtection>
  );
};

export default Game;
