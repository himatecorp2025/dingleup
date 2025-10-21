import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Users, Plus, MoreVertical, Send, Search as SearchIcon } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ReportDialog } from '@/components/ReportDialog';
import { UserSearchDialog } from '@/components/UserSearchDialog';
import { useUserPresence } from '@/hooks/useUserPresence';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  other_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_online: boolean;
  };
}

interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

const ChatEnhanced = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track user presence
  useUserPresence(userId);

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
    loadConversations();

    // Subscribe to conversation changes
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedConversation) return;
    loadMessages(selectedConversation);

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages((prev) => [...prev, { ...newMessage, sender }]);
          
          // Show notification if message is from another user
          if (newMessage.sender_id !== userId && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Új üzenet', {
              body: `${sender?.username}: ${newMessage.content?.substring(0, 50)}...`,
              icon: sender?.avatar_url || '/logo.png',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, userId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadConversations = async () => {
    if (!userId) return;

    // Lekérjük a meghívásokat (barátok)
    const { data: invitations } = await supabase
      .from('invitations')
      .select('inviter_id, invited_user_id')
      .or(`inviter_id.eq.${userId},invited_user_id.eq.${userId}`)
      .eq('accepted', true);

    const friendIds = new Set<string>();
    invitations?.forEach(inv => {
      if (inv.inviter_id === userId) friendIds.add(inv.invited_user_id);
      if (inv.invited_user_id === userId) friendIds.add(inv.inviter_id);
    });

    const { data: members } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!members) return;

    const conversationIds = members.map((m) => m.conversation_id);

    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (!convos) return;

    const conversationsWithUsers = await Promise.all(
      convos.map(async (conv) => {
        if (!conv.is_group) {
          const { data: otherMembers } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conv.id)
            .neq('user_id', userId);

          if (otherMembers && otherMembers.length > 0) {
            const otherUserId = otherMembers[0].user_id;
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', otherUserId)
              .single();

            const { data: presence } = await supabase
              .from('user_presence')
              .select('is_online')
              .eq('user_id', otherUserId)
              .single();

            return {
              ...conv,
              other_user: {
                ...profile,
                is_online: presence?.is_online || false,
              },
              is_friend: friendIds.has(otherUserId),
            };
          }
        }
        return conv;
      })
    );

    // Barátok kerüljenek előre
    const sorted = conversationsWithUsers.sort((a: any, b: any) => {
      if (a.is_friend && !b.is_friend) return -1;
      if (!a.is_friend && b.is_friend) return 1;
      return 0;
    });

    setConversations(sorted as Conversation[]);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as any);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !userId) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation,
      sender_id: userId,
      content: messageText.trim(),
    });

    if (error) {
      toast.error('Hiba az üzenet küldésekor');
    } else {
      setMessageText('');
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation);
    }
  };

  const createPrivateConversation = async (otherUserId: string, username: string) => {
    if (!userId) return;

    try {
      // Check if conversation already exists
      const { data: existingMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      if (existingMembers) {
        for (const member of existingMembers) {
          const { data: otherMember } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', member.conversation_id)
            .eq('user_id', otherUserId)
            .single();

          if (otherMember) {
            setSelectedConversation(member.conversation_id);
            toast.success(`Beszélgetés nyitva: ${username}`);
            return;
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          is_group: false,
          created_by: userId,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add both users as members
      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: newConv.id, user_id: userId },
          { conversation_id: newConv.id, user_id: otherUserId },
        ]);

      if (membersError) throw membersError;

      toast.success(`Új beszélgetés létrehozva: ${username}`);
      loadConversations();
      setSelectedConversation(newConv.id);
    } catch (error) {
      console.error('Create conversation error:', error);
      toast.error('Hiba a beszélgetés létrehozásakor');
    }
  };

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0">
      <div className="h-full flex flex-col pb-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/80 to-purple-700/80 backdrop-blur-md border-b-2 border-yellow-500/50 p-4 shadow-lg flex items-center justify-between">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-yellow-400" />
            {selectedConvData?.other_user ? selectedConvData.other_user.username : 'Chat'}
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowUserSearch(true)}
              size="icon"
              variant="ghost"
              className="text-white"
            >
              <SearchIcon className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  Jelentés beküldése
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-purple-500/30 overflow-y-auto bg-black/20">
            <div className="p-2">
              <Button
                onClick={() => setShowUserSearch(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Új üzenet
              </Button>
            </div>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full p-3 text-left border-b border-purple-500/20 transition-colors ${
                  selectedConversation === conv.id
                    ? 'bg-purple-600/40'
                    : 'hover:bg-purple-600/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {conv.is_group ? (
                      <Users className="w-5 h-5 text-purple-400" />
                    ) : conv.other_user?.avatar_url ? (
                      <img
                        src={conv.other_user.avatar_url}
                        alt={conv.other_user.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        {conv.other_user?.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {!conv.is_group && conv.other_user?.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {conv.is_group ? conv.name : conv.other_user?.username || 'Ismeretlen'}
                    </p>
                    {!conv.is_group && conv.other_user && (
                      <p className="text-xs text-purple-300">
                        {conv.other_user.is_online ? 'Online' : 'Offline'}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === userId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 ${
                          msg.sender_id === userId
                            ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        {msg.sender_id !== userId && (
                          <p className="text-xs text-purple-300 mb-1">
                            {msg.sender?.username || 'Ismeretlen'}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-purple-500/30 p-4 bg-black/20">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Írj üzenetet..."
                      className="flex-1 bg-gray-800 border-purple-500/50 text-white"
                    />
                    <Button
                      onClick={sendMessage}
                      className="bg-gradient-to-r from-purple-600 to-purple-800"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/50">
                <p>Válassz vagy kezdj egy beszélgetést</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
      <ReportDialog open={showReportDialog} onOpenChange={setShowReportDialog} />
      <UserSearchDialog
        open={showUserSearch}
        onOpenChange={setShowUserSearch}
        onUserSelect={createPrivateConversation}
      />
    </div>
  );
};

export default ChatEnhanced;
