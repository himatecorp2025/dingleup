import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, UserPlus } from 'lucide-react';
import { ReportDialog } from '@/components/ReportDialog';
import { UserSearchDialog } from '@/components/UserSearchDialog';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { ThreadsList } from '@/components/chat/ThreadsList';
import { ThreadView } from '@/components/chat/ThreadView';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { FriendsList } from '@/components/FriendsList';

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
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    loadThreads();
    const channel = supabase.channel('threads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, () => loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, () => loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => loadThreads())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => loadThreads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    setSelectedFriend({ userId: thread.other_user_id, username: thread.other_user_name });
  };

  const handleUserSelect = async (selectedUserId: string, username: string) => {
    if (!userId) return;
    setSelectedFriend({ userId: selectedUserId, username });
    setSearchDialogOpen(false);
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
    <div className="h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex flex-col">
      <div className="flex-none bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">💬 Chat</h1>
          <div className="flex gap-2">
            <button
              data-tutorial="search-friends"
              onClick={() => setSearchDialogOpen(true)}
              className="p-2 bg-[#138F5E]/20 hover:bg-[#138F5E]/30 rounded-lg transition-all border border-[#138F5E]/50"
              title="Új beszélgetés indítása"
            >
              <UserPlus className="w-5 h-5 text-[#138F5E]" />
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

      <div className="flex-1 flex pb-16">
        <FriendsList
          userId={userId || ''}
          onSelectFriend={(friendId, username) => {
            setSelectedFriend({ userId: friendId, username });
          }}
          selectedFriendId={selectedFriend?.userId || null}
        />

        <div className="flex-1 flex flex-col bg-[#000000]" data-tutorial="threads-list">
          {selectedFriend ? (
            <ThreadView
              friendId={selectedFriend.userId}
              userId={userId || ''}
              onBack={() => setSelectedFriend(null)}
            />
          ) : (
            <ThreadsList
              threads={threads}
              selectedThreadId={null}
              onThreadSelect={handleSelectThread}
              onThreadDelete={handleDeleteThread}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
        </div>
      </div>

      <BottomNav />

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        reportedUserId={selectedFriend?.userId}
      />

      <UserSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onUserSelect={handleUserSelect}
      />

      <TutorialManager route="chat" />
    </div>
  );
};

export default ChatEnhanced;
