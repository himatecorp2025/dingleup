import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Crown, ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import { useGeniusAnalytics } from '@/hooks/useGeniusAnalytics';
import { GeniusOverviewTab } from '@/components/genius/GeniusOverviewTab';
import { GeniusSubscriptionsTab } from '@/components/genius/GeniusSubscriptionsTab';

const GeniusMembersEnhanced = () => {
  const navigate = useNavigate();
  const { analytics, loading, error } = useGeniusAnalytics();

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
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#ffd700] animate-spin" />
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
        <div className="bg-gradient-to-r from-[#0a1f14] via-[#0e4d2e] to-[#0a1f14] border-b-2 border-[#d4af37] p-4 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-lg bg-[#d4af37]/20 hover:bg-[#d4af37]/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#d4af37]" />
            </button>
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-[#ffd700] animate-pulse" />
              <h1 className="text-2xl font-black text-white bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#ffd700] bg-clip-text text-transparent">
                GENIUS TAGOK RÉSZLETES ELEMZÉS
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-[#0a1f14] border border-[#d4af37]/30 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                Áttekintés
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                Előfizetések
              </TabsTrigger>
              <TabsTrigger value="purchases" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                Vásárlások
              </TabsTrigger>
              <TabsTrigger value="games" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                Játékstatisztikák
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                Aktivitás
              </TabsTrigger>
              <TabsTrigger value="invitations" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                Meghívások
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                Chat/Közösség
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <GeniusOverviewTab analytics={analytics} />
            </TabsContent>

            <TabsContent value="subscriptions">
              <GeniusSubscriptionsTab members={analytics.members} />
            </TabsContent>

            <TabsContent value="purchases">
              <div className="text-white">Vásárlások tab (fejlesztés alatt)</div>
            </TabsContent>

            <TabsContent value="games">
              <div className="text-white">Játékstatisztikák tab (fejlesztés alatt)</div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="text-white">Aktivitás tab (fejlesztés alatt)</div>
            </TabsContent>

            <TabsContent value="invitations">
              <div className="text-white">Meghívások tab (fejlesztés alatt)</div>
            </TabsContent>

            <TabsContent value="chat">
              <div className="text-white">Chat/Közösség tab (fejlesztés alatt)</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default GeniusMembersEnhanced;
