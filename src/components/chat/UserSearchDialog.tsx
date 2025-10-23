import { useState, useEffect } from 'react';
import { Search, X, UserPlus, MessageCircle, Loader2, Check, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  friendship_status: 'not_friend' | 'pending_sent' | 'pending_received' | 'active' | 'blocked';
}

interface FriendRequest {
  id: string;
  requester_id: string;
  requester: {
    username: string;
    avatar_url: string | null;
  };
  created_at: string;
}

interface UserSearchDialogProps {
  onClose: () => void;
  userId: string;
}

export const UserSearchDialog = ({ onClose, userId }: UserSearchDialogProps) => {
  const [activeTab, setActiveTab] = useState<'search' | 'requests'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingRequests();
    
    // Realtime subscription for friend requests
    const channel = supabase
      .channel('friend-requests-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'friendships'
      }, () => {
        loadPendingRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        `search-users?query=${encodeURIComponent(searchQuery)}`
      );
      if (error) throw error;
      setSearchResults(data?.results || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Keresési hiba');
    } finally {
      setIsSearching(false);
    }
  };

  const loadPendingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-friend-requests');
      if (error) throw error;
      setPendingRequests(data?.received || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-friend-request', {
        body: { userId: targetUserId }
      });
      if (error) throw error;
      
      // Optimistic update
      setSearchResults(prev => prev.map(u => 
        u.id === targetUserId ? { ...u, friendship_status: 'pending_sent' } : u
      ));
      
      toast.success('Jelölés elküldve!');
    } catch (error: any) {
      console.error('Send request error:', error);
      toast.error(error.message || 'Hiba történt');
    }
  };

  const acceptRequest = async (requesterId: string) => {
    try {
      const { error } = await supabase.functions.invoke('accept-friend-request', {
        body: { userId: requesterId }
      });
      if (error) throw error;
      
      setPendingRequests(prev => prev.filter(r => r.requester_id !== requesterId));
      toast.success('Jelölés elfogadva!');
    } catch (error) {
      console.error('Accept error:', error);
      toast.error('Hiba történt');
    }
  };

  const declineRequest = async (requesterId: string) => {
    try {
      const { error } = await supabase.functions.invoke('decline-friend-request', {
        body: { requesterUserId: requesterId }
      });
      if (error) throw error;
      
      setPendingRequests(prev => prev.filter(r => r.requester_id !== requesterId));
      toast.success('Jelölés elutasítva');
    } catch (error) {
      console.error('Decline error:', error);
      toast.error('Hiba történt');
    }
  };

  const openThread = (targetUserId: string) => {
    navigate(`/chat?friend=${targetUserId}`);
    onClose();
  };

  const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  const getActionButton = (user: User) => {
    switch (user.friendship_status) {
      case 'not_friend':
        return (
          <button
            onClick={() => sendFriendRequest(user.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#138F5E] hover:bg-[#138F5E]/90 rounded-lg text-white text-sm font-medium transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Bejelölöm
          </button>
        );
      case 'pending_sent':
        return (
          <div className="px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-lg text-sm">
            <span className="text-[#D4AF37]">Folyamatban</span>
          </div>
        );
      case 'active':
        return (
          <button
            onClick={() => openThread(user.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#138F5E] hover:bg-[#138F5E]/90 rounded-lg text-white text-sm font-medium transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Üzenet
          </button>
        );
      case 'blocked':
        return (
          <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg text-sm">
            <span className="text-red-400">Nem elérhető</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[10020] flex flex-col">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet (top 80%) */}
      <div className="relative w-full h-[80vh] bg-[#0F1116] rounded-b-2xl border-b border-[#D4AF37]/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#D4AF37]/20">
          <h2 className="text-lg font-semibold text-white">Felhasználók keresése</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all"
            aria-label="Bezárás"
          >
            <X className="w-5 h-5 text-[#D4AF37]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#D4AF37]/20">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'search'
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Keresés
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'requests'
                ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Beérkezett jelölések
            {pendingRequests.length > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-[#D4AF37] rounded-full text-white text-xs flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'search' && (
            <div className="p-4">
              {/* Search input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Név vagy e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#D4AF37]/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#D4AF37]/50"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37] animate-spin" />
                )}
              </div>

              {/* Results */}
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#D4AF37]/10 rounded-lg hover:border-[#D4AF37]/30 transition-all"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#D4AF37]/20 to-[#8B0000]/20 flex items-center justify-center border border-[#D4AF37]/30">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#D4AF37] font-bold">{getInitials(user.username)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{user.username}</p>
                    </div>
                    {getActionButton(user)}
                  </div>
                ))}
                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <p className="text-center text-white/50 py-8">Nincs találat</p>
                )}
                {searchQuery.length < 2 && (
                  <p className="text-center text-white/50 py-8">Írj be legalább 2 karaktert</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="p-4">
              {isLoadingRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                </div>
              ) : pendingRequests.length === 0 ? (
                <p className="text-center text-white/50 py-8">Nincs függőben lévő jelölés</p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#D4AF37]/10 rounded-lg"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#D4AF37]/20 to-[#8B0000]/20 flex items-center justify-center border border-[#D4AF37]/30">
                        {request.requester.avatar_url ? (
                          <img src={request.requester.avatar_url} alt={request.requester.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#D4AF37] font-bold">{getInitials(request.requester.username)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{request.requester.username}</p>
                        <p className="text-xs text-white/50">Jelölés érkezett</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(request.requester_id)}
                          className="p-2 bg-[#138F5E] hover:bg-[#138F5E]/90 rounded-lg transition-all"
                          aria-label="Elfogadom"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => declineRequest(request.requester_id)}
                          className="p-2 bg-[#8B0000] hover:bg-[#8B0000]/90 rounded-lg transition-all"
                          aria-label="Elutasítom"
                        >
                          <XCircle className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
