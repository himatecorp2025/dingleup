import { useState, useEffect, useRef } from "react";
import GamePreview from "@/components/GamePreview";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import backmusic from "@/assets/backmusic.mp3";
import gameBackground from "@/assets/game-background.jpg";
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
    // Get volume from localStorage
    const savedVolume = localStorage.getItem('music_volume');
    const savedMuted = localStorage.getItem('music_muted');
    const volumeValue = savedVolume ? parseInt(savedVolume, 10) / 100 : 0.3;
    const isMuted = savedMuted === 'true';
    
    const globalBgm = (window as any).__bgm as HTMLAudioElement | undefined;
    if (globalBgm) {
      try {
        globalBgm.loop = true;
        globalBgm.volume = isMuted ? 0 : volumeValue;
        if (!isMuted && volumeValue > 0) {
          globalBgm.play().catch(() => {});
        }
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
        gainNodeRef.current.gain.value = isMuted ? 0 : volumeValue;
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioCtxRef.current.destination);
      } else if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = isMuted ? 0 : volumeValue;
      }
    };

    const tryPlay = async () => {
      if (!audioRef.current) return;
      await setupAudioGraph();
      const el = audioRef.current;
      el.volume = isMuted ? 0 : volumeValue;
      el.loop = true;
      if (!isMuted && volumeValue > 0) {
        try { 
          await el.play(); 
          console.log('Music started playing');
        } catch (e) {
          console.log('Autoplay blocked, will retry on interaction:', e);
        }
      }
    };

    const handleVolumeChange = (e: Event) => {
      const { volume: newVolume } = (e as CustomEvent).detail;
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = newVolume;
      }
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
    };

    // Listen for volume changes from controls
    window.addEventListener('musicVolumeChange', handleVolumeChange);

    tryPlay();

    const onUserInteract = async () => {
      try { await audioCtxRef.current?.resume(); } catch {}
      tryPlay();
    };

    window.addEventListener('pageshow', onUserInteract);
    document.addEventListener('pointerdown', onUserInteract, { once: true });

    return () => {
      window.removeEventListener('musicVolumeChange', handleVolumeChange);
      window.removeEventListener('pageshow', onUserInteract);
      document.removeEventListener('pointerdown', onUserInteract);
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
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${gameBackground})` }}
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
