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

  // Load settings immediately on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Initialize audio element with proper volume
  useEffect(() => {
    if (!audioRef.current && loaded) {
      const audio = new Audio(backgroundMusic);
      audio.loop = true;
      audio.volume = volume; // Use loaded volume from store
      audioRef.current = audio;

      // Preload
      audio.load();
      
      console.log('[BackgroundMusic] Audio initialized with volume:', volume);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [loaded, volume]);

  // Handle volume changes in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      console.log('[BackgroundMusic] Volume changed to:', volume, `(${Math.round(volume * 100)}%)`);
    }
  }, [volume]);

  // Handle play/pause based on route and enabled state
  useEffect(() => {
    if (!audioRef.current || !loaded) return;

    const shouldPlay = enabled && !EXCLUDED_ROUTES.includes(location.pathname);

    if (shouldPlay) {
      // Ensure volume is set before playing
      audioRef.current.volume = volume;
      
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