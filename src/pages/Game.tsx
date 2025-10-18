import { useState, useEffect, useRef } from "react";
import GamePreview from "@/components/GamePreview";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import backmusic from "@/assets/backmusic.mp3";

const Game = () => {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global music control for /game lifecycle
  useEffect(() => {
    const tryPlay = async () => {
      if (!audioRef.current) return;
      try {
        audioRef.current.volume = 0.1;
        audioRef.current.loop = true;
        await audioRef.current.play();
      } catch {
        // Autoplay blocked – retry on first interaction
      }
    };

    const keepVolume = () => {
      if (audioRef.current && audioRef.current.volume !== 0.1) {
        audioRef.current.volume = 0.1;
      }
    };

    tryPlay();
    const volumeInterval = setInterval(keepVolume, 200);

    const onUserInteract = () => tryPlay();
    document.addEventListener('pointerdown', onUserInteract, { once: true });
    document.addEventListener('touchstart', onUserInteract, { once: true });
    document.addEventListener('click', onUserInteract, { once: true });

    return () => {
      clearInterval(volumeInterval);
      document.removeEventListener('pointerdown', onUserInteract);
      document.removeEventListener('touchstart', onUserInteract);
      document.removeEventListener('click', onUserInteract);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-black/80 backdrop-blur-sm rounded-2xl p-8 text-center border-2 border-blue-500/50">
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
    <>
      <audio ref={audioRef} loop preload="auto" playsInline>
        <source src={backmusic} type="audio/mpeg" />
      </audio>
      <div className="min-h-screen overflow-hidden">
        <GamePreview audioRef={audioRef} />
      </div>
    </>
  );
};

export default Game;
