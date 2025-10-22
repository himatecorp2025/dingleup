import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

interface GeniusMember {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  subscription_tier: string | null;
  created_at: string;
}

const GeniusMembers = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<GeniusMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndFetchMembers();
  }, []);

  const checkAdminAndFetchMembers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);

      // Fetch all subscribed users (Genius members)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, subscription_tier, created_at')
        .eq('is_subscribed', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembers(profiles || []);
    } catch (error) {
      console.error('Error fetching Genius members:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]">
        <p className="text-lg text-white">Betöltés...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-b-2 border-[#d4af37] p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#d4af37]" />
          </button>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-[#ffd700] animate-pulse" />
            <h1 className="text-2xl font-black text-white bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#ffd700] bg-clip-text text-transparent">
              GENIUS TAGOK
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Card className="bg-gradient-to-br from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-2 border-[#d4af37]">
          <CardHeader>
            <CardTitle className="text-[#ffd700] flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Összesen {members.length} Genius tag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.length === 0 ? (
                <p className="text-white/70 text-center py-8">Még nincsenek Genius tagok</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-gradient-to-r from-[#1a5f3a]/40 via-[#0e4d2e]/60 to-[#1a5f3a]/40 rounded-lg p-4 border border-[#d4af37]/30"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffd700] to-[#d4af37] flex items-center justify-center border-2 border-[#ffd700] flex-shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-black text-black">
                            {getInitials(member.username)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-bold text-lg">{member.username}</h3>
                          <Crown className="w-4 h-4 text-[#ffd700]" />
                        </div>
                        
                        <p className="text-white/70 text-sm mb-2">{member.email}</p>
                        
                        <div className="flex flex-wrap gap-3 text-xs">
                          <div className="flex items-center gap-1 text-[#d4af37]">
                            <Calendar className="w-3 h-3" />
                            <span>Csatlakozott: {formatDate(member.created_at)}</span>
                          </div>
                          
                          {member.subscription_tier && (
                            <div className="flex items-center gap-1 text-[#ffd700]">
                              <Crown className="w-3 h-3" />
                              <span>Tier: {member.subscription_tier}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default GeniusMembers;
