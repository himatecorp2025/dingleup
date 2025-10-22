import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface FriendRequest {
  id: string;
  requested_by: string;
  created_at: string;
  requester: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface FriendRequestsListProps {
  onRequestHandled: () => void;
}

export const FriendRequestsList = ({ onRequestHandled }: FriendRequestsListProps) => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();

    // Realtime subscription for new requests
    const channel = supabase
      .channel('friend-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        loadRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-friend-requests');
      if (error) throw error;
      setRequests(data?.received || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId: string) => {
    try {
      const { error } = await supabase.functions.invoke('accept-friend-request', {
        body: { userId: requesterId }
      });
      if (error) throw error;
      toast.success('Ismerős jelölés elfogadva!');
      loadRequests();
      onRequestHandled();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Hiba történt');
    }
  };

  const handleDecline = async (requesterId: string) => {
    try {
      const { error } = await supabase.functions.invoke('decline-friend-request', {
        body: { userId: requesterId }
      });
      if (error) throw error;
      toast.success('Jelölés elutasítva');
      loadRequests();
      onRequestHandled();
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Hiba történt');
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-white/60 text-sm">Betöltés...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-[#D4AF37]/30 pb-4 mb-4">
      <h3 className="text-[#D4AF37] font-bold px-4 py-2 text-sm">ISMERŐS KÉRÉSEK</h3>
      <div className="space-y-2 px-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-3 p-3 bg-[#1a1a2e] border border-[#D4AF37]/20 rounded-lg"
          >
            <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center flex-shrink-0">
              {request.requester.avatar_url ? (
                <img src={request.requester.avatar_url} alt={request.requester.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{getInitials(request.requester.username)}</span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{request.requester.username}</p>
              <p className="text-xs text-[#D4AF37]/60">Ismerősnek jelölt</p>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleAccept(request.requested_by)}
                className="p-2 bg-[#138F5E] hover:bg-[#138F5E]/80 rounded-lg transition-colors"
                title="Elfogadás"
              >
                <Check className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => handleDecline(request.requested_by)}
                className="p-2 bg-[#DC143C] hover:bg-[#DC143C]/80 rounded-lg transition-colors"
                title="Elutasítás"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
