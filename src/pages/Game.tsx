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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global music control - play when page loads (user just clicked Play button)
  useEffect(() => {
    const globalBgm = (window as any).__bgm as HTMLAudioElement | undefined;
    if (globalBgm) {
      try {
        globalBgm.loop = true;
        globalBgm.volume = 0.1;
        globalBgm.play().catch(() => {});
      } catch {}
      return;
    }
    const setupAudioGraph = async () => {
      if (!audioRef.current) return;
      const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      try { await audioCtxRef.current.resume(); } catch {}
      if (!sourceRef.current) {
        sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
        gainNodeRef.current = audioCtxRef.current.createGain();
        gainNodeRef.current.gain.value = 0.1; // 10%
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioCtxRef.current.destination);
      } else if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 0.1;
      }
    };

    const tryPlay = async () => {
      if (!audioRef.current) return;
      await setupAudioGraph();
      const el = audioRef.current;
      el.volume = 0.1;
      el.loop = true;
      try { 
        await el.play(); 
        console.log('Music started playing');
      } catch (e) {
        console.log('Autoplay blocked, will retry on interaction:', e);
      }
    };

    const keepVolume = () => {
      if (gainNodeRef.current && gainNodeRef.current.gain.value !== 0.1) {
        gainNodeRef.current.gain.value = 0.1;
      }
      const el = audioRef.current;
      if (el && el.volume !== 0.1) {
        el.volume = 0.1;
      }
    };

    // Try immediately (user just clicked Play)
    tryPlay();

    const volumeInterval = setInterval(keepVolume, 300);

    const onUserInteract = async () => {
      try { await audioCtxRef.current?.resume(); } catch {}
      tryPlay();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onUserInteract();
      }
    };

    window.addEventListener('pageshow', onUserInteract);
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    // Backup: retry on any interaction
    document.addEventListener('pointerdown', onUserInteract, { once: true });
    document.addEventListener('touchstart', onUserInteract, { once: true });
    document.addEventListener('click', onUserInteract, { once: true });

    return () => {
      clearInterval(volumeInterval);
      window.removeEventListener('pageshow', onUserInteract);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('pointerdown', onUserInteract);
      document.removeEventListener('touchstart', onUserInteract);
      document.removeEventListener('click', onUserInteract);
      try { audioCtxRef.current?.close(); } catch {}
      sourceRef.current = null;
      gainNodeRef.current = null;
      audioCtxRef.current = null;
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
