import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Friend {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
}

interface FriendsAvatarBarProps {
  friends: Friend[];
  onSelectFriend: (friendId: string, username: string) => void;
  selectedFriendId: string | null;
}

export const FriendsAvatarBar = ({ 
  friends, 
  onSelectFriend, 
  selectedFriendId 
}: FriendsAvatarBarProps) => {
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (friends.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border/40 bg-card/30">
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-4 py-3">
          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onSelectFriend(friend.id, friend.display_name)}
              className={`
                relative flex-shrink-0 transition-all
                ${selectedFriendId === friend.id 
                  ? 'ring-2 ring-primary scale-110' 
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
                }
              `}
              title={friend.display_name}
            >
              <Avatar className="w-12 h-12 border-2 border-border/40">
                <AvatarImage src={friend.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white font-bold text-sm">
                  {getInitials(friend.display_name)}
                </AvatarFallback>
              </Avatar>
              
              {/* Online status indicator */}
              {friend.is_online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
