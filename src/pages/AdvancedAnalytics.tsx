import { useNavigate } from 'react-router-dom';
import { Target, DollarSign, Zap, Activity, Map as MapIcon } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

const AdvancedAnalytics = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Fejlett Analitika
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/admin/retention')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-3xl p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
          >
            <Target className="w-10 h-10 text-purple-400 mb-4" />
            <h4 className="text-white font-bold text-xl mb-2">Retenciós Dashboard</h4>
            <p className="text-white/60 text-sm">DAU/WAU/MAU, kohorsz analízis, lemorzsolódás</p>
          </button>

          <button
            onClick={() => navigate('/admin/monetization')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-3xl p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-green-500/20"
          >
            <DollarSign className="w-10 h-10 text-green-400 mb-4" />
            <h4 className="text-white font-bold text-xl mb-2">Monetizációs Dashboard</h4>
            <p className="text-white/60 text-sm">Bevétel, ARPU, konverzió, LTV analízis</p>
          </button>

          <button
            onClick={() => navigate('/admin/performance')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-3xl p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
          >
            <Zap className="w-10 h-10 text-purple-400 mb-4" />
            <h4 className="text-white font-bold text-xl mb-2">Teljesítmény Dashboard</h4>
            <p className="text-white/60 text-sm">Betöltési idők, TTFB, LCP, hibák</p>
          </button>

          <button
            onClick={() => navigate('/admin/engagement')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-3xl p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
          >
            <Activity className="w-10 h-10 text-purple-400 mb-4" />
            <h4 className="text-white font-bold text-xl mb-2">Engagement Dashboard</h4>
            <p className="text-white/60 text-sm">Session-ök, felhasználói aktivitás, játék engagement</p>
          </button>

          <button
            onClick={() => navigate('/admin/user-journey')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-3xl p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
          >
            <MapIcon className="w-10 h-10 text-purple-400 mb-4" />
            <h4 className="text-white font-bold text-xl mb-2">User Journey</h4>
            <p className="text-white/60 text-sm">Onboarding, vásárlási és játék tölcsérek</p>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdvancedAnalytics;