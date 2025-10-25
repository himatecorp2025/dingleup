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
  const location = useLocation();
  const { enabled, volume, loaded, loadSettings } = useBackgroundMusicStore();

  // Load settings on mount
  useEffect(() => {
    if (!loaded) {
      loadSettings();
    }
  }, [loaded, loadSettings]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(backgroundMusic);
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;

      // Preload
      audio.load();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle play/pause based on route and enabled state
  useEffect(() => {
    if (!audioRef.current || !loaded) return;

    const shouldPlay = enabled && !EXCLUDED_ROUTES.includes(location.pathname);

    if (shouldPlay) {
      // Play with user interaction fallback
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Background music autoplay prevented:', error);
          // Will be played on first user interaction
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [location.pathname, enabled, loaded]);

  // No visual component
  return null;
};