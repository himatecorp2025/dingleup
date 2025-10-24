import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import { useNormalUsersAnalytics } from '@/hooks/useNormalUsersAnalytics';
import { NormalUsersOverviewTab } from '@/components/normalusers/NormalUsersOverviewTab';
import { NormalUsersPurchasesTab } from '@/components/normalusers/NormalUsersPurchasesTab';
import { NormalUsersGameStatsTab } from '@/components/normalusers/NormalUsersGameStatsTab';
import { NormalUsersActivityTab } from '@/components/normalusers/NormalUsersActivityTab';
import { NormalUsersInvitationsTab } from '@/components/normalusers/NormalUsersInvitationsTab';
import { NormalUsersChatTab } from '@/components/normalusers/NormalUsersChatTab';

const NormalUsersAnalytics = () => {
  const navigate = useNavigate();
  const { analytics, loading, error } = useNormalUsersAnalytics();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

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
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#3b82f6] animate-spin" />
          <p className="text-lg text-white">Adatok betöltése...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <p className="text-lg text-red-400">Hiba: {error || 'Nem sikerült betölteni az adatokat'}</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <div className="h-full w-full overflow-y-auto overflow-x-hidden relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a1f14] via-[#1a2e4d] to-[#0a1f14] border-b-2 border-blue-500/50 p-4 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-blue-400" />
            </button>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-black text-white bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                NORMÁL FELHASZNÁLÓK RÉSZLETES ELEMZÉS
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-[#0a1f14] border border-[#3b82f6]/30 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                Áttekintés
              </TabsTrigger>
              <TabsTrigger value="purchases" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                Vásárlások
              </TabsTrigger>
              <TabsTrigger value="games" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                Játékstatisztikák
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                Aktivitás
              </TabsTrigger>
              <TabsTrigger value="invitations" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                Meghívások
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                Chat/Közösség
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <NormalUsersOverviewTab analytics={analytics} />
            </TabsContent>

            <TabsContent value="purchases">
              <NormalUsersPurchasesTab members={analytics.members} />
            </TabsContent>

            <TabsContent value="games">
              <NormalUsersGameStatsTab members={analytics.members} />
            </TabsContent>

            <TabsContent value="activity">
              <NormalUsersActivityTab members={analytics.members} />
            </TabsContent>

            <TabsContent value="invitations">
              <NormalUsersInvitationsTab members={analytics.members} />
            </TabsContent>

            <TabsContent value="chat">
              <NormalUsersChatTab members={analytics.members} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NormalUsersAnalytics;
