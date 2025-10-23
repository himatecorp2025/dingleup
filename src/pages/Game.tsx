import { useState, useEffect, useRef } from "react";
import GamePreview from "@/components/GamePreview";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Smartphone } from "lucide-react";
import backmusic from "@/assets/backmusic.mp3";
import gameBackground from "@/assets/game-background.jpg";
import { useAudioStore } from "@/stores/audioStore";
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

  // Global music control - singleton instance
  useEffect(() => {
    // Load settings FIRST, then get the values
    useAudioStore.getState().loadSettings();
    const { volume, musicEnabled } = useAudioStore.getState();
    
    console.log('[Game] Loading audio settings:', { volume, musicEnabled });
    
    // Check if global audio already exists
    const existingBgm = (window as any).__bgm as HTMLAudioElement | undefined;
    if (existingBgm) {
      existingBgm.volume = volume;
      if (musicEnabled && volume > 0) {
        existingBgm.play().catch(() => {});
      } else if (!musicEnabled) {
        existingBgm.pause();
      }
      console.log('[Game] Applied settings to existing audio');
      return;
    }
    
    // Create singleton audio instance
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = volume;
    (window as any).__bgm = audio;
    
    const setupAudioGraph = async () => {
      const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      try { await audioCtxRef.current.resume(); } catch {}
      if (!sourceRef.current) {
        sourceRef.current = audioCtxRef.current.createMediaElementSource(audio);
        gainNodeRef.current = audioCtxRef.current.createGain();
        gainNodeRef.current.gain.value = volume;
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioCtxRef.current.destination);
      }
    };

    const tryPlay = async () => {
      await setupAudioGraph();
      if (musicEnabled && volume > 0) {
        try { 
          await audio.play(); 
          console.log('[Game] Music started');
        } catch (e) {
          console.log('[Game] Autoplay blocked:', e);
        }
      }
    };

    // Subscribe to store changes
    const unsubscribe = useAudioStore.subscribe((state) => {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = state.volume;
      }
      audio.volume = state.volume;
      
      if (state.musicEnabled && state.volume > 0 && audio.paused) {
        audio.play().catch(() => {});
      } else if (!state.musicEnabled && !audio.paused) {
        audio.pause();
      }
    });

    tryPlay();

    const onUserInteract = async () => {
      try { await audioCtxRef.current?.resume(); } catch {}
      tryPlay();
    };

    document.addEventListener('pointerdown', onUserInteract, { once: true });

    return () => {
      unsubscribe();
      document.removeEventListener('pointerdown', onUserInteract);
      // Don't clean up audio - it's a singleton
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
