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
    <div className="h-full flex flex-col bg-[#000000]">
      {/* Header - Fixed */}
      <div className="flex-none flex items-center gap-2.5 px-2 py-2 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-[#D4AF37]/10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
        >
          <ArrowLeft className="w-5 h-5 text-[#0a7cff]" />
          {/* Unread badge */}
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#0a7cff] rounded-full flex items-center justify-center px-1">
            <span className="text-white text-[11px] font-bold leading-none">2</span>
          </div>
        </button>
        
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
            {friendProfile.avatar_url ? (
              <img src={friendProfile.avatar_url} alt={friendProfile.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">{getInitials(friendProfile.username)}</span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white text-[15px] leading-tight">{friendProfile.username}</h2>
          <p className="text-[12px] text-white/60 leading-tight">
            {friendProfile.online_status === 'online' ? 'Online' : 'Legutóbb elérhető: 1 órája'}
          </p>
        </div>

        {getFriendshipButton()}

        <button className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
          <svg className="w-6 h-6 text-[#0a7cff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 15.5c-1.2 0-2.5-.2-3.7-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.7-6.5-6.5l2.2-2.2c.3-.3.4-.7.2-1C8.7 6.5 8.5 5.2 8.5 4c0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/>
          </svg>
        </button>

        <button className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
          <svg className="w-6 h-6 text-[#0a7cff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </button>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
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
              <div key={msg.id} className={`flex items-end gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
                    {friendProfile.avatar_url ? (
                      <img src={friendProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{getInitials(friendProfile.username)}</span>
                    )}
                  </div>
                )}
                <div className={`max-w-[70%] rounded-[18px] px-3.5 py-2 ${
                  isOwn 
                    ? 'bg-[#0a7cff] text-white' 
                    : 'bg-[#3a3a3c] text-white'
                }`}>
                  <p className="text-[15px] leading-[1.4] break-words whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-none px-2 py-2 bg-[#000000] pb-safe border-t border-[#D4AF37]/10">
        <div className="flex items-center gap-1.5">
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <svg className="w-6 h-6 text-[#0a7cff]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </button>

          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <svg className="w-6 h-6 text-[#0a7cff]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 6c1.93 0 3.5 1.57 3.5 3.5S13.93 15 12 15s-3.5-1.57-3.5-3.5S10.07 8 12 8zm0 12c-2.03 0-4.43-.82-6.14-2.88 1.93-1.34 4.27-2.12 6.14-2.12 1.87 0 4.21.78 6.14 2.12C16.43 19.18 14.03 20 12 20z"/>
            </svg>
          </button>

          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <svg className="w-6 h-6 text-[#0a7cff]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </button>

          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <svg className="w-6 h-6 text-[#0a7cff]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.05 7.44-7 7.93V19h4v2H8v-2h4v-3.07z"/>
            </svg>
          </button>
          
          <div className="flex-1 bg-[#3a3a3c] rounded-full px-4 py-1.5 flex items-center">
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
              className="flex-1 bg-transparent border-0 text-white placeholder:text-white/60 focus:outline-none resize-none min-h-[24px] max-h-[100px] text-[15px] leading-snug"
              rows={1}
              maxLength={2000}
            />
            <button className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0 ml-2">
              <svg className="w-5 h-5 text-[#0a7cff]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
            </button>
          </div>

          {messageText.trim() && (
            <button
              onClick={sendMessage}
              className="p-2.5 hover:bg-[#0a7cff]/20 rounded-full transition-colors flex-shrink-0"
            >
              <Send className="w-6 h-6 text-[#0a7cff]" fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
