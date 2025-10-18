import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import introVideo from "@/assets/introvideo.mp4";

const IntroVideo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextPage = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-play video
    video.play().catch(err => {
      console.log('Auto-play prevented:', err);
      // If auto-play fails, navigate after timeout
      setTimeout(() => navigate(nextPage), 100);
    });

    // Navigate when video ends
    const handleEnded = () => {
      navigate(nextPage);
    };

    video.addEventListener('ended', handleEnded);

    // Safety timeout in case video doesn't end properly
    const timeout = setTimeout(() => {
      navigate(nextPage);
    }, 4000);

    return () => {
      video.removeEventListener('ended', handleEnded);
      clearTimeout(timeout);
    };
  }, [navigate, nextPage]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        src={introVideo}
      />
    </div>
  );
};

export default IntroVideo;
