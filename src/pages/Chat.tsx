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
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  online_status: 'online' | 'away' | 'offline';
}

interface Friend {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
}

export default function Chat() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedFriendUsername, setSelectedFriendUsername] = useState<string>('');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

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

  // Enable presence heartbeat only when session is available
  usePresenceHeartbeat(session?.user?.id, !!session?.user?.id);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    loadThreads();
    loadFriends();
    
    // Real-time subscriptions - reload threads and friends on any change
    const channel = supabase
      .channel('chat-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, () => {
        console.log('[Chat] dm_threads changed, reloading threads & friends');
        loadThreads();
        loadFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, () => {
        console.log('[Chat] dm_messages changed, reloading threads & friends');
        loadThreads();
        loadFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => {
        console.log('[Chat] user_presence changed, reloading friends');
        loadFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        console.log('[Chat] friendships changed, reloading friends');
        loadFriends();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const loadFriends = async () => {
    if (!session?.user?.id) return;
    try {
      console.log('[Chat] Loading friends for user:', session.user.id);
      const { data, error } = await supabase.functions.invoke('get-friends');
      if (error) throw error;
      const fr = (data?.friends || []).map((f: any) => ({
        id: f.id,
        display_name: f.display_name,
        avatar_url: f.avatar_url,
        is_online: !!f.is_online,
      }));
      setFriends(fr);
    } catch (error) {
      console.error('[Chat] Error loading friends:', error);
      setFriends([]);
    }
  };

  const loadThreads = async () => {
    if (!session?.user?.id) return;

    try {
      console.log('[Chat] Loading threads for user:', session.user.id);
      const { data, error } = await supabase.functions.invoke('get-threads');
      if (error) throw error;
      console.log('[Chat] Loaded threads:', data?.threads?.length || 0);
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
      <div className="flex items-center justify-center min-h-dvh min-h-svh">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return null;
  }

  // Convert ChatThread to Thread format expected by ThreadsList
  const threadsForList = threads.map(t => ({
    id: t.id,
    other_user_id: t.other_user_id,
    other_user_name: t.other_user_name,
    other_user_avatar: t.other_user_avatar,
    last_message_preview: t.last_message_preview,
    last_message_at: t.last_message_at,
    unread_count: t.unread_count,
    online_status: t.online_status
  }));

  return (
    <div className="flex flex-col h-dvh h-svh max-h-dvh max-h-svh overflow-hidden fixed inset-0" style={{
      background: 'hsl(var(--background))',
      paddingTop: 'calc(env(safe-area-inset-top) + 10vh)',
      paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))'
    }}>
      <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border" style={{ background: 'hsl(var(--card))' }}>
        <h1 className="text-2xl font-bold text-foreground">Üzenetek</h1>
        <button
          onClick={() => setShowUserSearch(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Új beszélgetés
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Threads List */}
        <div className="w-full md:w-96 flex flex-col border-r border-border overflow-hidden">
          {/* Search Bar */}
          <div className="flex-shrink-0 p-4 border-b border-border/40">
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

      <div className="flex-shrink-0">
        <BottomNav />
      </div>

      {showUserSearch && (
        <UserSearchDialog
          onClose={() => setShowUserSearch(false)}
          userId={session.user.id}
        />
      )}
    </div>
  );
}
