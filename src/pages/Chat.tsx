import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Users, Plus, MoreVertical, Send, Image, Video, Link as LinkIcon } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ReportDialog } from '@/components/ReportDialog';
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
  lastMessage?: string;
  unreadCount: number;
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

const Chat = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);

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
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    if (!userId) return;

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

    if (convos) {
      setConversations(
        convos.map((c) => ({
          ...c,
          unreadCount: 0,
        }))
      );
    }
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
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/80 to-purple-700/80 backdrop-blur-md border-b-2 border-yellow-500/50 p-4 shadow-lg flex items-center justify-between">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-yellow-400" />
            Beszélgetések
          </h1>
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

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-purple-500/30 overflow-y-auto bg-black/20">
            <div className="p-2">
              <Button
                onClick={() => {
                  toast.info('Csoportlétrehozás funkcionalitás hamarosan!');
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Új beszélgetés
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
                  {conv.is_group ? (
                    <Users className="w-5 h-5 text-purple-400" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {conv.name || 'Privát beszélgetés'}
                    </p>
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
                <p>Válassz egy beszélgetést</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
      <ReportDialog open={showReportDialog} onOpenChange={setShowReportDialog} />
    </div>
  );
};

export default Chat;
