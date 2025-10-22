import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Send, Trash2, User, Menu, AlertTriangle, Search } from 'lucide-react';
import { FriendsList } from '@/components/FriendsList';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { ReportDialog } from '@/components/ReportDialog';
import { UserSearchDialog } from '@/components/UserSearchDialog';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface Thread {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  online_status: 'online' | 'away' | 'offline';
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
}

const ChatEnhanced = () => {
  const navigate = useNavigate();
  const isHandheld = usePlatformDetection();
  
  // Auto logout on inactivity
  useAutoLogout();
  
  const [userId, setUserId] = useState<string | undefined>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [friendsDrawerOpen, setFriendsDrawerOpen] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
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

  useEffect(() => {
    const savedState = localStorage.getItem('chatDrawerOpen');
    if (savedState !== null) {
      setFriendsDrawerOpen(savedState === 'true');
    }
  }, []);

  const toggleFriendsDrawer = () => {
    const newState = !friendsDrawerOpen;
    setFriendsDrawerOpen(newState);
    localStorage.setItem('chatDrawerOpen', String(newState));
  };

  useEffect(() => {
    if (!userId) return;
    
    loadThreads();

    // Realtime subscriptions for immediate updates
    const channel = supabase
      .channel('threads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, () => {
        console.log('[ChatEnhanced] dm_messages changed, reloading threads');
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, () => {
        console.log('[ChatEnhanced] dm_threads changed, reloading threads');
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => {
        console.log('[ChatEnhanced] user_presence changed, reloading threads');
        loadThreads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadThreads = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-threads');
      if (error) throw error;
      setThreads(data?.threads || []);
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  useEffect(() => {
    if (!selectedFriendId) return;
    loadFriendProfile();
    loadMessages();

    // Realtime subscription for immediate message updates
    const messagesChannel = supabase
      .channel(`messages-${selectedFriendId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, (payload) => {
        console.log('[ChatEnhanced] Message changed:', payload);
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedFriendId]);

  const loadFriendProfile = async () => {
    if (!selectedFriendId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', selectedFriendId)
        .single();
      if (error) throw error;
      setFriendProfile(data);
    } catch (error) {
      console.error('Error loading friend profile:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedFriendId) return;
    try {
      const { data, error } = await supabase.functions.invoke('get-thread-messages', {
        body: { friendId: selectedFriendId }
      });
      if (error) throw error;
      setMessages(data?.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedFriendId) return;
    
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: userId!,
      body: messageText,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setMessageText('');
    scrollToBottom();

    try {
      const { error } = await supabase.functions.invoke('send-dm', {
        body: { recipientId: selectedFriendId, body: messageText }
      });
      if (error) throw error;
      loadMessages();
      loadThreads();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriendId(friendId);
    setFriendsDrawerOpen(false);
  };

  const handleSelectThread = (thread: Thread) => {
    setSelectedFriendId(thread.other_user_id);
    setFriendsDrawerOpen(false);
  };

  const handleUserSelect = async (selectedUserId: string, username: string) => {
    if (!userId) return;
    
    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id_a.eq.${userId},user_id_b.eq.${selectedUserId}),and(user_id_a.eq.${selectedUserId},user_id_b.eq.${userId})`)
      .maybeSingle();

    // If no friendship exists, create one
    if (!existingFriendship) {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id_a: userId,
          user_id_b: selectedUserId,
          status: 'active'
        });

      if (error) {
        console.error('Error creating friendship:', error);
        toast.error('Hiba az ismerős hozzáadása során');
        return;
      }

      toast.success(`${username} hozzáadva az ismerősökhöz!`);
    }

    // Select the user for chat
    setSelectedFriendId(selectedUserId);
    setShowSearchDialog(false);
    setFriendsDrawerOpen(false);
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase.rpc('archive_thread_for_user', { p_thread_id: threadId });
      if (error) throw error;
      loadThreads();
      if (selectedFriendId) {
        const deletedThread = threads.find(t => t.id === threadId);
        if (deletedThread?.other_user_id === selectedFriendId) {
          setSelectedFriendId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  if (!isHandheld) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <div className="text-center px-6 max-w-md">
          <h1 className="text-3xl font-black text-white mb-4">📱 Csak mobilon elérhető</h1>
          <p className="text-white/80">A chat funkció csak telefonon és táblagépen használható.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden relative z-10" style={{ paddingBottom: selectedFriendId ? '140px' : '80px' }}>
      {/* Header with Hamburger */}
      <div className="chat-topbar bg-[#0f0f2a]/80 border-b-2 border-yellow-500/50 p-4 flex items-center gap-4 backdrop-blur-sm">
        <button
          onClick={toggleFriendsDrawer}
          className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-all border border-yellow-500/50"
          aria-label="Ismerősök"
        >
          <Menu className="w-6 h-6 text-yellow-400" />
        </button>
        <h1 className="flex-1 text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-yellow-400">
          Chat
        </h1>
        <button
          onClick={() => setShowSearchDialog(true)}
          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-all border border-purple-500/50"
          aria-label="Keresés"
          title="Felhasználó keresése"
        >
          <Search className="w-5 h-5 text-purple-400" />
        </button>
        <button
          onClick={() => setShowReportDialog(true)}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all border border-red-500/50"
          aria-label="Jelentések"
          title="Jelentés küldése"
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </button>
      </div>

      {/* Main Content Area - Single Surface Chat with Drawer */}
      <div className="chat-body flex-1 relative overflow-hidden">
        {/* Friends Drawer */}
        <aside 
          className="friends-drawer absolute left-0 top-0 bottom-0 bg-[#0F1116] border-r border-yellow-500/35 z-10 overflow-y-auto transition-transform duration-250 ease-out"
          data-open={friendsDrawerOpen}
          style={{
            width: 'min(80vw, 420px)',
            transform: friendsDrawerOpen ? 'translateX(0)' : 'translateX(-100%)'
          }}
        >
          <FriendsList 
            userId={userId!}
            onSelectFriend={handleSelectFriend}
            selectedFriendId={selectedFriendId}
          />
        </aside>

        {/* Main Threads/Chat Area */}
        <div className="threads-list flex-1 flex flex-col overflow-hidden">
          {selectedFriendId && friendProfile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Friend Header */}
              <div className="bg-[#0f0f2a]/80 p-4 border-b border-yellow-500/30 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-900 rounded-full flex items-center justify-center border-2 border-purple-400">
                  {friendProfile.avatar_url ? (
                    <img src={friendProfile.avatar_url} alt={friendProfile.username} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-white font-bold">{getInitials(friendProfile.username)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-white">{friendProfile.username}</h2>
                </div>
                <button onClick={() => setSelectedFriendId(null)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-xl ${isOwn ? 'bg-yellow-500/90 text-black' : 'bg-[#1F1F23] border border-yellow-500/30 text-white'}`}>
                        <p className="text-sm break-words">{msg.body}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-black/70' : 'text-white/50'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3">
              <h2 className="text-xl font-black text-yellow-300 mb-4 text-center">Beszélgetések</h2>
              {threads.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">Nincs még beszélgetésed</p>
                  <p className="text-white/40 text-sm mt-2">Nyisd meg az Ismerősök listát új chat indításához</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => handleSelectThread(thread)}
                      className="thread-item p-3 border border-yellow-500/20 rounded-xl hover:bg-yellow-500/10 cursor-pointer transition-colors grid gap-1.5 text-center"
                    >
                      <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-900 rounded-full flex items-center justify-center border-2 border-purple-400">
                        {thread.other_user_avatar ? (
                          <img src={thread.other_user_avatar} alt={thread.other_user_name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-white font-bold">{getInitials(thread.other_user_name)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white truncate">{thread.other_user_name}</h3>
                        <span className="text-xs text-white/50">
                          {thread.last_message_at ? new Date(thread.last_message_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        <p className="text-sm text-white/70 truncate mt-1">{thread.last_message_preview || 'Új beszélgetés'}</p>
                        {thread.unread_count > 0 && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full">{thread.unread_count}</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteThread(thread.id); }}
                        className="mx-auto p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Fixed Input at Bottom - Only when friend is selected */}
      {selectedFriendId && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-[#0F1116] border-t border-yellow-500/30 flex gap-2 z-20" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4rem)' }}>
          <input
            type="text"
            placeholder="Írj üzenetet..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-black/50 border border-yellow-500/40 text-white placeholder:text-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            maxLength={2000}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim()}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/30 text-black font-bold p-3 rounded-lg transition-all disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />

      <UserSearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onUserSelect={handleUserSelect}
      />

      <BottomNav />
    </div>
  );
};

export default ChatEnhanced;
