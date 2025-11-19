import { useEffect, useRef } from 'react';
import loadingVideo from '@/assets/loading-video.mp4';

interface GameLoadingScreenProps {
  onVideoEnd: () => void;
}

export const GameLoadingScreen = ({ onVideoEnd }: GameLoadingScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasStarted = useRef(false);
  const hasEnded = useRef(false);

  useEffect(() => {
    if (!hasStarted.current && videoRef.current) {
      hasStarted.current = true;
      videoRef.current.currentTime = 0;
      
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[GameLoadingScreen] Autoplay failed:', err);
          // Only call onVideoEnd if video truly failed, not on abort
          if (err.name !== 'AbortError') {
            setTimeout(() => {
              onVideoEnd();
            }, 2000);
          }
        });
      }
    }
  }, [onVideoEnd]);

  const handleVideoEnd = () => {
    // Ensure onVideoEnd is called only once when video truly completes
    if (!hasEnded.current) {
      hasEnded.current = true;
      onVideoEnd();
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-[9999]">
      <video
        ref={videoRef}
        src={loadingVideo}
        className="w-full h-full object-cover bg-black"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
        onPause={(e) => {
          // Prevent accidental pause - keep playing until end
          if (videoRef.current && !hasEnded.current && videoRef.current.currentTime < videoRef.current.duration) {
            videoRef.current.play().catch(() => {});
          }
        }}
      />
    </div>
  );
};
