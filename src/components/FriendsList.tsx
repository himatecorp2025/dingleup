import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Friend {
  id: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_online: boolean;
}

interface FriendsListProps {
  userId: string;
  onSelectFriend: (friendId: string, username: string) => void;
  selectedFriendId: string | null;
}

export const FriendsList = ({ userId, onSelectFriend, selectedFriendId }: FriendsListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    loadFriends();
    
    // Realtime subscriptions
    const channel = supabase
      .channel('friendships-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        loadFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, () => {
        loadFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => {
        loadFriends();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reads' }, () => {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('get-friends', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      setFriends(data?.friends || []);
    } catch (error) {
      console.error('[FriendsList] Error loading friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="w-16 flex items-center justify-center bg-background/30 backdrop-blur-sm border-r border-border/10">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-16 flex-shrink-0 bg-background/30 backdrop-blur-sm border-r border-border/10 overflow-y-auto" data-tutorial="friends-menu">
      <div className="flex flex-col items-center py-3 gap-3">
        {friends.length === 0 ? (
          <div className="text-foreground/40 text-xs px-2 text-center">
            Nincs
          </div>
        ) : (
          friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onSelectFriend(friend.id, friend.display_name)}
              className={`
                relative flex-shrink-0 transition-all
                ${selectedFriendId === friend.id 
                  ? 'ring-2 ring-accent scale-110' 
                  : 'hover:scale-105'
                }
              `}
              title={friend.display_name}
            >
              <Avatar className="w-12 h-12 border-2 border-border/20">
                <AvatarImage src={friend.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-foreground font-bold text-sm">
                  {getInitials(friend.display_name)}
                </AvatarFallback>
              </Avatar>
              
              {/* Online status indicator */}
              {friend.is_online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-background/50 rounded-full" />
              )}
              
              {/* Unread badge */}
              {friend.unread_count > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background/50">
                  {friend.unread_count > 9 ? '9+' : friend.unread_count}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
