import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { ImageViewer } from './ImageViewer';
import { FileText, Download, Play, Music, FileArchive } from 'lucide-react';
import { DeliveryStatus } from './DeliveryStatus';
import { AttachmentGrid } from './AttachmentGrid';

interface MessageMedia {
  media_url: string;
  media_type: string;
  thumbnail_url?: string;
  file_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
  duration_ms?: number;
  mime_type?: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_deleted: boolean;
}

interface MessageBubbleProps {
  message: {
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
    media?: MessageMedia[];
    delivery_status?: 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';
  };
  isOwn: boolean;
  isGrouped?: boolean;
  partnerAvatar?: string | null;
  partnerName: string;
  showTime: string;
  onRetry?: () => void;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDuration = (ms?: number) => {
  if (!ms) return '';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const MediaPreview = ({ media, onImageClick }: { media: MessageMedia; onImageClick?: (url: string) => void }) => {
  const mediaType = media.mime_type || media.media_type;
  const isImage = mediaType.startsWith('image');
  const isVideo = mediaType.startsWith('video');
  const isAudio = mediaType.startsWith('audio');
  const isDocument = mediaType.includes('pdf') || 
                     mediaType.includes('document') || 
                     mediaType.includes('sheet') ||
                     mediaType.includes('presentation') ||
                     mediaType.includes('text');
  const isArchive = mediaType.includes('zip') || mediaType.includes('rar');

  // Kép
  if (isImage) {
    const imageUrl = media.thumbnail_url || media.media_url;
    return (
      <div
        onClick={() => onImageClick?.(media.media_url)}
        className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity max-w-xs"
      >
        <img
          src={imageUrl}
          alt={media.file_name || 'Kép'}
          className="w-full h-auto object-cover"
          loading="lazy"
          onError={(e) => {
            console.error('[MessageBubble] Image failed to load:', {
              url: imageUrl,
              fileName: media.file_name,
              mediaUrl: media.media_url,
              thumbnailUrl: media.thumbnail_url
            });
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Videó
  if (isVideo) {
    return (
      <div className="relative rounded-lg overflow-hidden max-w-xs bg-black/20">
        {media.thumbnail_url ? (
          <div className="relative">
            <img 
              src={media.thumbnail_url} 
              alt="Videó előnézet"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
            {media.duration_ms && (
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-medium">
                {formatDuration(media.duration_ms)}
              </div>
            )}
          </div>
        ) : (
          <video 
            src={media.media_url} 
            controls 
            className="w-full h-auto max-h-64"
            preload="metadata"
          />
        )}
      </div>
    );
  }

  // Audió
  if (isAudio) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg max-w-xs">
        <div className="flex items-center gap-3">
          <div className="bg-[#D4AF37]/20 p-2 rounded-full flex-shrink-0">
            <Music className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {media.file_name || 'Audiófájl'}
            </p>
            <div className="flex items-center gap-2 text-xs text-white/50">
              {media.duration_ms && <span>{formatDuration(media.duration_ms)}</span>}
              {media.file_size && <span>{formatFileSize(media.file_size)}</span>}
            </div>
          </div>
        </div>
        <audio src={media.media_url} controls className="w-full" />
      </div>
    );
  }

  // Dokumentum
  if (isDocument) {
    return (
      <a 
        href={media.media_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg max-w-xs transition-colors"
      >
        <div className="bg-[#8B0000]/20 p-2 rounded-full flex-shrink-0">
          <FileText className="w-5 h-5 text-[#8B0000]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {media.file_name || 'Dokumentum'}
          </p>
          {media.file_size && (
            <p className="text-xs text-white/50">{formatFileSize(media.file_size)}</p>
          )}
        </div>
        <Download className="w-4 h-4 text-white/50 flex-shrink-0" />
      </a>
    );
  }

  // Archívum
  if (isArchive) {
    return (
      <a 
        href={media.media_url} 
        download={media.file_name}
        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg max-w-xs transition-colors"
      >
        <div className="bg-[#138F5E]/20 p-2 rounded-full flex-shrink-0">
          <FileArchive className="w-5 h-5 text-[#138F5E]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {media.file_name || 'Archívum'}
          </p>
          {media.file_size && (
            <p className="text-xs text-white/50">{formatFileSize(media.file_size)}</p>
          )}
        </div>
        <Download className="w-4 h-4 text-white/50 flex-shrink-0" />
      </a>
    );
  }

  // Egyéb fájl
  return (
    <a 
      href={media.media_url} 
      download={media.file_name}
      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg max-w-xs transition-colors"
    >
      <div className="bg-white/10 p-2 rounded-full flex-shrink-0">
        <FileText className="w-5 h-5 text-white/70" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {media.file_name || 'Fájl'}
        </p>
        {media.file_size && (
          <p className="text-xs text-white/50">{formatFileSize(media.file_size)}</p>
        )}
      </div>
      <Download className="w-4 h-4 text-white/50 flex-shrink-0" />
    </a>
  );
};

const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const MessageBubble = ({ message, isOwn, isGrouped = false, partnerAvatar, partnerName, showTime, onRetry }: MessageBubbleProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { reactions, addReaction } = useMessageReactions(message.id);

  // Render message even if body is empty but has media
  const hasContent = message.body?.trim() || (message.media && message.media.length > 0);
  
  if (!hasContent) {
    console.warn('[MessageBubble] Message has no content:', message.id);
    return null;
  }
  
  console.log('[MessageBubble] Rendering message:', message.id, {
    bodyLength: message.body?.length || 0,
    mediaCount: message.media?.length || 0,
    mediaItems: message.media?.map(m => ({ type: m.media_type, url: m.media_url?.substring(0, 50) }))
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const groupedReactions = reactions.reduce((acc, r) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className={`flex gap-2 ${isGrouped ? 'mb-1' : 'mb-3'} ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
        {!isOwn && !isGrouped && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            {partnerAvatar ? (
              <AvatarImage src={partnerAvatar} />
            ) : (
              <AvatarFallback className="bg-[#D4AF37]/20 text-[#D4AF37] text-xs">
                {getInitials(partnerName)}
              </AvatarFallback>
            )}
          </Avatar>
        )}
        {!isOwn && isGrouped && <div className="w-8 flex-shrink-0" />}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%]`}>
          <div 
            className="relative group"
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
            onTouchStart={() => setShowReactionPicker(true)}
            onTouchEnd={() => setTimeout(() => setShowReactionPicker(false), 2000)}
          >
            {/* Media if present - Use AttachmentGrid */}
            {message.media && message.media.length > 0 && (
              <div className={`mb-1 ${isOwn ? 'bg-[#138F5E]' : 'bg-[#1a1a1a]'} rounded-2xl p-2`}>
                <AttachmentGrid media={message.media} />
              </div>
            )}

            {/* Text message - show even if empty when media exists */}
            {(message.body || (!message.body && message.media && message.media.length === 0)) && (
              <div 
                className={`px-4 py-2.5 shadow-sm transition-all duration-200 ${
                  isOwn 
                    ? `bg-[#138F5E] text-white ${isGrouped ? 'rounded-[18px]' : 'rounded-[18px] rounded-br-md'}` 
                    : `bg-[#1a1a1a] text-white border border-[#D4AF37]/20 ${isGrouped ? 'rounded-[18px]' : 'rounded-[18px] rounded-bl-md'}`
                }`}
              >
                <p className="text-[15px] leading-[1.4] break-words">{message.body}</p>
              </div>
            )}

          {/* Reaction Picker - Desktop hover */}
          {showReactionPicker && (
            <div 
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-0 -mt-12 bg-[#1a1a1a]/95 backdrop-blur-sm border border-[#D4AF37]/30 rounded-xl p-2 flex gap-1 shadow-xl z-20 animate-scale-in`}
            >
              {reactionEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    addReaction(emoji);
                    setShowReactionPicker(false);
                  }}
                  className="hover:scale-125 active:scale-110 transition-transform text-xl p-1.5 rounded-lg hover:bg-white/10"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

          {/* Reactions Display */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {Object.entries(groupedReactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    addReaction(emoji);
                  }}
                  className="bg-[#1a1a1a]/90 border border-[#D4AF37]/30 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-sm hover:bg-[#D4AF37]/20 transition-colors active:scale-95"
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="text-[#D4AF37] font-medium">{count}</span>
                </button>
              ))}
            </div>
          )}

        {!isGrouped && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <span className="text-[11px] text-white/40">{showTime}</span>
            {isOwn && message.delivery_status && (
              <DeliveryStatus 
                status={message.delivery_status} 
                showRetry={message.delivery_status === 'failed'}
                onRetry={onRetry}
              />
            )}
          </div>
        )}
      </div>
    </div>

    {/* Image Viewer */}
    {selectedImage && (
      <ImageViewer 
        imageUrl={selectedImage} 
        onClose={() => setSelectedImage(null)} 
      />
    )}
    </>
  );
};
