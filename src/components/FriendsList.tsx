import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Search as SearchIcon, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Friend {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessageSnippet: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  onlineStatus: 'online' | 'away' | 'offline';
}

interface FriendsListProps {
  userId: string;
  onSelectFriend: (friendId: string) => void;
  selectedFriendId: string | null;
}

export const FriendsList = ({ userId, onSelectFriend, selectedFriendId }: FriendsListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
    
    // Realtime subscriptions for immediate updates
    const channel = supabase
      .channel('friendships-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        console.log('[FriendsList] Friendship changed, reloading...');
        loadFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, () => {
        console.log('[FriendsList] Message changed, reloading friends...');
        loadFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => {
        console.log('[FriendsList] User presence changed, reloading...');
        loadFriends();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-friends');

      if (error) {
        console.error('[FriendsList] Error loading friends:', error);
        toast.error('Hiba a barátok betöltésekor');
        setFriends([]);
        return;
      }

      console.log('[FriendsList] Loaded friends:', data);
      setFriends(data.friends || []);
    } catch (err) {
      console.error('[FriendsList] Exception loading friends:', err);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(f =>
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}n`;
    if (hours > 0) return `${hours}ó`;
    if (minutes > 0) return `${minutes}p`;
    return 'most';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[hsl(var(--dup-text-200))]">
        <p>Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--dup-ui-bg-900))]">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--dup-gold-600)/0.3)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-[hsl(var(--dup-gold-300))] flex items-center gap-2">
            <Users className="w-5 h-5" />
            Ismerősök
          </h2>
          <button
            onClick={() => loadFriends()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-lg bg-[hsl(var(--dup-gold-600)/0.2)] hover:bg-[hsl(var(--dup-gold-600)/0.3)] text-[hsl(var(--dup-gold-200))] border border-[hsl(var(--dup-gold-500)/0.4)]"
            title="Ismerősök frissítése"
          >
            <RefreshCw className="w-4 h-4" /> Frissítés
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--dup-text-300))]" />
          <Input
            type="text"
            placeholder="Keresés..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/50 border-[hsl(var(--dup-gold-600)/0.4)] text-[hsl(var(--dup-text-100))] placeholder:text-[hsl(var(--dup-text-300))] focus-visible:ring-[hsl(var(--dup-gold-500))]"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 text-[hsl(var(--dup-gold-600))] mx-auto mb-4 opacity-50" />
            <p className="text-[hsl(var(--dup-text-200))] font-bold">
              {searchQuery ? 'Nincs találat' : 'Még nincs ismerősöd'}
            </p>
            <p className="text-[hsl(var(--dup-text-300))] text-sm mt-2">
              Hívj meg barátokat a játékba!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--dup-gold-600)/0.2)]">
            {filteredFriends.map((friend) => (
              <button
                key={friend.userId}
                onClick={() => onSelectFriend(friend.userId)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-[hsl(var(--dup-gold-600)/0.08)] transition-colors ${
                  selectedFriendId === friend.userId ? 'bg-[hsl(var(--dup-green-500)/0.15)]' : ''
                }`}
              >
                {/* Avatar with online status */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-12 h-12 border-2 border-[hsl(var(--dup-gold-500))]">
                    <AvatarImage src={friend.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[hsl(var(--dup-gold-600))] text-white font-bold">
                      {getInitials(friend.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  {friend.onlineStatus === 'online' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[hsl(var(--dup-green-500))] border-2 border-[hsl(var(--dup-ui-bg-900))] rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-[hsl(var(--dup-text-100))] truncate">
                      {friend.displayName}
                    </p>
                    {friend.lastMessageAt && (
                      <span className="text-xs text-[hsl(var(--dup-text-300))] flex-shrink-0 ml-2">
                        {formatTime(friend.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  
                  {friend.lastMessageSnippet && (
                    <p className="text-sm text-[hsl(var(--dup-text-300))] truncate">
                      {friend.lastMessageSnippet}
                    </p>
                  )}
                </div>

                {/* Unread badge */}
                {friend.unreadCount > 0 && (
                  <Badge className="bg-[hsl(var(--dup-crimson-500))] text-white font-bold border-none">
                    {friend.unreadCount > 9 ? '9+' : friend.unreadCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
