import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Copy, Check, Gift, Coins, Heart, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const INVITATION_REWARDS = [
  { count: 1, coins: 200, lives: 3 },
  { count: 3, coins: 1000, lives: 5 },
  { count: 5, coins: 2500, lives: 10 },
  { count: 10, coins: 6000, lives: 20 }
];

const Invitation = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [invitationCode, setInvitationCode] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [invitedCount, setInvitedCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchInvitationData(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  const fetchInvitationData = async (uid: string) => {
    try {
      // Get user's invitation code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('invitation_code')
        .eq('id', uid)
        .single();

      if (profileError) throw profileError;

      setInvitationCode(profile.invitation_code);
      setInvitationLink(`${window.location.origin}/register?code=${profile.invitation_code}`);

      // Count accepted invitations
      const { count, error: countError } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_id', uid)
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
      toast.success(type === 'code' ? 'Meghívó kód másolva!' : 'Meghívó link másolva!');
    } catch (error) {
      console.error('Error copying:', error);
      toast.error('Hiba a másolás során');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] p-3 overflow-hidden">
      {/* Back button - same style as shop */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-3 left-3 p-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50 z-10"
        title="Vissza"
      >
        <LogOut className="w-5 h-5 -scale-x-100" />
      </button>

      <div className="max-w-md mx-auto pt-12 h-full overflow-hidden">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-black text-white">Hívd meg barátaidat!</h1>
          </div>
          <p className="text-sm text-white/70">Osztd meg meghívó kódodat vagy linkedet</p>
        </div>

        <div className="space-y-2">
          {/* Invitation Code */}
          <div className="bg-purple-900/30 rounded-lg p-2 border border-purple-500/30">
            <label className="text-xs font-medium mb-1 block text-white">Meghívó kód</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationCode}
                readOnly
                className="flex-1 px-3 py-1.5 bg-black/40 border border-purple-500/50 rounded-lg font-mono text-sm text-center text-white"
              />
              <Button
                onClick={() => copyToClipboard(invitationCode, 'code')}
                className="bg-purple-600 hover:bg-purple-700 text-white h-auto px-2"
                size="icon"
              >
                {<Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Invitation Link */}
          <div className="bg-purple-900/30 rounded-lg p-2 border border-purple-500/30">
            <label className="text-xs font-medium mb-1 block text-white">Meghívó link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="flex-1 px-3 py-1.5 bg-black/40 border border-purple-500/50 rounded-lg text-xs text-white"
              />
              <Button
                onClick={() => copyToClipboard(invitationLink, 'link')}
                className="bg-purple-600 hover:bg-purple-700 text-white h-auto px-2"
                size="icon"
              >
                {<Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-purple-900/30 rounded-lg p-2 text-center border border-purple-500/30">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-white">Meghívott barátok</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{invitedCount}</p>
          </div>

          {/* Rewards */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-xs text-white mb-1">Jutalmak:</h3>
            {INVITATION_REWARDS.map((reward) => {
              const achieved = invitedCount >= reward.count;
              return (
                <div
                  key={reward.count}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    achieved
                      ? 'bg-purple-600/30 border-purple-400'
                      : 'bg-black/40 border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${achieved ? 'text-purple-300' : 'text-white/70'}`}>
                      {reward.count} barát
                    </span>
                    {achieved && <Check className="w-4 h-4 text-purple-300" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-white">{reward.coins}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="font-bold text-white">{reward.lives}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invitation;
