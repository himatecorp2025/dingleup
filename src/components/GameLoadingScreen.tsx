import { useEffect, useRef, useState } from 'react';
import loadingVideo from '@/assets/loading-video.mp4';

interface GameLoadingScreenProps {
  onVideoEnd: () => void;
}

export const GameLoadingScreen = ({ onVideoEnd }: GameLoadingScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    // Start video immediately - CRITICAL for instant playback
    if (!hasStarted.current && videoRef.current) {
      hasStarted.current = true;
      videoRef.current.currentTime = 0;
      
      // Play immediately with error fallback
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[GameLoadingScreen] Autoplay failed:', err);
          // If autoplay fails, end after 2 seconds fallback
          setTimeout(() => {
            onVideoEnd();
          }, 2000);
        });
      }
    }
  }, [onVideoEnd]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    onVideoEnd();
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-background z-[9999]">
      <video
        ref={videoRef}
        src={loadingVideo}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
      />
    </div>
  );
};
