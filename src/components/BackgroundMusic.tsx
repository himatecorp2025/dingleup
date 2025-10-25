import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useBackgroundMusicStore } from '@/stores/backgroundMusicStore';
import backgroundMusic from '@/assets/DingleUP.mp3';

// Pages where background music should NOT play
const EXCLUDED_ROUTES = [
  '/', // Landing page (Index)
  '/login',
  '/register',
  '/game', // Game page
  // Note: CategorySelector is a component, not a route, handled separately in Game.tsx
];

export const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const location = useLocation();
  const { enabled, volume, loaded, loadSettings } = useBackgroundMusicStore();

  // Load settings immediately on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Initialize audio element (keep element volume at 1.0; actual loudness via GainNode)
  useEffect(() => {
    if (!audioRef.current && loaded) {
      const audio = new Audio(backgroundMusic);
      audio.loop = true;
      // Start silent until WebAudio graph is ready; fallback to store volume if graph isn't ready yet
      audio.volume = 0; 
      audioRef.current = audio;

      // Preload
      audio.load();
      
      console.log('[BackgroundMusic] Audio element created');
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [loaded]);
  // Setup Web Audio graph (AudioContext + GainNode) once audio element exists
  useEffect(() => {
    if (!audioRef.current || audioCtxRef.current) return;

    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) {
        console.warn('[BackgroundMusic] Web Audio API not supported');
        return;
      }
      const ctx: AudioContext = new AC();
      const gain = ctx.createGain();
      gain.gain.value = volume; // initial gain from store

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainRef.current = gain;
      sourceRef.current = source;

      const unlock = async () => {
        if (audioCtxRef.current?.state === 'suspended') {
          try {
            await audioCtxRef.current.resume();
            console.log('[BackgroundMusic] AudioContext resumed');
          } catch (e) {
            console.log('[BackgroundMusic] Failed to resume AudioContext', e);
          }
        }
      };
      document.addEventListener('pointerdown', unlock, { once: true } as any);
      document.addEventListener('touchstart', unlock, { once: true } as any);
      document.addEventListener('click', unlock, { once: true } as any);

      console.log('[BackgroundMusic] WebAudio graph initialized with gain:', volume);

      return () => {
        document.removeEventListener('pointerdown', unlock);
        document.removeEventListener('touchstart', unlock);
        document.removeEventListener('click', unlock);
        try { source.disconnect(); } catch {}
        try { gain.disconnect(); } catch {}
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
        }
        audioCtxRef.current = null;
        gainRef.current = null;
        sourceRef.current = null;
      };
    } catch (err) {
      console.log('[BackgroundMusic] WebAudio init failed', err);
    }
  }, [loaded]);

  // Handle volume changes in real-time
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
    if (audioRef.current) {
      audioRef.current.volume = 1; // keep element at full; gain controls loudness
    }
    console.log('[BackgroundMusic] Volume changed to:', volume, `(${Math.round(volume * 100)}%)`);
  }, [volume]);

  // Handle play/pause based on route and enabled state
  useEffect(() => {
    if (!audioRef.current || !loaded) return;

    const shouldPlay = enabled && !EXCLUDED_ROUTES.includes(location.pathname);

    if (shouldPlay) {
      // Ensure gain is set and AudioContext is running
      if (gainRef.current) {
        gainRef.current.gain.value = volume;
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch((e) => {
          console.log('[BackgroundMusic] AudioContext resume blocked', e);
        });
      }

      // Play with user interaction fallback
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('[BackgroundMusic] Autoplay prevented:', error);
          // Will be played on first user interaction
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [location.pathname, enabled, loaded, volume]);

  // No visual component
  return null;
};