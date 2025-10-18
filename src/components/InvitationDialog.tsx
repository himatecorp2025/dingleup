import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Users, Copy, Check, Gift, Coins, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvitationDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

const INVITATION_REWARDS = [
  { count: 1, coins: 200, lives: 3 },
  { count: 3, coins: 1000, lives: 5 },
  { count: 5, coins: 2500, lives: 10 },
  { count: 10, coins: 6000, lives: 20 }
];

export const InvitationDialog = ({ open, onClose, userId }: InvitationDialogProps) => {
  const [invitationCode, setInvitationCode] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [invitedCount, setInvitedCount] = useState(0);

  useEffect(() => {
    if (open && userId) {
      fetchInvitationData();
    }
  }, [open, userId]);

  const fetchInvitationData = async () => {
    try {
      // Get user's invitation code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('invitation_code')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setInvitationCode(profile.invitation_code);
      setInvitationLink(`${window.location.origin}/register?code=${profile.invitation_code}`);

      // Count accepted invitations
      const { count, error: countError } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_id', userId)
        .eq('accepted', true);

      if (countError) throw countError;
      setInvitedCount(count || 0);
    } catch (error) {
      console.error('Error fetching invitation data:', error);
      toast.error('Hiba a meghívó adatok betöltésekor');
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(type === 'code' ? 'Meghívó kód másolva!' : 'Meghívó link másolva!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
      toast.error('Hiba a másolás során');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="relative max-w-md max-h-[85vh] overflow-y-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-purple-500/50">
        <button onClick={onClose} className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-600 text-white rounded-full border border-red-400/60 z-50">Vissza</button>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <Users className="w-6 h-6 text-purple-400" />
            Hívd meg barátaidat!
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Osztd meg meghívó kódodat vagy linkedet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invitation Code */}
          <div className="bg-purple-900/30 rounded-xl p-4 border-2 border-purple-500/30">
            <label className="text-sm font-medium mb-2 block text-white">Meghívó kód</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationCode}
                readOnly
                className="flex-1 px-4 py-2 bg-black/40 border-2 border-purple-500/50 rounded-lg font-mono text-lg text-center text-white"
              />
              <Button
                onClick={() => copyToClipboard(invitationCode, 'code')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="icon"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Invitation Link */}
          <div className="bg-purple-900/30 rounded-xl p-4 border-2 border-purple-500/30">
            <label className="text-sm font-medium mb-2 block text-white">Meghívó link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="flex-1 px-4 py-2 bg-black/40 border-2 border-purple-500/50 rounded-lg text-sm text-white"
              />
              <Button
                onClick={() => copyToClipboard(invitationLink, 'link')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="icon"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-purple-900/30 rounded-xl p-4 text-center border-2 border-purple-500/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-white">Meghívott barátok</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{invitedCount}</p>
          </div>

          {/* Rewards */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-white">Jutalmak:</h3>
            {INVITATION_REWARDS.map((reward) => {
              const achieved = invitedCount >= reward.count;
              return (
                <div
                  key={reward.count}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    achieved
                      ? 'bg-purple-600/30 border-purple-400'
                      : 'bg-black/40 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${achieved ? 'text-purple-300' : 'text-white/70'}`}>
                      {reward.count} barát
                    </span>
                    {achieved && <Check className="w-4 h-4 text-purple-300" />}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold">{reward.coins}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="font-bold">{reward.lives}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Bezárás
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
