import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, ArrowLeft, Users } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { FriendsList } from '@/components/FriendsList';
import { ThreadCard } from '@/components/ThreadCard';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface Thread {
  threadId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessageSnippet: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  onlineStatus: 'online' | 'away' | 'offline';
}

const ChatEnhanced = () => {
  const navigate = useNavigate();
  const isHandheld = usePlatformDetection();
  const [userId, setUserId] = useState<string | undefined>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showFriendsList, setShowFriendsList] = useState(false);
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

  // Load threads
  useEffect(() => {
    if (!userId) return;
    
    loadThreads();

    // Subscribe to changes in dm_messages and dm_threads
    const channel = supabase
      .channel('threads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dm_messages',
        },
        () => {
          console.log('[ChatEnhanced] Message changed, reloading threads...');
          loadThreads();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dm_threads',
        },
        () => {
          console.log('[ChatEnhanced] Thread changed, reloading threads...');
          loadThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadThreads = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-threads');

      if (error) {
        console.error('[ChatEnhanced] Error loading threads:', error);
        return;
      }

      console.log('[ChatEnhanced] Loaded threads:', data);
      setThreads(data.threads || []);
    } catch (err) {
      console.error('[ChatEnhanced] Exception loading threads:', err);
    }
  };

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
    setShowFriendsList(false);
  };

  const handleSelectThread = (thread: Thread) => {
    setSelectedThreadId(thread.threadId);
    setSelectedFriendId(thread.userId);
    setMessages([]);
    setThreadId(thread.threadId);
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase.rpc('archive_thread_for_user', {
        p_thread_id: threadId
      });

      if (error) {
        console.error('[ChatEnhanced] Error archiving thread:', error);
        toast.error('Nem sikerült törölni a beszélgetést');
        return;
      }

      // Remove from local state
      setThreads(prev => prev.filter(t => t.threadId !== threadId));
      
      // If this was the selected thread, clear selection
      if (selectedThreadId === threadId) {
        setSelectedThreadId(null);
        setSelectedFriendId(null);
        setMessages([]);
      }

      toast.success('Beszélgetés törölve');
    } catch (err) {
      console.error('[ChatEnhanced] Exception archiving thread:', err);
      toast.error('Hiba történt');
    }
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
    <div className="chat-layout h-screen w-screen grid gap-3 p-3 bg-[#0B0B0F] overflow-hidden" 
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        gridTemplateColumns: '30% 70%'
      }}
    >
      {/* Left Panel - Friends List (30%) */}
      <aside className="chat-friends border border-[hsl(var(--dup-gold-600))] rounded-[12px] overflow-hidden flex flex-col bg-[#0F1116]">
        <FriendsList 
          userId={userId!}
          onSelectFriend={handleSelectFriend}
          selectedFriendId={selectedFriendId}
        />
      </aside>

      {/* Right Panel - Threads List (70%) */}
      <section className="chat-threads border border-[hsl(var(--dup-gold-600))] rounded-[12px] bg-[#0F1116] overflow-auto p-2 flex flex-col">
        {selectedFriendId && friendProfile ? (
          // Chat view when a conversation is selected
          <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-4 bg-[#0F1116] border-b border-[hsl(var(--dup-gold-600)/0.3)] flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedFriendId(null);
                  setSelectedThreadId(null);
                }}
                className="p-2 hover:bg-[hsl(var(--dup-gold-600)/0.1)] rounded-lg"
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
            <div className="p-4 bg-[#0F1116] border-t border-[hsl(var(--dup-gold-600)/0.3)] flex-shrink-0">
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
          </div>
        ) : threads.length === 0 ? (
          // Empty state - no threads
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md p-8">
              <MessageCircle className="w-24 h-24 text-[hsl(var(--dup-gold-500))] mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-black text-[hsl(var(--dup-gold-300))] mb-4">
                Nincs még beszélgetésed
              </h2>
              <p className="text-[hsl(var(--dup-text-200))] mb-6">
                Kezdj új beszélgetést egy ismerőssel!
              </p>
              <Button
                onClick={() => setShowFriendsList(true)}
                className="bg-[hsl(var(--dup-green-500))] hover:bg-[hsl(var(--dup-green-400))] text-white border border-[hsl(var(--dup-green-700))] shadow-[0_0_10px_hsl(var(--dup-green-500)/0.4)]"
              >
                <Users className="w-5 h-5 mr-2" />
                Ismerősök megtekintése
              </Button>
            </div>
          </div>
        ) : (
          // Threads list
          <>
            <div className="p-4 border-b border-[hsl(var(--dup-gold-600)/0.3)] flex items-center justify-between">
              <h2 className="text-xl font-black text-[hsl(var(--dup-gold-300))]">
                Beszélgetések
              </h2>
              <Button
                onClick={() => setShowFriendsList(true)}
                variant="ghost"
                size="sm"
                className="text-[hsl(var(--dup-text-200))] hover:text-[hsl(var(--dup-gold-300))]"
              >
                <Users className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {threads.map((thread) => (
                <ThreadCard
                  key={thread.threadId}
                  threadId={thread.threadId}
                  displayName={thread.displayName}
                  avatarUrl={thread.avatarUrl}
                  lastMessageSnippet={thread.lastMessageSnippet}
                  lastMessageAt={thread.lastMessageAt}
                  unreadCount={thread.unreadCount}
                  onlineStatus={thread.onlineStatus}
                  onClick={() => handleSelectThread(thread)}
                  onDelete={handleDeleteThread}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <BottomNav />
    </div>
  );
};

export default ChatEnhanced;
