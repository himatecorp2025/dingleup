import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Back Button - 3D Box Style */}
      <div className="fixed top-4 left-4 z-50 pt-safe">
        <button
          onClick={() => navigate('/dashboard')}
          className="relative p-3 rounded-xl hover:scale-110 transition-all"
          title="Vissza"
        >
          {/* BASE SHADOW */}
          <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
          
          {/* OUTER FRAME */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
          
          {/* MIDDLE FRAME */}
          <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
          
          {/* INNER LAYER */}
          <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
          
          {/* SPECULAR HIGHLIGHT */}
          <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
          
          {/* Icon */}
          <svg className="w-6 h-6 text-white relative z-10 -scale-x-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="h-full w-full overflow-y-auto overflow-x-hidden relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }}>
        <div className="max-w-2xl mx-auto px-4 pt-20">
        {/* Header */}
        <div className="text-center mb-6 pt-safe">
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg className="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-3xl font-black text-white">Hívd meg barátaidat!</h1>
          </div>
          <p className="text-white/70">Oszd meg meghívó kódodat vagy linkedet</p>
        </div>

        <div className="space-y-4">
          {/* Invitation Code - 3D Box Style */}
          <div className="relative rounded-xl p-4 overflow-hidden">
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-400/50 shadow-lg" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-purple-500/40 via-purple-600/40 to-purple-700/40" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)' }} aria-hidden />
            
            <div className="relative z-10">
              <label className="text-sm font-bold mb-2 block text-white drop-shadow-lg">Meghívó kód</label>
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
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Invitation Link - 3D Box Style */}
          <div className="relative rounded-xl p-4 overflow-hidden">
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-400/50 shadow-lg" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-purple-500/40 via-purple-600/40 to-purple-700/40" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)' }} aria-hidden />
            
            <div className="relative z-10">
              <label className="text-sm font-bold mb-2 block text-white drop-shadow-lg">Meghívó link</label>
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
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Total Rewards Summary - 3D Box Style */}
          <div className="relative rounded-xl p-4 mb-4 overflow-hidden">
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-700 via-yellow-600 to-orange-900 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/20" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-yellow-600 via-orange-500 to-orange-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-yellow-500/40 via-orange-600/40 to-orange-700/40" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.15), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.18) 40%, transparent 70%)' }} aria-hidden />
            
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 12V22H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 7H2V12H22V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="text-xl font-black text-white">Összes jutalom</h2>
              </div>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-400 text-2xl font-black">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="#d97706" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="6" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
                      <text x="12" y="16" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="bold">$</text>
                    </svg>
                    {totalCoins}
                  </div>
                  <p className="text-xs text-white/70">Aranyérmék</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-400 text-2xl font-black">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#dc2626" strokeWidth="1.5"/>
                    </svg>
                    {totalLives}
                  </div>
                  <p className="text-xs text-white/70">Életek</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Section - Tier based - 3D Box Style */}
          <div className="relative rounded-xl p-5 overflow-hidden">
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-700 via-purple-600 to-purple-900 border-2 border-yellow-400/40 shadow-lg" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-yellow-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-yellow-500/30 via-purple-600/30 to-purple-700/30" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.12), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.12) 40%, transparent 70%)' }} aria-hidden />
            
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9H4.5C4.10218 9 3.72064 9.15804 3.43934 9.43934C3.15804 9.72064 3 10.1022 3 10.5V19.5C3 19.8978 3.15804 20.2794 3.43934 20.5607C3.72064 20.842 4.10218 21 4.5 21H19.5C19.8978 21 20.2794 20.842 20.5607 20.5607C20.842 20.2794 21 19.8978 21 19.5V10.5C21 10.1022 20.842 9.72064 20.5607 9.43934C20.2794 9.15804 19.8978 9 19.5 9H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3L6 9H18L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 9V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="text-xl font-black text-white">Jutalom szintek</h2>
              </div>
              
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  invitedCount >= 1 ? 'bg-purple-600/30 border-purple-400' : 'bg-black/40 border-purple-500/30'
                }`}>
                  <span className="text-white font-bold text-sm">1-2. barát {invitedCount >= 1 && '✓'}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1 text-white">
                      <svg className="w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="9" fill="currentColor" stroke="#d97706" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="6" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
                        <text x="12" y="16" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="bold">$</text>
                      </svg>
                      200/fő
                    </span>
                    <span className="flex items-center gap-1 text-white">
                      <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#dc2626" strokeWidth="1.5"/>
                      </svg>
                      3/fő
                    </span>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  invitedCount >= 3 ? 'bg-purple-600/30 border-purple-400' : 'bg-black/40 border-purple-500/30'
                }`}>
                  <span className="text-white font-bold text-sm">3-9. barát {invitedCount >= 3 && '✓'}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1 text-white">
                      <svg className="w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="9" fill="currentColor" stroke="#d97706" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="6" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
                        <text x="12" y="16" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="bold">$</text>
                      </svg>
                      1000/fő
                    </span>
                    <span className="flex items-center gap-1 text-white">
                      <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#dc2626" strokeWidth="1.5"/>
                      </svg>
                      5/fő
                    </span>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  invitedCount >= 10 ? 'bg-purple-600/30 border-purple-400' : 'bg-black/40 border-purple-500/30'
                }`}>
                  <span className="text-white font-bold text-sm">10+ barát {invitedCount >= 10 && '✓'}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1 text-white">
                      <svg className="w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="9" fill="currentColor" stroke="#d97706" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="6" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
                        <text x="12" y="16" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="bold">$</text>
                      </svg>
                      6000/fő
                    </span>
                    <span className="flex items-center gap-1 text-white">
                      <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#dc2626" strokeWidth="1.5"/>
                      </svg>
                      20/fő
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/60 mt-4 text-center">
                A sorozat minden 60 napban nullázódik. Minden elfogadott barát után jutalmat kapsz!
              </p>
            </div>
          </div>

          {/* Invited Friends List - 3D Box Style */}
          <div className="relative rounded-xl p-5 overflow-hidden">
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(4px, 4px)', filter: 'blur(6px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 border-2 border-purple-400/40 shadow-lg shadow-purple-500/20" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-xl bg-gradient-to-b from-purple-600 via-purple-500 to-purple-800" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.25)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-xl bg-gradient-to-b from-purple-500/30 via-purple-600/30 to-purple-700/30" style={{ boxShadow: 'inset 0 8px 20px rgba(255,255,255,0.12), inset 0 -8px 20px rgba(0,0,0,0.4)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 30% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.12) 40%, transparent 70%)' }} aria-hidden />
            
            
            <div className="relative z-10">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
                          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
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
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="12" r="9" fill="currentColor" stroke="#d97706" strokeWidth="2"/>
                              <circle cx="12" cy="12" r="6" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.5"/>
                              <text x="12" y="16" textAnchor="middle" fill="#d97706" fontSize="10" fontWeight="bold">$</text>
                            </svg>
                            {getRewardForCount(invitedCount).coins}
                          </span>
                          <span className="flex items-center gap-1 text-red-400">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#dc2626" strokeWidth="1.5"/>
                            </svg>
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
      </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Invitation;