import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Target, DollarSign, Zap, Activity, Map as MapIcon, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const AdvancedAnalytics = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)'
    }}>
      <div className="h-full w-full overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="bg-[#0a0a2e]/80 border-b border-purple-500/30 p-4 sm:p-6 sticky top-0 z-20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  Fejlett Analitika
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <button
              onClick={() => navigate('/admin/retention')}
              className="bg-[#1a1a3e]/50 hover:bg-[#1a1a3e]/70 border border-purple-500/30 rounded-xl p-6 text-left transition-all hover:scale-105"
            >
              <Target className="w-8 h-8 text-purple-400 mb-3" />
              <h4 className="text-white font-bold text-lg mb-2">Retenciós Dashboard</h4>
              <p className="text-white/60 text-sm">DAU/WAU/MAU, kohorsz analízis, lemorzsolódás</p>
            </button>

            <button
              onClick={() => navigate('/admin/monetization')}
              className="bg-[#1a1a3e]/50 hover:bg-[#1a1a3e]/70 border border-purple-500/30 rounded-xl p-6 text-left transition-all hover:scale-105"
            >
              <DollarSign className="w-8 h-8 text-purple-400 mb-3" />
              <h4 className="text-white font-bold text-lg mb-2">Monetizációs Dashboard</h4>
              <p className="text-white/60 text-sm">Bevétel, ARPU, konverzió, LTV analízis</p>
            </button>

            <button
              onClick={() => navigate('/admin/performance')}
              className="bg-[#1a1a3e]/50 hover:bg-[#1a1a3e]/70 border border-purple-500/30 rounded-xl p-6 text-left transition-all hover:scale-105"
            >
              <Zap className="w-8 h-8 text-purple-400 mb-3" />
              <h4 className="text-white font-bold text-lg mb-2">Teljesítmény Dashboard</h4>
              <p className="text-white/60 text-sm">Betöltési idők, TTFB, LCP, hibák</p>
            </button>

            <button
              onClick={() => navigate('/admin/engagement')}
              className="bg-[#1a1a3e]/50 hover:bg-[#1a1a3e]/70 border border-purple-500/30 rounded-xl p-6 text-left transition-all hover:scale-105"
            >
              <Activity className="w-8 h-8 text-purple-400 mb-3" />
              <h4 className="text-white font-bold text-lg mb-2">Engagement Dashboard</h4>
              <p className="text-white/60 text-sm">Session adatok, funkció használat, játék engagement</p>
            </button>

            <button
              onClick={() => navigate('/admin/user-journey')}
              className="bg-[#1a1a3e]/50 hover:bg-[#1a1a3e]/70 border border-purple-500/30 rounded-xl p-6 text-left transition-all hover:scale-105"
            >
              <MapIcon className="w-8 h-8 text-purple-400 mb-3" />
              <h4 className="text-white font-bold text-lg mb-2">User Journey Dashboard</h4>
              <p className="text-white/60 text-sm">Tölcsérek, útvonalak, kilépési pontok</p>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdvancedAnalytics;