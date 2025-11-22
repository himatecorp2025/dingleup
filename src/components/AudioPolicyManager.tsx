import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAudioStore } from "@/stores/audioStore";
import AudioManager from "@/lib/audioManager";

const MUSIC_BLOCKED_ROUTES = [
  /^\/$/,               // Landing page
  /^\/desktop$/,        // Desktop landing page
  /^\/admin/,           // All admin routes including subpages
  /^\/admin-/,          // Any admin-prefixed routes
  /\/admin\//,          // Any path containing /admin/
];

function isMusicAllowed(pathname: string): boolean {
  const blocked = MUSIC_BLOCKED_ROUTES.some(pattern => pattern.test(pathname));
  return !blocked;
}

export const AudioPolicyManager = () => {
  const location = useLocation();

  useEffect(() => {
    const applyAudioPolicy = () => {
      const { musicEnabled, volume, loaded } = useAudioStore.getState();
      
      if (!loaded) {
        return;
      }

      const audioManager = AudioManager.getInstance();
      
      // Platform detection: music ONLY on mobile/tablet, NEVER on desktop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       window.matchMedia('(max-width: 1024px)').matches;
      
      if (!isMobile) {
        audioManager.apply(false, 0);
        return;
      }
      
      // Check if music is allowed on current route (blocks admin & landing page)
      const musicAllowed = isMusicAllowed(location.pathname);
      
      if (!musicAllowed) {
        audioManager.apply(false, 0);
        return;
      }
      
      // Mobile/Tablet on allowed routes: Switch track based on route
      const isGameRoute = location.pathname === '/game';
      
      if (isGameRoute) {
        audioManager.switchTrack('game');
      } else {
        audioManager.switchTrack('general');
      }

      audioManager.apply(musicEnabled, volume);
      
      // CRITICAL: On game route, explicitly force play to ensure music starts
      // This works because navigation to /game happens via user interaction (Play Now button click)
      if (isGameRoute && musicEnabled && volume > 0) {
        // Small delay to ensure AudioManager state is fully updated
        setTimeout(() => {
          audioManager.forcePlay().then(() => {
            const state = audioManager.getState();
            console.log('[AudioPolicy] Game music force-started', { 
              track: state.track, 
              paused: state.paused,
              enabled: state.enabled,
              volume: state.volume
            });
          });
        }, 100);
      }
    };

    applyAudioPolicy();
    
    const unsubscribe = useAudioStore.subscribe((state) => {
      if (state.loaded) {
        applyAudioPolicy();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [location.pathname]);

  return null;
};
