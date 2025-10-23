import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Friend {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  online_status?: 'online' | 'away' | 'offline';
}

interface FriendsHexagonBarProps {
  friends: Friend[];
  onFriendClick: (friend: Friend) => void;
}

export const FriendsHexagonBar = ({ friends, onFriendClick }: FriendsHexagonBarProps) => {
  if (friends.length === 0) return null;

  return (
    <div className="px-4 py-3 bg-[#1a1a1a] border-b border-[#D4AF37]/10">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {friends.slice(0, 10).map((friend) => (
          <button
            key={friend.other_user_id}
            onClick={() => onFriendClick(friend)}
            className="flex-shrink-0 relative group"
          >
            <div 
              className="w-14 h-14 hexagon-clip bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] p-[2px] hover:from-[#F4D03F] hover:to-[#D4AF37] transition-all"
            >
              <div className="w-full h-full hexagon-clip bg-[#0a0a0a] flex items-center justify-center">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={friend.other_user_avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] text-black font-bold">
                    {friend.other_user_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            {friend.online_status === 'online' && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#138F5E] rounded-full border-2 border-[#0a0a0a]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
