import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { ImageViewer } from './ImageViewer';

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
    media?: Array<{
      media_url: string;
      media_type: string;
      thumbnail_url?: string;
    }>;
  };
  isOwn: boolean;
  isGrouped?: boolean;
  partnerAvatar?: string | null;
  partnerName: string;
  showTime: string;
}

const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const MessageBubble = ({ message, isOwn, isGrouped = false, partnerAvatar, partnerName, showTime }: MessageBubbleProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { reactions, addReaction } = useMessageReactions(message.id);

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
          >
            {/* Image(s) if present */}
            {message.media && message.media.length > 0 && (
              <div className={`mb-1 ${message.media.length > 1 ? 'flex gap-1 overflow-x-auto scrollbar-hide' : ''}`}>
                {message.media.map((media, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(media.media_url)}
                    className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ 
                      minWidth: message.media!.length > 1 ? '200px' : 'auto',
                      maxWidth: '300px'
                    }}
                  >
                    <img
                      src={media.thumbnail_url || media.media_url}
                      alt="Kép"
                      className="w-full h-auto object-cover rounded-lg"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Text message */}
            {message.body && (
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
                  onClick={() => addReaction(emoji)}
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
              <span 
                key={emoji}
                className="bg-[#1a1a1a]/90 border border-[#D4AF37]/30 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-sm"
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-[#D4AF37] font-medium">{count}</span>
              </span>
            ))}
          </div>
        )}

        {!isGrouped && (
          <span className="text-[11px] text-white/40 mt-1 px-1">{showTime}</span>
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
