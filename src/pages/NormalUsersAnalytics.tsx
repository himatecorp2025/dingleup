import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';

const NormalUsersAnalytics = () => {
  const navigate = useNavigate();

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
            <TabsList className="bg-[#0a1f14] border border-blue-500/30 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Áttekintés
              </TabsTrigger>
              <TabsTrigger value="registration" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Regisztrációk
              </TabsTrigger>
              <TabsTrigger value="purchases" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Vásárlások
              </TabsTrigger>
              <TabsTrigger value="games" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Játékstatisztikák
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Aktivitás
              </TabsTrigger>
              <TabsTrigger value="invitations" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Meghívások
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Chat/Közösség
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="text-white text-center py-20">
                <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Normál Felhasználók Áttekintés</h2>
                <p className="text-white/70">Fejlesztés alatt...</p>
              </div>
            </TabsContent>

            <TabsContent value="registration">
              <div className="text-white">Regisztrációk tab (fejlesztés alatt)</div>
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

export default NormalUsersAnalytics;
