import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, UserPlus } from 'lucide-react';
import { ReportDialog } from '@/components/ReportDialog';
import { UserSearchDialog } from '@/components/chat/UserSearchDialog';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { ThreadsList } from '@/components/chat/ThreadsList';
import { ThreadViewEnhanced } from '@/components/chat/ThreadViewEnhanced';
import { ScrollInspector } from '@/components/ScrollInspector';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { FriendsHexagonBar } from '@/components/chat/FriendsHexagonBar';
import { useUserPresence } from '@/hooks/useUserPresence';
import { trackChatInteraction } from '@/lib/analytics';

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
  useAutoLogout();
  
  const [userId, setUserId] = useState<string | undefined>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<{ userId: string; username: string } | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const prevPendingCountRef = useRef(0);

  // Active thread details for header
  const activeThread = selectedFriend ? threads.find(t => t.other_user_id === selectedFriend.userId) : null;
  const { isOnline } = useUserPresence(selectedFriend?.userId);

  // When opening from URL, backfill username from threads when available
  useEffect(() => {
    if (selectedFriend && !selectedFriend.username) {
      const t = threads.find(t => t.other_user_id === selectedFriend.userId);
      if (t) setSelectedFriend({ userId: selectedFriend.userId, username: t.other_user_name });
    }
  }, [threads, selectedFriend]);
  useEffect(() => {
    if (!userId) return;
    const setPresence = async () => {
      await supabase.from('user_presence').upsert({
        user_id: userId,
        is_online: true,
        last_seen: new Date().toISOString()
      });
    };
    setPresence();
    const interval = setInterval(setPresence, 30000);
    return () => {
      clearInterval(interval);
      supabase.from('user_presence').update({
        is_online: false,
        last_seen: new Date().toISOString()
      }).eq('user_id', userId);
    };
  }, [userId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        
        // Track chat opened
        trackChatInteraction(session.user.id, 'chat_opened');
        
        // Open thread from URL param if provided on initial load
        const params = new URLSearchParams(window.location.search);
        const friend = params.get('friend');
        if (friend) {
          setSelectedFriend({ userId: friend, username: '' });
        }
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    loadThreads();
    loadPendingRequestsCount();
    
    const channel = supabase.channel('threads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, () => loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, () => loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        loadThreads();
        loadPendingRequestsCount();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // React to friend param changes to open thread directly
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const friend = params.get('friend');
    if (friend) {
      setSelectedFriend({ userId: friend, username: '' });
    }
  }, [location.search]);

  const loadThreads = async () => {
    try {
      // Fast fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const { data, error } = await supabase.functions.invoke('get-threads', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (error) throw error;
      setThreads(data?.threads || []);
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Error loading threads:', error);
      }
    }
  };

  const loadPendingRequestsCount = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const { data, error } = await supabase.functions.invoke('get-friend-requests', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (error) throw error;
      const newCount = data?.received?.length || 0;
      
      // Show notification if count increased
      if (newCount > prevPendingCountRef.current && prevPendingCountRef.current > 0) {
        toast.success('🎉 Új ismerős jelölés érkezett!', {
          duration: 4000,
        });
      }
      
      prevPendingCountRef.current = newCount;
      setPendingRequestsCount(newCount);
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error('Error loading pending requests count:', error);
      }
    }
  };

  const handleSelectThread = (thread: Thread) => {
    setSelectedFriend({ userId: thread.other_user_id, username: thread.other_user_name });
    
    // Track thread opened
    if (userId) {
      trackChatInteraction(userId, 'thread_opened', {
        target_user_id: thread.other_user_id,
        thread_id: thread.id
      });
    }
  };


  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase.rpc('archive_thread_for_user', { p_thread_id: threadId });
      if (error) throw error;
      loadThreads();
      const deletedThread = threads.find(t => t.id === threadId);
      if (deletedThread?.other_user_id === selectedFriend?.userId) {
        setSelectedFriend(null);
      }
      toast.success('Beszélgetés archiválva');
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Hiba történt');
    }
  };

  return (
    <div className="chat-container bg-[#000000] flex flex-col overflow-hidden" style={{ height: 'calc(var(--vh, 1vh) * 100)', minHeight: '100dvh', background: '#000000' }}>
      <div className="sticky top-0 z-[10000] bg-[#1a1a1a] border-b border-[#D4AF37]/10" style={{ height: 'var(--appbar-h)' }}>
        <div className="flex items-center justify-between h-full px-3">
          {/* Left: Chat icon (acts as back to list when a beszélgetés van nyitva) */}
          <button
            onClick={() => selectedFriend ? setSelectedFriend(null) : null}
            className="p-2 rounded-lg hover:bg-white/5 transition"
            aria-label="Chats"
            title="Chats"
          >
            <span className="text-xl">💬</span>
          </button>

          {/* Middle: aktuális partner neve + státusz, ha beszélgetés nyitva */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            {selectedFriend ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-9 h-9 rounded-full border border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/20 to-[#8B0000]/20 overflow-hidden flex items-center justify-center">
                  {activeThread?.other_user_avatar ? (
                    <img src={activeThread.other_user_avatar} alt={selectedFriend.username || 'Profil'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#D4AF37] font-bold">
                      {(selectedFriend.username?.charAt(0) || '?').toUpperCase()}
                    </span>
                  )}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1a1a] ${isOnline ? 'bg-[#138F5E]' : 'bg-white/30'}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate max-w-[180px]">
                    {selectedFriend.username || 'Betöltés...'}
                  </div>
                  <div className="text-xs truncate" style={{ color: isOnline ? '#138F5E' : 'rgba(255,255,255,0.5)' }}>
                    {isOnline ? 'Aktív most' : 'Offline'}
                  </div>
                </div>
              </div>
            ) : (
              <h1 className="text-lg font-black text-white">Chats</h1>
            )}
          </div>

          {/* Right: új felhasználók + jelentés */}
          <div className="flex gap-2">
            <button
              data-tutorial="search-friends"
              onClick={() => setSearchDialogOpen(true)}
              className="relative p-2 bg-[#138F5E]/20 hover:bg-[#138F5E]/30 rounded-lg transition-all border border-[#138F5E]/50"
              title="Új ismerős felvétele"
            >
              <UserPlus className="w-5 h-5 text-[#138F5E]" />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setReportDialogOpen(true)}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all border border-red-500/50"
              title="Jelentés küldése"
            >
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex bg-[#000000] min-h-0">
        <div className="flex-1 flex flex-col min-h-0" data-tutorial="threads-list">
          {selectedFriend ? (
            <ThreadViewEnhanced
              friendId={selectedFriend.userId}
              userId={userId || ''}
              onBack={() => setSelectedFriend(null)}
              hideHeader={true}
            />
          ) : (
            <>
              <FriendsHexagonBar 
                friends={threads.filter(t => t.online_status === 'online')} 
                onFriendClick={handleSelectThread}
              />
              <ThreadsList
                threads={threads}
                selectedThreadId={null}
                onThreadSelect={handleSelectThread}
                onThreadDelete={handleDeleteThread}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Dev Scroll Inspector (Ctrl+Alt+S to toggle) */}
      <ScrollInspector />

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        reportedUserId={selectedFriend?.userId}
      />

      {searchDialogOpen && (
        <UserSearchDialog
          onClose={() => setSearchDialogOpen(false)}
          userId={userId || ''}
        />
      )}

      <TutorialManager route="chat" />
    </div>
  );
};

export default ChatEnhanced;
