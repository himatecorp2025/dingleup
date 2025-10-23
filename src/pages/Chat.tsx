import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { ThreadsList } from '@/components/chat/ThreadsList';
import { ThreadView } from '@/components/chat/ThreadView';
import { FriendsAvatarBar } from '@/components/chat/FriendsAvatarBar';
import { UserSearchDialog } from '@/components/chat/UserSearchDialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';

interface ChatThread {
  id: string;
  otherUserId: string;
  otherUsername: string;
  otherAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isOnline: boolean;
}

export default function Chat() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedFriendUsername, setSelectedFriendUsername] = useState<string>('');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Enable presence heartbeat
  usePresenceHeartbeat(session?.user?.id, true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    loadThreads();
    
    // Real-time subscriptions
    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, () => {
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, () => {
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => {
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        loadThreads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const loadThreads = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-threads');
      if (error) throw error;
      setThreads(data?.threads || []);
    } catch (error) {
      console.error('[Chat] Error loading threads:', error);
      setThreads([]);
    }
  };

  const handleSelectFriend = (friendId: string, username: string) => {
    setSelectedFriendId(friendId);
    setSelectedFriendUsername(username);
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase.rpc('archive_thread_for_user', {
        p_thread_id: threadId
      });
      
      if (error) throw error;
      
      if (selectedFriendId === threadId) {
        setSelectedFriendId(null);
        setSelectedFriendUsername('');
      }
      
      await loadThreads();
    } catch (error) {
      console.error('[Chat] Error deleting thread:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return null;
  }

  // Get friends from threads for avatar bar
  const friends = threads.map(t => ({
    id: t.otherUserId,
    display_name: t.otherUsername,
    avatar_url: t.otherAvatar,
    is_online: t.isOnline
  }));

  // Convert ChatThread to Thread format expected by ThreadsList
  const threadsForList = threads.map(t => ({
    id: t.id,
    other_user_id: t.otherUserId,
    other_user_name: t.otherUsername,
    other_user_avatar: t.otherAvatar,
    last_message_preview: t.lastMessage,
    last_message_at: t.lastMessageAt,
    unread_count: t.unreadCount,
    online_status: (t.isOnline ? 'online' : 'offline') as 'online' | 'away' | 'offline'
  }));

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b border-border bg-card">
        <h1 className="text-2xl font-bold text-foreground">Üzenetek</h1>
        <button
          onClick={() => setShowUserSearch(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Új beszélgetés
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Threads List */}
        <div className="w-full md:w-96 flex flex-col border-r border-border overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Keresés az üzenetekben és ismerősök között..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Friends Avatar Bar */}
          <FriendsAvatarBar
            friends={friends}
            onSelectFriend={handleSelectFriend}
            selectedFriendId={selectedFriendId}
          />

          {/* Threads List */}
          <ThreadsList
            threads={threadsForList}
            selectedThreadId={selectedFriendId}
            onThreadSelect={(thread) => handleSelectFriend(thread.other_user_id, thread.other_user_name)}
            onThreadDelete={handleDeleteThread}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Thread View */}
        {selectedFriendId ? (
          <ThreadView
            friendId={selectedFriendId}
            userId={session.user.id}
            onBack={() => {
              setSelectedFriendId(null);
              setSelectedFriendUsername('');
            }}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-xl mb-2">Válassz egy beszélgetést</p>
              <p className="text-sm">vagy kezdj egy újat a keresés gombbal</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {showUserSearch && (
        <UserSearchDialog
          onClose={() => setShowUserSearch(false)}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
