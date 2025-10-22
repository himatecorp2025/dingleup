import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onClose: () => void;
}

export const VideoPlayer = ({ videoUrl, title, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    // Enter fullscreen on mount
    const enterFullscreen = async () => {
      try {
        if (videoRef.current) {
          if (videoRef.current.requestFullscreen) {
            await videoRef.current.requestFullscreen();
          } else if ((videoRef.current as any).webkitRequestFullscreen) {
            await (videoRef.current as any).webkitRequestFullscreen();
          }
        }
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    };

    enterFullscreen();

    // Handle fullscreen change
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      {/* Close button - top right */}
      <Button
        onClick={handleClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-[10000] w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Video player with native controls */}
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        controlsList="nodownload"
        playsInline
        className="w-full h-full object-contain"
        autoPlay
      >
        <source src={videoUrl} type="video/mp4" />
        A böngésződ nem támogatja a videó lejátszást.
      </video>

      {/* Title overlay (optional) */}
      <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
        <p className="text-white text-lg font-bold drop-shadow-lg px-4 py-2 bg-black/40 inline-block rounded-lg">
          {title}
        </p>
      </div>
    </div>
  );
};