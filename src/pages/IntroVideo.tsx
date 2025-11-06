import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import introVideo from "@/assets/introvideo.mp4";

const IntroVideo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Standalone (PWA) módban mindig loginra navigál
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');
  
  const nextPage = isStandalone ? '/login' : (searchParams.get('next') || '/login');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is loaded and ready - instant playback
    const handleCanPlay = () => {
      setVideoLoaded(true);
      try { sessionStorage.setItem('app_intro_shown', '1'); } catch {}
      // Use requestAnimationFrame for smoother start
      requestAnimationFrame(() => {
        video.play().catch(() => video.play());
      });
    };

    // Navigate when video ends
    const handleEnded = () => {
      navigate(nextPage);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    // Force load the video
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [navigate, nextPage]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden" style={{ 
      minHeight: '100dvh',
      height: '100dvh'
    }}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          objectFit: 'cover',
          willChange: 'transform',
          minHeight: '100%',
          minWidth: '100%'
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
