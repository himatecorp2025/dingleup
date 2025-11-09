import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import introVideo from "@/assets/introvideo.mp4";

const IntroVideo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Standalone (PWA) módban mindig loginra navigál
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');
  
  const nextPage = isStandalone ? '/login' : (searchParams.get('next') || '/login');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || fallbackTriggered) return;

    // Soft timeout: 400ms to start playback
    const softTimeout = setTimeout(() => {
      if (!videoLoaded && !fallbackTriggered) {
        console.warn('Video soft timeout - showing poster, continuing to load');
      }
    }, 400);

    // Hard timeout: 2000ms fallback to Dashboard
    const hardTimeout = setTimeout(() => {
      if (!videoLoaded && !fallbackTriggered) {
        console.warn('Video hard timeout - falling back to dashboard');
        setFallbackTriggered(true);
        try { sessionStorage.setItem('app_intro_shown', '1'); } catch {}
        navigate(nextPage);
      }
    }, 2000);

    // Ensure video is loaded and ready - instant playback
    const handleCanPlay = () => {
      if (fallbackTriggered) return;
      clearTimeout(softTimeout);
      clearTimeout(hardTimeout);
      setVideoLoaded(true);
      try { sessionStorage.setItem('app_intro_shown', '1'); } catch {}
      // Use requestAnimationFrame for smoother start
      requestAnimationFrame(() => {
        video.play().catch((err) => {
          console.error('Video playback error:', err);
          setFallbackTriggered(true);
          navigate(nextPage);
        });
      });
    };

    // Navigate when video ends
    const handleEnded = () => {
      if (fallbackTriggered) return;
      navigate(nextPage);
    };

    // Handle errors
    const handleError = (e: Event) => {
      console.error('Video loading error:', e);
      clearTimeout(softTimeout);
      clearTimeout(hardTimeout);
      if (!fallbackTriggered) {
        setFallbackTriggered(true);
        try { sessionStorage.setItem('app_intro_shown', '1'); } catch {}
        navigate(nextPage);
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Force load the video
    video.load();

    return () => {
      clearTimeout(softTimeout);
      clearTimeout(hardTimeout);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [navigate, nextPage, fallbackTriggered, videoLoaded]);

  return (
    <div className="fixed inset-0 bg-black z-50" style={{ 
      width: '100vw',
      height: '100dvh',
      overflow: 'hidden'
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
  );
};

export default IntroVideo;
