import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { FriendsList } from '@/components/FriendsList';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

const ChatEnhanced = () => {
  const navigate = useNavigate();
  const isHandheld = usePlatformDetection();
  const [userId, setUserId] = useState<string | undefined>();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  // Load friend profile when selected
  useEffect(() => {
    if (!selectedFriendId) {
      setFriendProfile(null);
      return;
    }

    const loadFriendProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', selectedFriendId)
        .single();

      if (!error && data) {
        setFriendProfile(data);
      }
    };

    loadFriendProfile();
  }, [selectedFriendId]);

  // Load messages when friend selected
  useEffect(() => {
    if (!selectedFriendId || !userId) return;
    
    loadMessages();

    // Subscribe to new messages in this thread
    const channel = supabase
      .channel('dm-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
        },
        (payload) => {
          console.log('[ChatEnhanced] New message received:', payload);
          if (payload.new && 'thread_id' in payload.new && payload.new.thread_id === threadId) {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFriendId, userId, threadId]);

  const loadMessages = async () => {
    if (!selectedFriendId) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-thread-messages', {
        body: { otherUserId: selectedFriendId }
      });

      if (error) {
        console.error('[ChatEnhanced] Error loading messages:', error);
        return;
      }

      console.log('[ChatEnhanced] Loaded messages:', data);
      setMessages(data.messages || []);
      setThreadId(data.threadId);
      scrollToBottom();
    } catch (err) {
      console.error('[ChatEnhanced] Exception loading messages:', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedFriendId) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId!,
      body: messageText.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);
    const text = messageText;
    setMessageText('');
    scrollToBottom();

    try {
      const { error } = await supabase.functions.invoke('send-dm', {
        body: { recipientId: selectedFriendId, body: text }
      });

      if (error) {
        console.error('[ChatEnhanced] Error sending message:', error);
        toast.error('Üzenet küldése sikertelen');
        // Remove temp message
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setMessageText(text);
      }
    } catch (err) {
      console.error('[ChatEnhanced] Exception sending message:', err);
      toast.error('Hiba történt');
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setMessageText(text);
    }
  };

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriendId(friendId);
    setMessages([]);
    setThreadId(null);
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  // Platform gate: only show on mobile/tablet
  if (!isHandheld) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--dup-ui-bg-900))] px-4">
        <div className="text-center max-w-md">
          <MessageCircle className="w-24 h-24 text-[hsl(var(--dup-gold-500))] mx-auto mb-6 opacity-50" />
          <h1 className="text-2xl font-black text-[hsl(var(--dup-gold-300))] mb-4">
            Chat csak mobilon/tableten
          </h1>
          <p className="text-[hsl(var(--dup-text-200))]">
            A chat funkció csak mobil és tablet eszközökön érhető el.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[hsl(var(--dup-ui-bg-900))] overflow-hidden" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Left Sidebar - Friends List */}
      <div className="w-80 border-r border-[hsl(var(--dup-gold-600)/0.3)] flex flex-col">
        <FriendsList 
          userId={userId!}
          onSelectFriend={handleSelectFriend}
          selectedFriendId={selectedFriendId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFriendId && friendProfile ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-[#0F1116] border-b border-[hsl(var(--dup-gold-600)/0.3)] flex items-center gap-3">
              <button
                onClick={() => setSelectedFriendId(null)}
                className="lg:hidden p-2 hover:bg-[hsl(var(--dup-gold-600)/0.1)] rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-[hsl(var(--dup-text-200))]" />
              </button>
              
              <Avatar className="w-10 h-10 border-2 border-[hsl(var(--dup-gold-500))]">
                <AvatarImage src={friendProfile.avatar_url || undefined} />
                <AvatarFallback className="bg-[hsl(var(--dup-gold-600))] text-white font-bold">
                  {getInitials(friendProfile.username)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="font-black text-[hsl(var(--dup-text-100))]">
                  {friendProfile.username}
                </h2>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B0B0F]">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[hsl(var(--dup-text-300))] text-center">
                    Nincs még üzenet.<br />Kezdj el beszélgetni!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] p-3 rounded-[12px] ${
                          isOwn
                            ? 'bg-[hsl(var(--dup-green-500))] text-white'
                            : 'bg-[#1F1F23] border border-[hsl(var(--dup-gold-600)/0.3)] text-[hsl(var(--dup-text-100))]'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.body}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-[hsl(var(--dup-text-300))]'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('hu-HU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-[#0F1116] border-t border-[hsl(var(--dup-gold-600)/0.3)]">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Írj üzenetet..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 bg-black/50 border-[hsl(var(--dup-gold-600)/0.4)] text-[hsl(var(--dup-text-100))] placeholder:text-[hsl(var(--dup-text-300))] focus-visible:ring-[hsl(var(--dup-gold-500))]"
                  maxLength={2000}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="bg-[hsl(var(--dup-green-500))] hover:bg-[hsl(var(--dup-green-400))] disabled:bg-[hsl(var(--dup-green-300))] text-white border border-[hsl(var(--dup-green-700))] shadow-[0_0_10px_hsl(var(--dup-green-500)/0.4)]"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // No conversation selected
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-24 h-24 text-[hsl(var(--dup-gold-600))] mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-black text-[hsl(var(--dup-gold-300))] mb-2">
                Válassz egy ismerőst
              </h2>
              <p className="text-[hsl(var(--dup-text-200))]">
                Kezdj el beszélgetni!
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatEnhanced;
