import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle, Info, UserPlus } from 'lucide-react';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSelect: (userId: string, username: string) => void;
}

interface SearchResult {
  id: string;
  username: string;
  avatar_url: string | null;
  is_online?: boolean;
}

interface FriendActionProps {
  currentUserId?: string;
  targetUserId: string;
  username: string;
}

const FriendAction = ({ currentUserId, targetUserId, username }: FriendActionProps) => {
  const { status, sendRequest, loading } = useFriendshipStatus(currentUserId, targetUserId);

  if (!currentUserId) return null;

  if (status === 'active') return null;
  if (status === 'blocked') {
    return (
      <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300 flex items-center gap-1">
        <Info className="w-3 h-3" />
        Nem elérhető
      </div>
    );
  }

  if (status === 'pending_sent') {
    return (
      <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-300">
        Folyamatban
      </div>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-300">
        Várakozik jóváhagyásra
      </div>
    );
  }

  return (
    <Button
      onClick={async () => {
        try {
          await sendRequest();
          toast.success(`${username} ismerősnek jelölve – folyamatban`);
        } catch (e) {
          toast.error('Ismerős jelölés sikertelen');
        }
      }}
      size="sm"
      className="bg-gradient-to-r from-green-600 to-green-800"
      disabled={loading}
    >
      <UserPlus className="w-4 h-4 mr-1" />
      Bejelölöm
    </Button>
  );
};

export const UserSearchDialog = ({ open, onOpenChange, onUserSelect }: UserSearchDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Load current user id
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id);
    });
  }, []);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setResults([]);
      setSearching(false);
    }
  }, [open]);

  // Auto-search when typing (with debounce) + unmount safety
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const term = searchTerm.trim();
        // SECURITY: Csak biztonságos mezőket kérdezünk le (NEM email, coins, lives, stb.)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, invitation_code')
          .or(`username.ilike.%${term}%,invitation_code.eq.${term}`)
          .limit(20);
        if (error) throw error;

        const userIds = data?.map(u => u.id) || [];
        const { data: presenceData } = await supabase
          .from('user_presence')
          .select('user_id, is_online')
          .in('user_id', userIds);

        if (!alive) return;

        const resultsWithPresence = data?.map(user => ({
          ...user,
          is_online: presenceData?.find(p => p.user_id === user.id)?.is_online || false,
        })) || [];

        setResults(resultsWithPresence.filter(u => u.id !== currentUserId));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        if (alive) setSearching(false);
      }
    }, 300);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchTerm, currentUserId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-purple-900 to-purple-950 border-2 border-yellow-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-yellow-400">
            Felhasználó keresése
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Felhasználónév vagy meghívókód..."
              className="bg-gray-800 border-purple-500/50 text-white pr-10"
            />
            <Search className="w-5 h-5 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {searching && (
              <div className="text-center text-purple-300 py-4">
                Keresés...
              </div>
            )}
            
            {!searching && searchTerm && results.length === 0 && (
              <div className="text-center text-purple-300 py-4">
                Nincs találat
              </div>
            )}
            
            {!searching && results.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-purple-500/30 hover:bg-gray-800/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {user.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{user.username}</p>
                    <p className="text-xs text-purple-300">
                      {user.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FriendAction currentUserId={currentUserId} targetUserId={user.id} username={user.username} />
                  <Button
                    onClick={() => {
                      onUserSelect(user.id, user.username);
                      onOpenChange(false);
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-green-800"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Üzenet
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
