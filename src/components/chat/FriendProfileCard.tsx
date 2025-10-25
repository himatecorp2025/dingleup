import { useState } from 'react';
import { MessageCircle, X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FriendProfileCardProps {
  friend: {
    id: string;
    name: string;
    avatarUrl: string | null;
    online: boolean;
  };
  onClose: () => void;
  onMessageSent: (threadId: string) => void;
}

export const FriendProfileCard = ({ friend, onClose, onMessageSent }: FriendProfileCardProps) => {
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('upsert-thread', {
        body: { userId: friend.id }
      });
      
      if (error) throw error;
      
      toast.success('Beszélgetés megnyitva!');
      onMessageSent(data.threadId);
      onClose();
    } catch (error: any) {
      console.error('Error opening thread:', error);
      toast.error(error.message || 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-[10030] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Card */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-[#0F1116] via-[#1a1a2e] to-[#0F1116] border-2 border-[#D4AF37] rounded-t-3xl sm:rounded-3xl shadow-2xl mx-auto max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-all"
            aria-label="Bezárás"
          >
            <X className="w-5 h-5 text-[#D4AF37]" />
          </button>
          
          {/* Avatar & Status */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-[#D4AF37] shadow-lg">
                <AvatarImage src={friend.avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-800 text-white font-bold text-2xl">
                  {getInitials(friend.name)}
                </AvatarFallback>
              </Avatar>
              
              {friend.online && (
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-[#0F1116] rounded-full" />
              )}
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-black text-white mb-1">{friend.name}</h2>
              <p className="text-sm text-[#D4AF37]/80 flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                {friend.online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent mx-6" />

        {/* Actions */}
        <div className="p-6 space-y-3">
          <button
            onClick={handleSendMessage}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-br from-blue-700 via-purple-700 to-purple-900 hover:from-blue-600 hover:via-purple-600 hover:to-purple-800 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-5 h-5" />
            {loading ? 'Betöltés...' : 'Üzenet küldése'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium rounded-xl transition-all border border-white/10"
          >
            Mégse
          </button>
        </div>
      </div>
    </div>
  );
};
