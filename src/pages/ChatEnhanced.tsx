import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Search, UserPlus } from 'lucide-react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { ReportDialog } from '@/components/ReportDialog';
import { UserSearchDialog } from '@/components/UserSearchDialog';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { ThreadsList } from '@/components/chat/ThreadsList';
import { ThreadView } from '@/components/chat/ThreadView';
import { TutorialManager } from '@/components/tutorial/TutorialManager';

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
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Set presence on mount
  useEffect(() => {
    if (!userId) return;

    const setPresence = async () => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          is_online: true,
          last_seen: new Date().toISOString()
        });
    };

    setPresence();

    // Update presence every 30 seconds
    const interval = setInterval(setPresence, 30000);

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      supabase
        .from('user_presence')
        .update({
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', userId)
        .then(() => console.log('[ChatEnhanced] Set offline'));
    };
  }, [userId]);

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
    if (!userId) return;
    
    loadThreads();

    // Realtime subscriptions for immediate updates
    const channel = supabase
      .channel('threads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, (payload) => {
        console.log('[ChatEnhanced] dm_messages changed', payload);
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, (payload) => {
        console.log('[ChatEnhanced] dm_threads changed', payload);
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, (payload) => {
        console.log('[ChatEnhanced] user_presence changed', payload);
        loadThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, (payload) => {
        console.log('[ChatEnhanced] friendships changed', payload);
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

  const handleSelectThread = (thread: Thread) => {
    setSelectedFriendId(thread.other_user_id);
  };

  const handleUserSelect = async (selectedUserId: string, username: string) => {
    if (!userId) return;

    // Csak a beszélgetés megnyitása; az ismerős-jelölés külön gombbal történik
    setSelectedFriendId(selectedUserId);
    setShowSearchDialog(false);
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase.rpc('archive_thread_for_user', { p_thread_id: threadId });
      if (error) throw error;
      loadThreads();
      const deletedThread = threads.find(t => t.id === threadId);
      if (deletedThread?.other_user_id === selectedFriendId) {
        setSelectedFriendId(null);
      }
      toast.success('Beszélgetés archiválva');
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Hiba történt');
    }
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
      paddingBottom: 'calc(64px + env(safe-area-inset-bottom))'
    }}>
      {/* Header */}
      <div className="bg-[#0f0f2a]/80 border-b-2 border-[#D4AF37]/50 p-4 flex items-center gap-4 backdrop-blur-sm">
        <h1 className="flex-1 text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-white to-[#D4AF37]">
          Chat
        </h1>
        <button
          data-tutorial="search-friends"
          onClick={() => setShowSearchDialog(true)}
          className="p-2 bg-[#138F5E]/20 hover:bg-[#138F5E]/30 rounded-lg transition-all border border-[#138F5E]/50"
          aria-label="Új beszélgetés"
          title="Új beszélgetés indítása"
        >
          <UserPlus className="w-5 h-5 text-[#138F5E]" />
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

      {/* Main Content */}
      <div className="h-[calc(100%-64px)]" data-tutorial="threads-list">
        {selectedFriendId ? (
          <ThreadView 
            key={selectedFriendId}
            friendId={selectedFriendId}
            userId={userId!}
            onBack={() => setSelectedFriendId(null)}
          />
        ) : (
          <ThreadsList 
            threads={threads}
            selectedThreadId={selectedFriendId}
            onThreadSelect={handleSelectThread}
            onThreadDelete={handleDeleteThread}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </div>

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
      <TutorialManager route="chat" />
    </div>
  );
};

export default ChatEnhanced;
