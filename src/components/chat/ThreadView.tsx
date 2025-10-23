import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Info, Send, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';
import { toast } from 'sonner';
import { useTypingStatus } from '@/hooks/useTypingStatus';
import { MessageBubble } from './MessageBubble';
import { ImageUploader } from './ImageUploader';

interface Message {
  id: string;
  thread_id?: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_deleted?: boolean;
}

interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  online_status?: 'online' | 'away' | 'offline';
}

interface ThreadViewProps {
  friendId: string;
  userId: string;
  onBack: () => void;
}

export const ThreadView = ({ friendId, userId, onBack }: ThreadViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);
  const { status: friendshipStatus, sendRequest } = useFriendshipStatus(userId, friendId);
  const { handleTyping, stopTyping } = useTypingStatus(threadId, userId);

  useEffect(() => {
    loadFriendProfile();
    loadMessages();

    // Realtime subscription for messages + presence + friendship + typing
    const messagesChannel = supabase
      .channel(`thread-${friendId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, (payload) => {
        console.log('[ThreadView] dm_messages changed', payload);
        loadMessages();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, (payload) => {
        console.log('[ThreadView] user_presence changed', payload);
        loadFriendProfile();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, (payload) => {
        console.log('[ThreadView] friendships changed', payload);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'typing_status',
        filter: `user_id=eq.${friendId}`
      }, (payload) => {
        console.log('[ThreadView] typing_status changed', payload);
        if (payload.new && typeof payload.new === 'object' && 'is_typing' in payload.new) {
          setPartnerTyping(payload.new.is_typing as boolean);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      stopTyping();
    };
  }, [friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [messageText]);

  // Infinite scroll: load older messages when scrolled to top
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onScroll = async () => {
      if (el.scrollTop <= 50 && hasMore && !isLoadingMore && messages.length > 0) {
        try {
          setIsLoadingMore(true);
          const oldest = messages[0]?.created_at;
          const prevHeight = el.scrollHeight;
          const older = await fetchMessages({ before: oldest, limit: PAGE_SIZE });
          if (older.length < PAGE_SIZE) setHasMore(false);
          setMessages(prev => [...older, ...prev]);
          requestAnimationFrame(() => {
            const newHeight = el.scrollHeight;
            el.scrollTop = newHeight - prevHeight;
          });
        } catch (e) {
          console.error('Error loading older messages:', e);
          setHasMore(false);
        } finally {
          setIsLoadingMore(false);
        }
      }
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [messages, hasMore, isLoadingMore, friendId]);

  const loadFriendProfile = async () => {
    try {
      // SECURITY: Use public_profiles view
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, username, avatar_url')
        .eq('id', friendId)
        .single();
      
      if (error) throw error;
      
      // Get online status
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('is_online, last_seen')
        .eq('user_id', friendId)
        .single();

      setFriendProfile({
        ...data,
        online_status: presenceData?.is_online ? 'online' : 'offline'
      });
    } catch (error) {
      console.error('Error loading friend profile:', error);
    }
  };

  const fetchMessages = async ({ before, limit }: { before?: string; limit?: number }) => {
    const params = new URLSearchParams({ otherUserId: friendId });
    if (before) params.set('before', before);
    if (limit) params.set('limit', String(limit));
    const { data, error } = await supabase.functions.invoke(
      `get-thread-messages?${params.toString()}`
    );
    if (error) throw error;
    return (data?.messages as Message[]) || [];
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const result = await supabase.functions.invoke(
        `get-thread-messages?otherUserId=${friendId}`
      );
      if (result.error) throw result.error;
      const msgs = result.data?.messages || [];
      setMessages(msgs);
      setHasMore(msgs.length === PAGE_SIZE);
      // Extract threadId from first message
      if (msgs.length > 0 && msgs[0].thread_id) {
        setThreadId(msgs[0].thread_id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (mediaUrl?: string, mediaPath?: string) => {
    if (!messageText.trim() && !mediaUrl) return;
    
    const textToSend = messageText.trim();
    setMessageText('');
    stopTyping();
    
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      body: textToSend,
      created_at: new Date().toISOString(),
      media: mediaUrl ? [{ media_url: mediaUrl, media_type: 'image' }] : undefined
    };
    
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const { error } = await supabase.functions.invoke('send-dm', {
        body: { 
          recipientId: friendId, 
          body: textToSend,
          mediaUrl,
          mediaPath
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setMessageText(textToSend);
      toast.error('Üzenet küldése sikertelen');
    }
  };

  const handleImageUploadComplete = async (
    url: string, 
    path: string, 
    width: number, 
    height: number, 
    size: number
  ) => {
    setSelectedImage(null);
    
    try {
      // Send message with image
      await sendMessage(url, path);
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Hiba a kép küldésekor');
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'online': return 'bg-[#00FF66]';
      case 'away': return 'bg-[#FFA500]';
      default: return 'bg-[#666]';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendFriendRequest = async () => {
    try {
      await sendRequest();
      toast.success('Ismerős jelölés elküldve!');
    } catch (error) {
      toast.error('Hiba történt');
    }
  };

  const getFriendshipButton = () => {
    switch (friendshipStatus) {
      case 'none':
        return (
          <button 
            onClick={handleSendFriendRequest}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#138F5E]/20 hover:bg-[#138F5E]/30 border border-[#138F5E]/50 rounded-lg transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4 text-[#138F5E]" />
            <span className="text-[#138F5E] font-medium">Bejelölöm</span>
          </button>
        );
      case 'pending_sent':
        return (
          <div className="px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-lg text-sm">
            <span className="text-[#D4AF37]">Folyamatban</span>
          </div>
        );
      case 'pending_received':
        return (
          <div className="px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-lg text-sm">
            <span className="text-[#D4AF37]">Várakozik jóváhagyásra</span>
          </div>
        );
      case 'blocked':
        return (
          <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg text-sm">
            <span className="text-red-400">Nem elérhető</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!friendProfile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0F1116]">
        <p className="text-white/60">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#0F1116] chat-thread-container overflow-x-hidden">
      {/* Header - Messenger style */}
      <header className="chat-header flex-none flex items-center gap-3 px-4 py-3 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#D4AF37]/20 w-full">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 flex-shrink-0"
          aria-label="Vissza"
        >
          <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
        </button>
        
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#D4AF37]/20 to-[#8B0000]/20 flex items-center justify-center border border-[#D4AF37]/30">
            {friendProfile.avatar_url ? (
              <img src={friendProfile.avatar_url} alt={friendProfile.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#D4AF37] font-bold text-sm">{getInitials(friendProfile.username)}</span>
            )}
          </div>
          {friendProfile.online_status === 'online' && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FF66] rounded-full border-2 border-[#1a1a1a]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white text-[15px] leading-tight truncate">{friendProfile.username}</h2>
          {partnerTyping ? (
            <div className="flex items-center gap-1 text-[12px] text-[#D4AF37] leading-tight">
              <span className="typing-dots">éppen ír</span>
            </div>
          ) : (
            <p className="text-[12px] text-white/60 leading-tight truncate">
              {friendProfile.online_status === 'online' ? 'Online' : 'Offline'}
            </p>
          )}
        </div>

        {getFriendshipButton()}

        <button 
          className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 flex-shrink-0"
          aria-label="Info"
        >
          <Info className="w-5 h-5 text-[#D4AF37]" />
        </button>
      </header>

      {/* Messages - Scrollable area with proper padding for fixed composer */}
      <main 
        ref={messagesContainerRef} 
        className="chat-thread flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 w-full"
        style={{
          paddingBottom: 'calc(72px + var(--bottom-nav-h, 72px) + env(safe-area-inset-bottom))',
          height: '100dvh',
          maxWidth: '100%'
        }}
      >
        {isLoadingMore && (
          <div className="text-center py-3 text-white/50 text-sm animate-fade-in">
            Régebbi üzenetek betöltése...
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-white/60">Üzenetek betöltése...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-base">Még nincsenek üzenetek</p>
            <p className="text-white/40 text-sm mt-2">Kezdj egy új beszélgetést!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isGrouped = prevMsg && prevMsg.sender_id === msg.sender_id;
            
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === userId}
                isGrouped={isGrouped}
                partnerAvatar={friendProfile.avatar_url}
                partnerName={friendProfile.username}
                showTime={formatTime(msg.created_at)}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Composer - Fixed above bottom nav, Messenger style - ALWAYS VISIBLE */}
      <div 
        className="chat-composer fixed left-0 right-0 w-full bg-[#0F1116]/98 backdrop-blur-sm border-t border-[#D4AF37]/20 px-3 py-2 z-[10010]"
        style={{
          bottom: 'var(--bottom-nav-h, 72px)',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}
      >
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full" style={{ maxWidth: '100%' }}>
          {threadId && (
            <ImageUploader
              threadId={threadId}
              onImageSelected={(file, preview) => setSelectedImage({ file, preview })}
              onUploadComplete={handleImageUploadComplete}
              onCancel={() => setSelectedImage(null)}
              selectedImage={selectedImage}
            />
          )}
          
          <div className="flex-1 bg-[#1a1a1a] rounded-[22px] border border-[#D4AF37]/20 px-4 py-2 flex items-center min-h-[44px]">
            <textarea
              ref={textareaRef}
              placeholder="Írj üzenetet…"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onBlur={stopTyping}
              className="flex-1 bg-transparent border-0 text-white placeholder:text-white/50 focus:outline-none resize-none max-h-[120px] text-[15px] leading-[1.4]"
              rows={1}
              maxLength={2000}
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            />
          </div>

          {messageText.trim() ? (
            <button
              onClick={() => sendMessage()}
              className="p-2.5 bg-[#138F5E] hover:bg-[#138F5E]/90 rounded-full transition-all duration-200 flex-shrink-0 mb-1 shadow-lg shadow-[#138F5E]/30"
              aria-label="Küldés"
            >
              <Send className="w-5 h-5 text-white" fill="currentColor" />
            </button>
          ) : (
            <button 
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 flex-shrink-0 mb-1"
              aria-label="Emoji"
            >
              <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
