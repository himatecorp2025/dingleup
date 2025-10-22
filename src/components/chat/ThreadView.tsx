import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Info, Send, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
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
  const { status: friendshipStatus, sendRequest } = useFriendshipStatus(userId, friendId);

  useEffect(() => {
    loadFriendProfile();
    loadMessages();

    // Realtime subscription for messages + presence + friendship
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
        // Friendship status hook will auto-refresh
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
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

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ otherUserId: friendId });
      const { data, error } = await supabase.functions.invoke(
        `get-thread-messages?${params.toString()}`
      );
      if (error) throw error;
      setMessages(data?.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    const textToSend = messageText.trim();
    setMessageText(''); // Azonnal töröljük a mezőt
    
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      body: textToSend,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const { error } = await supabase.functions.invoke('send-dm', {
        body: { recipientId: friendId, body: textToSend }
      });
      if (error) throw error;
      // A realtime sub automatikusan frissít
    } catch (error) {
      console.error('Error sending message:', error);
      // Hiba esetén visszarakjuk az üzenetet
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setMessageText(textToSend);
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
    <div className="h-full flex flex-col bg-[#0F1116]">
      {/* Header */}
      <div className="flex-none flex items-center gap-3 p-4 bg-[#0f0f2a]/80 border-b border-[#D4AF37]/30">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
        </button>
        
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
            {friendProfile.avatar_url ? (
              <img src={friendProfile.avatar_url} alt={friendProfile.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold">{getInitials(friendProfile.username)}</span>
            )}
          </div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(friendProfile.online_status)} rounded-full border-2 border-[#0f0f2a]`} />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white">{friendProfile.username}</h2>
          <p className="text-xs text-[#D4AF37]/60">
            {friendProfile.online_status === 'online' ? 'Online' : 'Offline'}
          </p>
        </div>

        {getFriendshipButton()}

        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
          <Info className="w-5 h-5 text-[#D4AF37]" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-white/60">Üzenetek betöltése...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">Még nincsenek üzenetek</p>
            <p className="text-white/40 text-sm mt-2">Kezdj egy új beszélgetést!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
                    {friendProfile.avatar_url ? (
                      <img src={friendProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{getInitials(friendProfile.username)}</span>
                    )}
                  </div>
                )}
                <div className={`max-w-[70%] rounded-[20px] px-4 py-2.5 ${
                  isOwn 
                    ? 'bg-[#138F5E] text-white rounded-br-md' 
                    : 'bg-[#262626] text-white rounded-bl-md'
                }`}>
                  <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Messenger style */}
      <div className="flex-none px-3 py-2.5 bg-[#0F1116] pb-safe">
        <div className="flex items-center gap-1.5 bg-[#262626] rounded-full px-3 py-2">
          <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-[#138F5E]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </button>
          
          <textarea
            ref={textareaRef}
            placeholder="Üzenet..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 bg-transparent border-0 text-white placeholder:text-white/50 px-2 py-1.5 focus:outline-none resize-none min-h-[24px] max-h-[100px] text-[15px] leading-snug"
            rows={1}
            maxLength={2000}
          />
          
          {!messageText.trim() ? (
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
                <svg className="w-5 h-5 text-[#138F5E]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </button>
              <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
                <svg className="w-5 h-5 text-[#138F5E]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={sendMessage}
              className="p-1.5 hover:bg-[#138F5E]/20 rounded-full transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5 text-[#138F5E]" fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
