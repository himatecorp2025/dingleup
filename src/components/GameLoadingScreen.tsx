import { useEffect, useRef } from 'react';
import loadingVideo from '@/assets/loading-video.mp4';

export const GameLoadingScreen = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error('Video autoplay failed:', err);
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black z-50">
      <video
        ref={videoRef}
        src={loadingVideo}
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
    </div>
  );
};
