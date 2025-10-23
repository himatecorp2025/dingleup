import { Search, MoreVertical, Trash2, MessageCircle, Users, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FriendRequestsList } from './FriendRequestsList';
import { FriendProfileCard } from './FriendProfileCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface UnifiedSearchResults {
  friends: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    online: boolean;
  }>;
  threads: Array<{
    threadId: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar: string | null;
    lastMessageSnippet: string;
    lastAt: string | null;
  }>;
  messages: Array<{
    threadId: string;
    messageId: string;
    excerpt: string;
    at: string;
    partnerName: string;
    isSentByMe: boolean;
  }>;
}

interface ThreadsListProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onThreadSelect: (thread: Thread) => void;
  onThreadDelete: (threadId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ThreadsList = ({
  threads,
  selectedThreadId,
  onThreadSelect,
  onThreadDelete,
  searchQuery,
  onSearchChange,
}: ThreadsListProps) => {
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        performUnifiedSearch(searchQuery.trim());
      }, 200);
      
      return () => {
        clearTimeout(timer);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      setSearchResults(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [searchQuery]);

  const performUnifiedSearch = async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        `unified-search?q=${encodeURIComponent(query)}&limit=10`,
        { 
          headers: { 
            'Cache-Control': 'no-store, no-cache', 
            'Pragma': 'no-cache' 
          }
        }
      );
      
      if (error) throw error;
      
      if (!abortControllerRef.current.signal.aborted) {
        setSearchResults(data);
      }
    } catch (error: any) {
      if (!abortControllerRef.current?.signal.aborted && error.name !== 'AbortError') {
        console.error('Unified search error:', error);
        toast.error('Keresési hiba, próbáld újra');
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsSearching(false);
      }
    }
  };

  const handleThreadFromSearch = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      onThreadSelect(thread);
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'most';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    if (diffDays === 1) return 'tegnap';
    if (diffDays < 7) return `${diffDays} napja`;
    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  const truncateMessage = (text: string | null) => {
    if (!text) return 'Új beszélgetés';
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  };

  const filteredThreads = searchResults ? [] : threads.filter(thread => 
    !searchQuery || thread.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#000000]">
      <FriendRequestsList onRequestHandled={() => {}} />

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-[#D4AF37]/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          <Input
            type="text"
            placeholder="Keresés ismerősök, beszélgetések, üzenetek között..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-[#D4AF37]/20 text-white placeholder:text-white/40 focus:border-[#D4AF37]/50 rounded-lg"
          />
        </div>
      </div>

      {/* Search Results or Threads List */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.trim().length >= 2 && searchResults ? (
          <div className="p-4 space-y-6">
            {/* Friends Section */}
            {searchResults.friends.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-[#D4AF37] text-sm font-bold">
                  <Users className="w-4 h-4" />
                  ISMERŐSÖK ({searchResults.friends.length})
                </div>
                <div className="space-y-2">
                  {searchResults.friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => setSelectedFriend(friend)}
                      className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#1a1a1a]/80 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 rounded-lg transition-all"
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-[#D4AF37]/30">
                          <AvatarImage src={friend.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white font-bold">
                            {getInitials(friend.name)}
                          </AvatarFallback>
                        </Avatar>
                        {friend.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1a1a] rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-white">{friend.name}</p>
                        <p className="text-xs text-[#D4AF37]/60">{friend.online ? 'Online' : 'Offline'}</p>
                      </div>
                      <MessageCircle className="w-5 h-5 text-[#138F5E]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Threads Section */}
            {searchResults.threads.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-[#D4AF37] text-sm font-bold">
                  <MessageCircle className="w-4 h-4" />
                  BESZÉLGETÉSEK ({searchResults.threads.length})
                </div>
                <div className="space-y-2">
                  {searchResults.threads.map((thread) => (
                    <button
                      key={thread.threadId}
                      onClick={() => handleThreadFromSearch(thread.threadId)}
                      className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#1a1a1a]/80 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 rounded-lg transition-all"
                    >
                      <Avatar className="w-12 h-12 border-2 border-[#D4AF37]/30">
                        <AvatarImage src={thread.partnerAvatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white font-bold">
                          {getInitials(thread.partnerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-white truncate">{thread.partnerName}</p>
                        <p className="text-sm text-white/60 truncate">{thread.lastMessageSnippet}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Section */}
            {searchResults.messages.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 text-[#D4AF37] text-sm font-bold">
                  <Mail className="w-4 h-4" />
                  ÜZENETEK ({searchResults.messages.length})
                </div>
                <div className="space-y-2">
                  {searchResults.messages.map((msg) => (
                    <button
                      key={msg.messageId}
                      onClick={() => handleThreadFromSearch(msg.threadId)}
                      className="w-full flex flex-col gap-2 p-3 bg-[#1a1a1a] hover:bg-[#1a1a1a]/80 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 rounded-lg transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-[#D4AF37]">{msg.partnerName}</p>
                        <span className="text-xs text-white/40">•</span>
                        <p className="text-xs text-white/40">{msg.isSentByMe ? 'Te' : msg.partnerName}</p>
                      </div>
                      <p className="text-sm text-white/80">{msg.excerpt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.friends.length === 0 && 
             searchResults.threads.length === 0 && 
             searchResults.messages.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">Nincs találat</p>
              </div>
            )}
          </div>
        ) : searchQuery.trim().length > 0 && searchQuery.trim().length < 2 ? (
          <div className="text-center py-12">
            <p className="text-white/50">Írj be legalább 2 karaktert</p>
          </div>
        ) : (
          filteredThreads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-white/60">
                {searchQuery ? 'Nincs találat' : 'Nincs még beszélgetésed'}
              </p>
              {!searchQuery && (
                <p className="text-white/40 text-sm mt-2">Keresd meg ismerősödet a zöld + ikonnal</p>
              )}
            </div>
          ) : (
            <div>
              {filteredThreads.map((thread) => {
                const hasUnread = thread.unread_count > 0;
                
                return (
                  <div
                    key={thread.id}
                    onClick={() => onThreadSelect(thread)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all relative ${
                      selectedThreadId === thread.other_user_id ? 'bg-[#2a2a2c]' : 'hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {/* Avatar with status */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-14 h-14 border-2 border-white/20">
                        <AvatarImage src={thread.other_user_avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-900 text-white font-bold text-lg">
                          {getInitials(thread.other_user_name)}
                        </AvatarFallback>
                      </Avatar>
                      {thread.online_status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#00FF66] rounded-full border-2 border-[#000000]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className={`${hasUnread ? 'font-semibold' : 'font-normal'} text-white truncate text-[15px]`}>
                          {thread.other_user_name}
                        </h3>
                        <span className="text-[13px] text-white/50 flex-shrink-0">
                          {formatTime(thread.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[13px] truncate ${hasUnread ? 'text-white font-medium' : 'text-white/60'}`}>
                          {truncateMessage(thread.last_message_preview)}
                        </p>
                        {hasUnread && (
                          <div className="flex-shrink-0 min-w-[8px] h-[8px] bg-[#0a7cff] rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* More menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === thread.id ? null : thread.id);
                      }}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-white/60" />
                    </button>

                    {openMenuId === thread.id && (
                      <div className="absolute right-4 top-12 bg-[#1a1a1a] border border-[#D4AF37]/20 rounded-lg shadow-xl z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setThreadToDelete(thread.id);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 w-full text-left rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                          Törlés
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Friend Profile Card */}
      {selectedFriend && (
        <FriendProfileCard
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
          onMessageSent={(threadId) => {
            const thread = threads.find(t => t.id === threadId);
            if (thread) {
              onThreadSelect(thread);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!threadToDelete} onOpenChange={() => setThreadToDelete(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#D4AF37]/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Beszélgetés törlése?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Ez a művelet archiválja a beszélgetést. A másik fél továbbra is láthatja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20 border-0">
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (threadToDelete) {
                  onThreadDelete(threadToDelete);
                  setThreadToDelete(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
