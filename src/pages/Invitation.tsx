import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Copy, Gift, Coins, Heart, Users, Check, X, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

interface InvitedFriend {
  id: string;
  invited_email: string | null;
  invited_user_id: string | null;
  accepted: boolean;
  created_at: string;
  accepted_at: string | null;
}

const Invitation = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [invitationCode, setInvitationCode] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [invitedCount, setInvitedCount] = useState(0);
  const [invitedFriends, setInvitedFriends] = useState<InvitedFriend[]>([]);

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

      // Get all invitations (accepted and pending)
      const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('inviter_id', uid)
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;
      
      setInvitedFriends(invitations || []);
      setInvitedCount(invitations?.filter(i => i.accepted).length || 0);
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

  const getRewardForCount = (count: number) => {
    // 1-2 friends: 200 coins + 3 lives each
    if (count === 1 || count === 2) return { coins: 200, lives: 3 };
    // 3-9 friends: 1000 coins + 5 lives each
    if (count >= 3 && count <= 9) return { coins: 1000, lives: 5 };
    // 10+ friends: 6000 coins + 20 lives each
    if (count >= 10) return { coins: 6000, lives: 20 };
    return { coins: 0, lives: 0 };
  };
  
  const getTotalRewards = () => {
    const accepted = invitedFriends.filter(i => i.accepted).length;
    let totalCoins = 0;
    let totalLives = 0;
    
    for (let i = 1; i <= accepted; i++) {
      const reward = getRewardForCount(i);
      totalCoins += reward.coins;
      totalLives += reward.lives;
    }
    
    return { totalCoins, totalLives };
  };
  
  const { totalCoins, totalLives } = getTotalRewards();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] pb-20">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => {
            navigate('/dashboard');
          }}
          className="p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
          title="Vissza"
        >
          <LogOut className="w-6 h-6 -scale-x-100" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-black text-white">Hívd meg barátaidat!</h1>
          </div>
          <p className="text-white/70">Oszd meg meghívó kódodat vagy linkedet</p>
        </div>

        <div className="space-y-4">
          {/* Invitation Code */}
          <div className="bg-purple-900/30 rounded-xl p-4 border-2 border-purple-500/30">
            <label className="text-sm font-bold mb-2 block text-white">Meghívó kód</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationCode}
                readOnly
                className="flex-1 px-4 py-3 bg-black/40 border-2 border-purple-500/50 rounded-lg font-mono text-lg text-center text-white"
              />
              <Button
                onClick={() => copyToClipboard(invitationCode, 'code')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4"
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Invitation Link */}
          <div className="bg-purple-900/30 rounded-xl p-4 border-2 border-purple-500/30">
            <label className="text-sm font-bold mb-2 block text-white">Meghívó link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="flex-1 px-4 py-3 bg-black/40 border-2 border-purple-500/50 rounded-lg text-sm text-white overflow-hidden text-ellipsis"
              />
              <Button
                onClick={() => copyToClipboard(invitationLink, 'link')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4"
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Total Rewards Summary */}
          <div className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 rounded-xl p-4 border-2 border-yellow-500/50 mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-black text-white">Összes jutalom</h2>
            </div>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-400 text-2xl font-black">
                  <Coins className="w-6 h-6" /> {totalCoins}
                </div>
                <p className="text-xs text-white/70">Aranyérmék</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-400 text-2xl font-black">
                  <Heart className="w-6 h-6" /> {totalLives}
                </div>
                <p className="text-xs text-white/70">Életek</p>
              </div>
            </div>
          </div>

          {/* Rewards Section - Tier based */}
          <div className="bg-gradient-to-br from-yellow-900/40 to-purple-900/40 rounded-xl p-5 border-2 border-yellow-500/30">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-black text-white">Jutalom szintek</h2>
            </div>
            
            <div className="space-y-2">
              <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                invitedCount >= 1 ? 'bg-purple-600/30 border-purple-400' : 'bg-black/40 border-purple-500/30'
              }`}>
                <span className="text-white font-bold text-sm">1-2. barát {invitedCount >= 1 && '✓'}</span>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1 text-white">
                    <Coins className="w-3 h-3 text-yellow-500" /> 200/fő
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <Heart className="w-3 h-3 text-red-500" /> 3/fő
                  </span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                invitedCount >= 3 ? 'bg-purple-600/30 border-purple-400' : 'bg-black/40 border-purple-500/30'
              }`}>
                <span className="text-white font-bold text-sm">3-9. barát {invitedCount >= 3 && '✓'}</span>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1 text-white">
                    <Coins className="w-3 h-3 text-yellow-500" /> 1000/fő
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <Heart className="w-3 h-3 text-red-500" /> 5/fő
                  </span>
                </div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                invitedCount >= 10 ? 'bg-purple-600/30 border-purple-400' : 'bg-black/40 border-purple-500/30'
              }`}>
                <span className="text-white font-bold text-sm">10+ barát {invitedCount >= 10 && '✓'}</span>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1 text-white">
                    <Coins className="w-3 h-3 text-yellow-500" /> 6000/fő
                  </span>
                  <span className="flex items-center gap-1 text-white">
                    <Heart className="w-3 h-3 text-red-500" /> 20/fő
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/60 mt-4 text-center">
              A sorozat minden 60 napban nullázódik. Minden elfogadott barát után jutalmat kapsz!
            </p>
          </div>

          {/* Invited Friends List */}
          <div className="bg-purple-900/30 rounded-xl p-5 border-2 border-purple-500/30">
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Meghívott barátok ({invitedFriends.length})
            </h2>
            
            {invitedFriends.length === 0 ? (
              <p className="text-white/60 text-center py-4">Még nem hívtál meg senkit</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {invitedFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      friend.accepted
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-black/40 border-purple-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {friend.accepted ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <X className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {friend.invited_email || 'Ismeretlen'}
                        </p>
                        <p className="text-xs text-white/60">
                          {friend.accepted 
                            ? `Csatlakozott: ${new Date(friend.accepted_at!).toLocaleDateString()}`
                            : 'Függőben'}
                        </p>
                      </div>
                    </div>
                    {friend.accepted && (
                      <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Coins className="w-3 h-3" />
                          {getRewardForCount(invitedCount).coins}
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                          <Heart className="w-3 h-3" />
                          {getRewardForCount(invitedCount).lives}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Invitation;