import { useEffect, useRef, useState } from 'react';
import loadingVideo from '@/assets/loading-video.mp4';

interface GameLoadingScreenProps {
  onVideoEnd: () => void;
}

export const GameLoadingScreen = ({ onVideoEnd }: GameLoadingScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasStarted = useRef(false);
  const hasEnded = useRef(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasStarted.current) return;

    hasStarted.current = true;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      video.play().catch((err) => {
        console.warn('[GameLoadingScreen] Autoplay failed:', err);
        if (err.name !== 'AbortError') {
          setTimeout(() => {
            onVideoEnd();
          }, 2000);
        }
      });
    };

    const handleEnded = () => {
      if (!hasEnded.current) {
        hasEnded.current = true;
        onVideoEnd();
      }
    };

    const handleError = () => {
      console.error('[GameLoadingScreen] Video loading error');
      setTimeout(() => {
        onVideoEnd();
      }, 2000);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onVideoEnd]);

  const handleVideoEnd = () => {
    if (!hasEnded.current) {
      hasEnded.current = true;
      onVideoEnd();
    }
  };

  return (
    <>
      {/* Full-screen gradient background that covers everything including status bar */}
      <div 
        className="fixed bg-gradient-to-br from-[#1a0a4e] via-[#2d1b69] to-[#1a0a4e] z-[9998]"
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
      
      {/* Video container */}
      <div className="fixed z-[9999]" style={{ 
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
          src={loadingVideo}
          onEnded={handleVideoEnd}
          onPause={(e) => {
            if (videoRef.current && !hasEnded.current && videoRef.current.currentTime < videoRef.current.duration) {
              videoRef.current.play().catch(() => {});
            }
          }}
        />
        
        {/* Loading spinner while video loads */}
        {!videoLoaded && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </>
  );
};
