import { Search, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  onSearchChange 
}: ThreadsListProps) => {
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>(threads);
  const [contextMenuThreadId, setContextMenuThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredThreads(threads);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = threads.filter(thread => 
      thread.other_user_name.toLowerCase().includes(query)
    );
    setFilteredThreads(filtered);
  }, [searchQuery, threads]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-[#00FF66]';
      case 'away': return 'bg-[#FFA500]';
      default: return 'bg-[#666]';
    }
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

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const truncateMessage = (text: string | null) => {
    if (!text) return 'Új beszélgetés';
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  };

  return (
    <div className="h-full flex flex-col bg-[#0F1116]">
      {/* Search Bar */}
      <div className="p-4 border-b border-[#D4AF37]/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]/60" />
          <input
            type="search"
            placeholder="Felhasználó keresése..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-[#D4AF37]/40 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#138F5E]"
          />
        </div>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">
              {searchQuery ? 'Nincs találat' : 'Nincs még beszélgetésed'}
            </p>
            {!searchQuery && (
              <p className="text-white/40 text-sm mt-2">Keresd meg ismerősödet a felső mezőben</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#D4AF37]/10">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => onThreadSelect(thread)}
                className={`p-4 hover:bg-[#138F5E]/10 cursor-pointer transition-colors relative ${
                  selectedThreadId === thread.other_user_id ? 'bg-[#138F5E]/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar with status */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
                      {thread.other_user_avatar ? (
                        <img src={thread.other_user_avatar} alt={thread.other_user_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">{getInitials(thread.other_user_name)}</span>
                      )}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(thread.online_status)} rounded-full border-2 border-[#0F1116]`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-bold text-white truncate">{thread.other_user_name}</h3>
                      <span className="text-xs text-[#D4AF37]/60 flex-shrink-0">{formatTime(thread.last_message_at)}</span>
                    </div>
                    <p className="text-sm text-white/70 truncate">{truncateMessage(thread.last_message_preview)}</p>
                  </div>

                  {/* Unread badge */}
                  {thread.unread_count > 0 && (
                    <div className="flex-shrink-0 w-5 h-5 bg-[#138F5E] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{thread.unread_count}</span>
                    </div>
                  )}

                  {/* Context menu button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuThreadId(contextMenuThreadId === thread.id ? null : thread.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-[#D4AF37]" />
                  </button>

                  {/* Context menu */}
                  {contextMenuThreadId === thread.id && (
                    <div className="absolute right-4 top-16 bg-[#1a1a2e] border border-[#D4AF37]/30 rounded-lg shadow-lg z-10 min-w-[150px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onThreadDelete(thread.id);
                          setContextMenuThreadId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Archiválás
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
