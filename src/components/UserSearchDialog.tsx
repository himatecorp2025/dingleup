import { useState } from 'react';
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
import { Search, MessageCircle } from 'lucide-react';

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

export const UserSearchDialog = ({ open, onOpenChange, onUserSelect }: UserSearchDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Írj be egy felhasználónevet vagy meghívókódot!');
      return;
    }

    setSearching(true);

    try {
      const term = searchTerm.trim();
      
      // Search by username (exact match) or invitation code (exact match) or partial username
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          invitation_code
        `)
        .or(`username.eq.${term},invitation_code.eq.${term},username.ilike.%${term}%`)
        .limit(20);

      if (error) throw error;

      // Get online status
      const userIds = data?.map(u => u.id) || [];
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('user_id, is_online')
        .in('user_id', userIds);

      const resultsWithPresence = data?.map(user => ({
        ...user,
        is_online: presenceData?.find(p => p.user_id === user.id)?.is_online || false,
      })) || [];

      setResults(resultsWithPresence);

      if (resultsWithPresence.length === 0) {
        toast.info('Nincs találat');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Hiba történt a keresés során');
    } finally {
      setSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-purple-900 to-purple-950 border-2 border-yellow-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-yellow-400">
            Felhasználó keresése
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Felhasználónév vagy meghívókód..."
              className="flex-1 bg-gray-800 border-purple-500/50 text-white"
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="bg-gradient-to-r from-purple-600 to-purple-800"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {results.map((user) => (
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
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
