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
    <div className="min-h-dvh min-h-svh bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/admin')}
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary-glow" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                Fejlett Analitika
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <button
            onClick={() => navigate('/admin/retention')}
            className="bg-primary-dark/50 hover:bg-primary-dark/70 border border-primary-glow/30 rounded-xl p-6 text-left transition-all hover:scale-105"
          >
            <Target className="w-8 h-8 text-primary-glow mb-3" />
            <h4 className="text-foreground font-bold text-lg mb-2">Retenciós Dashboard</h4>
            <p className="text-muted-foreground text-sm">DAU/WAU/MAU, kohorsz analízis, lemorzsolódás</p>
          </button>

          <button
            onClick={() => navigate('/admin/monetization')}
            className="bg-primary-dark/50 hover:bg-primary-dark/70 border border-primary-glow/30 rounded-xl p-6 text-left transition-all hover:scale-105"
          >
            <DollarSign className="w-8 h-8 text-primary-glow mb-3" />
            <h4 className="text-foreground font-bold text-lg mb-2">Monetizációs Dashboard</h4>
            <p className="text-muted-foreground text-sm">Bevétel, ARPU, konverzió, LTV analízis</p>
          </button>

          <button
            onClick={() => navigate('/admin/performance')}
            className="bg-primary-dark/50 hover:bg-primary-dark/70 border border-primary-glow/30 rounded-xl p-6 text-left transition-all hover:scale-105"
          >
            <Zap className="w-8 h-8 text-primary-glow mb-3" />
            <h4 className="text-foreground font-bold text-lg mb-2">Teljesítmény Dashboard</h4>
            <p className="text-muted-foreground text-sm">Betöltési idők, TTFB, LCP, hibák</p>
          </button>

          <button
            onClick={() => navigate('/admin/engagement')}
            className="bg-primary-dark/50 hover:bg-primary-dark/70 border border-primary-glow/30 rounded-xl p-6 text-left transition-all hover:scale-105"
          >
            <Activity className="w-8 h-8 text-primary-glow mb-3" />
            <h4 className="text-foreground font-bold text-lg mb-2">Engagement Dashboard</h4>
            <p className="text-muted-foreground text-sm">Session adatok, funkció használat, játék engagement</p>
          </button>

          <button
            onClick={() => navigate('/admin/user-journey')}
            className="bg-primary-dark/50 hover:bg-primary-dark/70 border border-primary-glow/30 rounded-xl p-6 text-left transition-all hover:scale-105"
          >
            <MapIcon className="w-8 h-8 text-primary-glow mb-3" />
            <h4 className="text-foreground font-bold text-lg mb-2">User Journey Dashboard</h4>
            <p className="text-muted-foreground text-sm">Tölcsérek, útvonalak, kilépési pontok</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;