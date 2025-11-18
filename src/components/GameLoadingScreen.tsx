import { useEffect, useRef } from 'react';
import loadingVideo from '@/assets/loading-video.mp4';

export const GameLoadingScreen = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Force play from beginning
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.error('Video autoplay failed:', err);
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-[9999]">
      <video
        ref={videoRef}
        src={loadingVideo}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
    </div>
  );
};
