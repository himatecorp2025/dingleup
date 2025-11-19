import { useEffect, useRef } from 'react';
import loadingVideo from '@/assets/loading-video.mp4';

interface GameLoadingScreenProps {
  onVideoEnd: () => void;
}

export const GameLoadingScreen = ({ onVideoEnd }: GameLoadingScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!hasStarted.current && videoRef.current) {
      hasStarted.current = true;
      videoRef.current.currentTime = 0;
      
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[GameLoadingScreen] Autoplay failed:', err);
          setTimeout(() => {
            onVideoEnd();
          }, 2000);
        });
      }
    }
  }, [onVideoEnd]);

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
        onEnded={onVideoEnd}
      />
    </div>
  );
};
