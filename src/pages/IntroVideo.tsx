import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import introVideo from "@/assets/introvideo.mp4";

const IntroVideo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const nextPage = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video is loaded and ready
    const handleCanPlay = () => {
      setVideoLoaded(true);
      video.play().catch(() => {
        // Force play even if autoplay is blocked
        video.play();
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
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center min-h-dvh min-h-svh">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="auto"
        src={introVideo}
      />
      {!videoLoaded && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default IntroVideo;
