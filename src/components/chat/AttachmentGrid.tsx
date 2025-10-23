import { useState } from 'react';
import { FileText, File, Archive, Music, Video, Image as ImageIcon } from 'lucide-react';
import { ImageViewer } from './ImageViewer';

interface MediaItem {
  media_url: string;
  media_type: string;
  thumbnail_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  mime_type?: string | null;
}

interface AttachmentGridProps {
  media: MediaItem[];
}

const formatFileSize = (bytes: number | null | undefined) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDuration = (ms: number | null | undefined) => {
  if (!ms) return '';
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getFileIcon = (mimeType: string | null | undefined) => {
  if (!mimeType) return <File className="w-8 h-8" />;
  
  if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-400" />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-8 h-8 text-blue-400" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileText className="w-8 h-8 text-green-400" />;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <FileText className="w-8 h-8 text-orange-400" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return <Archive className="w-8 h-8 text-yellow-400" />;
  if (mimeType.includes('audio')) return <Music className="w-8 h-8 text-purple-400" />;
  if (mimeType.includes('video')) return <Video className="w-8 h-8 text-pink-400" />;
  if (mimeType.includes('image')) return <ImageIcon className="w-8 h-8 text-[#D4AF37]" />;
  
  return <File className="w-8 h-8" />;
};

export const AttachmentGrid = ({ media }: AttachmentGridProps) => {
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  if (!media || media.length === 0) return null;

  const images = media.filter(m => m.media_type === 'image' || m.mime_type?.includes('image'));
  const videos = media.filter(m => m.media_type === 'video' || m.mime_type?.includes('video'));
  const audios = media.filter(m => m.media_type === 'audio' || m.mime_type?.includes('audio'));
  const documents = media.filter(m => 
    m.media_type === 'document' || 
    m.mime_type?.includes('pdf') || 
    m.mime_type?.includes('document') || 
    m.mime_type?.includes('word') ||
    m.mime_type?.includes('sheet') ||
    m.mime_type?.includes('presentation')
  );
  const others = media.filter(m => 
    !images.includes(m) && 
    !videos.includes(m) && 
    !audios.includes(m) && 
    !documents.includes(m)
  );

  return (
    <div className="space-y-2 mt-2">
      {/* Images Grid */}
      {images.length > 0 && (
        <div className={`grid gap-1 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {images.map((img, idx) => (
            <div 
              key={idx}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setViewerImage(img.media_url)}
            >
              <img 
                src={img.thumbnail_url || img.media_url} 
                alt={img.file_name || 'Kép'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.map((video, idx) => (
        <div key={`video-${idx}`} className="rounded-lg overflow-hidden bg-black/50 relative">
          {video.thumbnail_url ? (
            <div className="relative">
              <img 
                src={video.thumbnail_url} 
                alt={video.file_name || 'Videó'}
                className="w-full max-h-64 object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Video className="w-12 h-12 text-white" />
              </div>
              {video.duration_ms && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration_ms)}
                </div>
              )}
            </div>
          ) : (
            <video 
              src={video.media_url} 
              controls 
              className="w-full max-h-64"
              preload="metadata"
            />
          )}
          {video.file_name && (
            <div className="p-2 text-xs text-white/70 truncate">{video.file_name}</div>
          )}
        </div>
      ))}

      {/* Audio */}
      {audios.map((audio, idx) => (
        <div key={`audio-${idx}`} className="rounded-lg bg-[#1a1a1a] border border-[#D4AF37]/20 p-3">
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-6 h-6 text-purple-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{audio.file_name || 'Audió fájl'}</p>
              <p className="text-xs text-white/50">
                {formatFileSize(audio.file_size)} {audio.duration_ms && `• ${formatDuration(audio.duration_ms)}`}
              </p>
            </div>
          </div>
          <audio src={audio.media_url} controls className="w-full" />
        </div>
      ))}

      {/* Documents */}
      {documents.map((doc, idx) => (
        <a
          key={`doc-${idx}`}
          href={doc.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-colors"
        >
          {getFileIcon(doc.mime_type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{doc.file_name || 'Dokumentum'}</p>
            <p className="text-xs text-white/50">{formatFileSize(doc.file_size)}</p>
          </div>
        </a>
      ))}

      {/* Other files */}
      {others.map((file, idx) => (
        <a
          key={`file-${idx}`}
          href={file.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-colors"
        >
          {getFileIcon(file.mime_type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{file.file_name || 'Fájl'}</p>
            <p className="text-xs text-white/50">{formatFileSize(file.file_size)}</p>
          </div>
        </a>
      ))}

      {viewerImage && (
        <ImageViewer
          imageUrl={viewerImage}
          onClose={() => setViewerImage(null)}
        />
      )}
    </div>
  );
};
