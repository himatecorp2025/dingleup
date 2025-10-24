import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Target, DollarSign, Zap, Activity, Map as MapIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/admin')}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                Fejlett Analitika
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
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
  );
};

export default AdvancedAnalytics;