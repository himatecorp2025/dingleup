import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play, Crown, Lock } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { toast } from 'sonner';

interface Video {
  id: string;
  title: string;
  description: string;
  thumb_url: string;
  video_url: string;
  duration_sec: number;
}

interface TipsVideosGridProps {
  isGenius: boolean;
  onSubscribeClick: () => void;
}

export const TipsVideosGrid = ({ isGenius, onSubscribeClick }: TipsVideosGridProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (isGenius) {
      fetchVideos();
    }
  }, [isGenius]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('tips_tricks_videos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      toast.error('Hiba a videók betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = (video: Video) => {
    if (!isGenius) {
      onSubscribeClick();
      return;
    }
    setSelectedVideo(video);
    
    // Track tips open
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'tips_open', { isGenius: true });
    }
  };

  if (!isGenius) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">Betöltés...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">Még nincsenek feltöltött videók</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => handleVideoClick(video)}
            className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all bg-gradient-to-br from-[#1a1a3e] to-[#0f0f2e]"
          >
            {/* Thumbnail */}
            <div className="aspect-video relative overflow-hidden">
              <img
                src={video.thumb_url}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center">
                {isGenius ? (
                  <div className="w-12 h-12 rounded-full bg-yellow-500/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-black fill-black ml-1" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-500/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Duration */}
              {video.duration_sec && (
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-bold">
                  {formatDuration(video.duration_sec)}
                </div>
              )}

              {/* Genius badge */}
              {!isGenius && (
                <div className="absolute top-2 left-2 bg-yellow-500/90 px-2 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3 text-black" />
                  <span className="text-xs font-black text-black">GENIUS</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="p-3">
              <h4 className="text-white font-bold text-sm line-clamp-2">{video.title}</h4>
              {video.description && (
                <p className="text-white/60 text-xs mt-1 line-clamp-1">{video.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo.video_url}
          title={selectedVideo.title}
          videoId={selectedVideo.id}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Non-Genius Overlay */}
      {!isGenius && videos.length > 0 && (
        <div className="mt-4 p-6 bg-gradient-to-br from-yellow-500/20 to-red-500/20 border-2 border-yellow-500/50 rounded-xl text-center">
          <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-bounce" />
          <h3 className="text-xl font-black text-white mb-2">Genius Exkluzív Tartalom</h3>
          <p className="text-white/80 mb-4">
            A Tippek & Trükkök videók csak Genius tagoknak érhetők el
          </p>
          <button
            onClick={onSubscribeClick}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-black px-6 py-3 rounded-lg transition-all shadow-lg"
          >
            Előfizetek most!
          </button>
        </div>
      )}
    </>
  );
};