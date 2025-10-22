import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMessageReactions } from '@/hooks/useMessageReactions';

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
  };
  isOwn: boolean;
  partnerAvatar?: string | null;
  partnerName: string;
  showTime: string;
}

const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const MessageBubble = ({ message, isOwn, partnerAvatar, partnerName, showTime }: MessageBubbleProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
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
    <div className={`flex gap-2 mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
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
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div 
          className="relative group"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          <div className={`px-4 py-2 rounded-2xl ${
            isOwn 
              ? 'bg-[#138F5E] text-white rounded-br-md' 
              : 'bg-[#1a1a1a] text-white rounded-bl-md border border-[#D4AF37]/20'
          }`}>
            <p className="text-sm break-words">{message.body}</p>
          </div>

          {/* Reaction Picker */}
          {showReactionPicker && (
            <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-0 -mt-10 bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg p-2 flex gap-1 shadow-lg z-10`}>
              {reactionEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addReaction(emoji)}
                  className="hover:scale-125 transition-transform text-xl p-1"
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
                className="bg-[#1a1a1a]/80 border border-[#D4AF37]/20 rounded-full px-2 py-0.5 text-xs flex items-center gap-1"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}

        <span className="text-xs text-white/40 mt-1">{showTime}</span>
      </div>
    </div>
  );
};
