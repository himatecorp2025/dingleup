import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import introVideo from "@/assets/introvideo.mp4";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useNativeFullscreen } from "@/hooks/useNativeFullscreen";

const IntroVideo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // FULLSCREEN MODE: Hide status bar on mobile devices (Web)
  useFullscreen({
    enabled: true,
    autoReenter: true,
  });

  // NATIVE FULLSCREEN: Hide status bar on iOS/Android Capacitor apps
  useNativeFullscreen();
  
  // PWA/Standalone mode detection
  const isStandalone = (() => {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    // OPTIMIZED: Check if user is already logged in - skip intro if so
    const checkSessionAndIntro = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If user is logged in, go straight to dashboard
      if (session?.user) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // Check if intro was already shown (use localStorage for persistence across cold starts)
      const introShown = localStorage.getItem('app_intro_shown');
      if (introShown && !isStandalone) {
        navigate('/auth/choice', { replace: true });
        return;
      }

      // For standalone mode, only show intro once per install
      if (isStandalone && introShown) {
        navigate('/auth/choice', { replace: true });
        return;
      }
    };

    checkSessionAndIntro();

    const video = videoRef.current;
    if (!video || fallbackTriggered) return;

    // OPTIMIZED: Longer timeout for iOS (5s) to allow video loading
    const hardTimeout = setTimeout(() => {
      if (!videoLoaded && !fallbackTriggered) {
        console.warn('Video loading timeout - skipping intro');
        setFallbackTriggered(true);
        try { localStorage.setItem('app_intro_shown', '1'); } catch {}
        navigate('/auth/choice', { replace: true });
      }
    }, 5000);

    // Video loaded and ready - play it
    const handleCanPlay = () => {
      if (fallbackTriggered) return;
      clearTimeout(hardTimeout);
      setVideoLoaded(true);
      try { localStorage.setItem('app_intro_shown', '1'); } catch {}
      
      requestAnimationFrame(() => {
        video.play().catch((err) => {
          console.error('Video playback error:', err);
          setFallbackTriggered(true);
          navigate('/auth/choice', { replace: true });
        });
      });
    };

    // Navigate when video ends
    const handleEnded = () => {
      if (fallbackTriggered) return;
      navigate('/auth/choice', { replace: true });
    };

    // Handle errors - skip intro on error
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      clearTimeout(hardTimeout);
      if (!fallbackTriggered) {
        setFallbackTriggered(true);
        try { localStorage.setItem('app_intro_shown', '1'); } catch {}
        navigate('/auth/choice', { replace: true });
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    video.load();

    return () => {
      clearTimeout(hardTimeout);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [navigate, fallbackTriggered, videoLoaded, isStandalone]);

  return (
    <>
      {/* Gradient background while loading */}
      <div 
        className="fixed bg-gradient-to-br from-primary via-primary-dark to-primary z-40"
        style={{
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          width: 'calc(100vw + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
          height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none'
        }}
      />
      <div className="fixed z-50" style={{ 
        left: 'calc(-1 * env(safe-area-inset-left, 0px))',
        right: 'calc(-1 * env(safe-area-inset-right, 0px))',
        top: 'calc(-1 * env(safe-area-inset-top, 0px))',
        bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
        width: 'calc(100vw + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
        height: 'calc(100dvh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
        overflow: 'hidden',
        backgroundColor: '#000'
      }}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            objectFit: 'cover',
            objectPosition: 'center',
            width: '100%',
            height: '100%'
          }}
          muted
          playsInline
          preload="auto"
          src={introVideo}
        />
        {!videoLoaded && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </>
  );
};

export default IntroVideo;
