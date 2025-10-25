import { Search, MoreVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FriendRequestsList } from './FriendRequestsList';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  const filteredThreads = threads.filter(thread => 
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
            placeholder="Keresés..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-[#D4AF37]/20 text-white placeholder:text-white/40 focus:border-[#D4AF37]/50 rounded-lg"
          />
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }}>
        {filteredThreads.length === 0 ? (
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
                          <div className="flex-shrink-0 min-w-[8px] h-[8px] bg-gradient-to-br from-blue-600 to-purple-700 rounded-full shadow-lg shadow-blue-500/50" />
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
        }
        <div aria-hidden="true" style={{ height: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }} />
      </div>

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
