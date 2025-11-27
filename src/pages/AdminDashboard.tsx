import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, TrendingUp, Search, AlertTriangle, Activity, Target, Zap, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserGrowthChart } from '@/components/UserGrowthChart';
import { AdminReportActionDialog } from '@/components/AdminReportActionDialog';
import { QuestionTranslationManager } from '@/components/QuestionTranslationManager';
import { TranslationSeeder } from '@/components/TranslationSeeder';
import AdminLayout from '@/components/admin/AdminLayout';
import { useI18n } from '@/i18n';

type MenuTab = 'dashboard' | 'users' | 'revenue' | 'payouts' | 'invitations' | 'reports' | 'popular-content';
type ReportsSubTab = 'development' | 'support';

const AdminDashboard = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  
  // Read tab from URL parameter
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') as MenuTab | null;
  const [activeTab, setActiveTab] = useState<MenuTab>(tabParam || 'dashboard');
  
  const [reportsSubTab, setReportsSubTab] = useState<ReportsSubTab>('development');
  const [userName, setUserName] = useState('Admin');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Real stats from database
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState('0');
  const [totalPayouts, setTotalPayouts] = useState('0');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{ 
    id: string; 
    reporterId: string;
    report: any;
  } | null>(null);
  const [actionType, setActionType] = useState<'reviewing' | 'resolved' | 'dismissed'>('reviewing');

  // Update activeTab when URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as MenuTab | null;
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('dashboard');
    }
  }, [location.search]);

  // Initial load
  useEffect(() => {
    checkAuth();
  }, []);

  // Memoized fetchData to prevent recreation on every render
  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('admin.session_expired'));
        setIsRefreshing(false);
        return;
      }
      
      // Use admin edge function with service role to bypass RLS
      const { data: adminData, error: adminError } = await supabase.functions.invoke('admin-all-data', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (adminError) {
        console.error('[Admin] Admin data fetch error:', adminError);
        toast.error(t('admin.error_loading_data'));
        setIsRefreshing(false);
        return;
      }



      // Process users with roles
      if (adminData?.users) {
        const roleMap = new Map((adminData.roles || []).map((r: any) => [r.user_id, r.role]));
        const merged = adminData.users.map((u: any) => ({ ...u, role: roleMap.get(u.id) || 'user' }));
        setAllUsers(merged);
        setTotalUsers(adminData.users.length);
      }

      // Process reports
      if (adminData?.reports) {
        setReports(adminData.reports);
      }

      // Process invitations
      if (adminData?.invitations) {
        setInvitations(adminData.invitations);
      }

      // Calculate total revenue from purchases + booster purchases
      let revenueSum = 0;
      
      // Add regular Stripe purchases (amount_usd field)
      if (adminData?.purchases) {
        revenueSum += adminData.purchases.reduce((sum: number, p: any) => {
          return sum + (p.amount_usd || 0);
        }, 0);
      }

      // Add booster IAP purchases (usd_cents_spent field, converted from cents to dollars)
      if (adminData?.boosterPurchases) {
        revenueSum += adminData.boosterPurchases.reduce((sum: number, p: any) => {
          return sum + ((p.usd_cents_spent || 0) / 100);
        }, 0);
      }

      setTotalRevenue(revenueSum.toFixed(2));

      setIsRefreshing(false);
    } catch (error) {
      console.error('[Admin] Fatal fetch error:', error);
      toast.error(t('admin.error_loading_data'));
      setIsRefreshing(false);
    }
  }, []);

  // REALTIME: Instant background data updates (0 seconds delay)
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invitations'
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reports'
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships'
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_results'
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'booster_purchases'
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Memoized filterUsers function
  const filterUsers = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allUsers.filter(user => 
      user.id.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.role && user.role.toLowerCase().includes(query)) ||
      user.lives.toString().includes(query) ||
      user.coins.toString().includes(query) ||
      user.total_correct_answers.toString().includes(query) ||
      new Date(user.created_at).toLocaleDateString('hu-HU').includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, allUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin/login');
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        toast.error(t('admin.error_no_admin_permission'));
        navigate('/');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.username);
      }

      // Fetch initial data
      await fetchData();

      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-white/70 text-lg">Betöltés...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 lg:space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-left hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-white/70 text-xs lg:text-sm">Összes felhasználó</h3>
              <Users className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400 bg-purple-500/20 p-1.5 lg:p-2 rounded-lg" />
            </div>
            <p className="text-xl lg:text-3xl font-bold text-white">{totalUsers.toLocaleString()}</p>
          </button>

          <button
            onClick={() => setActiveTab('revenue')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-left hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-white/70 text-xs lg:text-sm">Teljes Bevétel (USD)</h3>
              <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-blue-400 bg-blue-500/20 p-1.5 lg:p-2 rounded-lg" />
            </div>
            <p className="text-xl lg:text-3xl font-bold text-white">${totalRevenue}</p>
            <p className="text-white/50 text-xs mt-1">Stripe + Booster vásárlásokból</p>
          </button>

        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 lg:space-y-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-3 lg:mb-6">Üdvözöllek az Admin Felületen!</h2>
              <p className="text-white/70 text-sm lg:text-base mb-3 lg:mb-4">
                Itt kezelheted a platform működését, megtekintheted a statisztikákat és a felhasználókat.
              </p>
              <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                <p className="text-blue-300 text-xs lg:text-sm">
                  💡 <strong>Tipp:</strong> Használd a <span className="lg:hidden">felső</span><span className="hidden lg:inline">bal oldali</span> menüt a különböző funkciók eléréséhez.
                </p>
              </div>
            </div>

            <UserGrowthChart />

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold text-white mb-3 lg:mb-4">Gyors elérési útvonalak</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="backdrop-blur-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg p-3 lg:p-4 text-left transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm lg:text-base">Felhasználók</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Összes felhasználó megtekintése</p>
                </button>
                <button
                  onClick={() => setActiveTab('revenue')}
                  className="backdrop-blur-xl bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg p-3 lg:p-4 text-left transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
                >
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm lg:text-base">Bevételek</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Vásárlások és bevételi adatok</p>
                </button>
              </div>
            </div>

            {/* Analytics Dashboards */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4 lg:mb-6">
                <Activity className="w-8 h-8 text-purple-400" />
                <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Fejlett Analitika
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <button
                  onClick={() => navigate('/admin/retention')}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
                >
                  <Target className="w-8 h-8 lg:w-10 lg:h-10 text-purple-400 mb-3 lg:mb-4" />
                  <h4 className="text-white font-bold text-lg lg:text-xl mb-2">Retenciós Dashboard</h4>
                  <p className="text-white/60 text-xs lg:text-sm">DAU/WAU/MAU, kohorsz analízis, lemorzsolódás</p>
                </button>

                <button
                  onClick={() => navigate('/admin/monetization')}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-green-500/20"
                >
                  <DollarSign className="w-8 h-8 lg:w-10 lg:h-10 text-green-400 mb-3 lg:mb-4" />
                  <h4 className="text-white font-bold text-lg lg:text-xl mb-2">Monetizációs Dashboard</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Bevétel, ARPU, konverzió, LTV analízis</p>
                </button>

                <button
                  onClick={() => navigate('/admin/performance')}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
                >
                  <Zap className="w-8 h-8 lg:w-10 lg:h-10 text-purple-400 mb-3 lg:mb-4" />
                  <h4 className="text-white font-bold text-lg lg:text-xl mb-2">Teljesítmény Dashboard</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Betöltési idők, TTFB, LCP, hibák</p>
                </button>

                <button
                  onClick={() => navigate('/admin/engagement')}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
                >
                  <Activity className="w-8 h-8 lg:w-10 lg:h-10 text-purple-400 mb-3 lg:mb-4" />
                  <h4 className="text-white font-bold text-lg lg:text-xl mb-2">Engagement Dashboard</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Session-ök, felhasználói aktivitás, játék engagement</p>
                </button>

                <button
                  onClick={() => navigate('/admin/user-journey')}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-left transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
                >
                  <MapIcon className="w-8 h-8 lg:w-10 lg:h-10 text-purple-400 mb-3 lg:mb-4" />
                  <h4 className="text-white font-bold text-lg lg:text-xl mb-2">User Journey</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Onboarding, vásárlási és játék tölcsérek</p>
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'users' && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white">Összes felhasználó ({filteredUsers.length})</h2>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  type="text"
                  placeholder="Keresés (ID, név, email, szerepkör, életek, érmék...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">ID</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Felhasználónév</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Email</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Szerepkör</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Életek</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Érmék</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Helyes válaszok</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Regisztráció</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs font-mono">{user.id.slice(0, 8)}...</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">{user.username}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">{user.email}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">{(user as any).role}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">{user.lives}/{user.max_lives}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">{user.coins}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">{user.total_correct_answers}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">
                        {new Date(user.created_at).toLocaleDateString('hu-HU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Teljes árbevétel</h2>
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Ország</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Felhasználók száma</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Átlagos költés</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Zászló</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">Magyarország</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">9.783</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">8$</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">🇭🇺</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">Anglia</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">2.981</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">7.49$</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">🇬🇧</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">Ausztria</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">2.432</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">7.24$</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">🇦🇹</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Nyeremény kifizetések</h2>
...
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <div className="flex items-start justify-between gap-3 mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white">
                Meghívások ({invitations.length})
              </h2>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-white/50 text-xs whitespace-nowrap">
                  {isRefreshing ? '🔄 Frissítés...' : '✓ Automatikus szinkronizálás aktív (5mp)'}
                </span>
                <Button
                  onClick={async () => {
                    try {
                      toast.info(t('admin.friendships_sync_starting'));
                      
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        toast.error(t('admin.session_expired'));
                        return;
                      }
                      
                      const { data, error } = await supabase.functions.invoke('backfill-friendships', {
                        headers: { Authorization: `Bearer ${session.access_token}` }
                      });
                      if (error) throw error;
                      toast.success(t('admin.success_friendships_created').replace('{count}', String(data.successful)));
                      await fetchData();
                    } catch (err: any) {
                      toast.error(t('admin.error_unknown').replace('{message}', err.message || t('admin.unknown_error')));
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm whitespace-nowrap"
                >
                  🔄 Barátságok manuális szinkronizálása
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-purple-500/30">
                  <tr>
                    <th className="text-left py-3 lg:py-4 px-2 lg:px-4 text-white/70 text-xs lg:text-sm font-semibold">Meghívó</th>
                    <th className="text-left py-3 lg:py-4 px-2 lg:px-4 text-white/70 text-xs lg:text-sm font-semibold">Meghívott</th>
                    <th className="text-left py-3 lg:py-4 px-2 lg:px-4 text-white/70 text-xs lg:text-sm font-semibold">Kód</th>
                    <th className="text-left py-3 lg:py-4 px-2 lg:px-4 text-white/70 text-xs lg:text-sm font-semibold">Státusz</th>
                    <th className="text-left py-3 lg:py-4 px-2 lg:px-4 text-white/70 text-xs lg:text-sm font-semibold">Létrehozva</th>
                    <th className="text-left py-3 lg:py-4 px-2 lg:px-4 text-white/70 text-xs lg:text-sm font-semibold">Aktiválva</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation: any) => (
                    <tr key={invitation.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">
                        {invitation.inviter?.username || 'N/A'} 
                        <span className="text-white/50 ml-1">({invitation.inviter?.email || 'N/A'})</span>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">
                        {invitation.invited?.username || 'Még nem regisztrált'} 
                        <span className="text-white/50 ml-1">
                          ({invitation.invited?.email || invitation.invited_email || 'N/A'})
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4">
                        <span className="inline-block px-2 py-1 bg-purple-600/30 text-purple-300 rounded-lg text-xs font-mono">
                          {invitation.invitation_code}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4">
                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                          invitation.accepted 
                            ? 'bg-green-600/30 text-green-300' 
                            : 'bg-yellow-600/30 text-yellow-300'
                        }`}>
                          {invitation.accepted ? '✓ Elfogadva' : '⏳ Függőben'}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white/70 text-xs lg:text-sm">
                        {new Date(invitation.created_at).toLocaleDateString('hu-HU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white/70 text-xs lg:text-sm">
                        {invitation.accepted_at 
                          ? new Date(invitation.accepted_at).toLocaleDateString('hu-HU', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {invitations.length === 0 && (
                <div className="text-center py-8 text-white/50">
                  Nincs meghívás
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <div className="flex items-start justify-between gap-3 mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white">
                Jelentések ({reports.length})
              </h2>
              <span className="text-white/50 text-xs whitespace-nowrap flex-shrink-0">
                {isRefreshing ? '🔄 Frissítés...' : '✓ Automatikus szinkronizálás aktív (5mp)'}
              </span>
            </div>
            
            {/* Sub-tabs for Development and Support */}
            <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
              <button
                onClick={() => setReportsSubTab('development')}
                className={`px-4 py-2 rounded-t-lg transition-colors font-semibold ${
                  reportsSubTab === 'development'
                    ? 'bg-orange-600/30 text-orange-400 border-b-2 border-orange-400'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                🐛 Development ({reports.filter(r => r.report_type === 'bug' && (r.status === 'pending' || r.status === 'reviewing')).length})
              </button>
              <button
                onClick={() => setReportsSubTab('support')}
                className={`px-4 py-2 rounded-t-lg transition-colors font-semibold ${
                  reportsSubTab === 'support'
                    ? 'bg-red-600/30 text-red-400 border-b-2 border-red-400'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                ⚠️ Support ({reports.filter(r => r.report_type === 'user_behavior' && (r.status === 'pending' || r.status === 'reviewing')).length})
              </button>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
              {reports.filter(r => 
                reportsSubTab === 'development' ? r.report_type === 'bug' : r.report_type === 'user_behavior'
              ).map((report) => (
                <div
                  key={report.id}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        report.report_type === 'bug'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {report.report_type === 'bug' ? '🐛 Fejlesztői' : '⚠️ Felhasználói'}
                      </span>
                      <span className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        report.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : report.status === 'reviewing'
                          ? 'bg-blue-500/20 text-blue-400'
                          : report.status === 'resolved'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {report.status === 'pending' 
                          ? '⏳ Függőben' 
                          : report.status === 'reviewing'
                          ? '📋 Folyamatban'
                          : report.status === 'resolved' 
                          ? '✅ Megoldva' 
                          : '❌ Elutasítva'}
                      </span>
                    </div>
                    <span className="text-xs text-white/50">
                      {new Date(report.created_at).toLocaleDateString('hu-HU')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-white/70">
                      <strong className="text-white">Bejelentő:</strong>{' '}
                      {report.reporter?.username || 'Ismeretlen'} ({report.reporter?.email})
                    </p>

                    {report.report_type === 'bug' ? (
                      <>
                        <p className="text-sm text-white/70">
                          <strong className="text-white">Kategória:</strong> {report.bug_category}
                        </p>
                        <p className="text-sm text-white/70">
                          <strong className="text-white">Leírás:</strong> {report.bug_description}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-white/70">
                          <strong className="text-white">Jelentett felhasználó:</strong>{' '}
                          {report.reported_user?.username || 'Ismeretlen'}
                        </p>
                        <p className="text-sm text-white/70">
                          <strong className="text-white">Visszaélés típusa:</strong> {report.violation_type}
                        </p>
                        <p className="text-sm text-white/70">
                          <strong className="text-white">Részletek:</strong> {report.violation_description}
                        </p>
                      </>
                    )}

                    {/* Screenshots Section */}
                    {report.screenshot_urls && report.screenshot_urls.length > 0 && (
                      <div className="mt-3">
                        <strong className="text-white text-sm block mb-2">Csatolt képek ({report.screenshot_urls.length}):</strong>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {report.screenshot_urls.map((url: string, idx: number) => (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group relative block overflow-hidden rounded-lg border-2 border-purple-500/30 hover:border-yellow-500 transition-all"
                            >
                              <img 
                                src={url} 
                                alt={`Képernyőkép ${idx + 1}`}
                                className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  console.error('Image load error:', url);
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" fill="%23999"%3EHiba%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/70 px-2 py-1 rounded">
                                  Megnyitás
                                </span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.admin_notes && (
                      <p className="text-sm text-purple-300 mt-2">
                        <strong>Admin megjegyzés:</strong> {report.admin_notes}
                      </p>
                    )}
                  </div>

                  {(report.status === 'pending' || report.status === 'reviewing') && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => {
                          setSelectedReport({ id: report.id, reporterId: report.reporter_id, report });
                          setActionType('reviewing');
                          setActionDialogOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        📋 Folyamatban
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport({ id: report.id, reporterId: report.reporter_id, report });
                          setActionType('resolved');
                          setActionDialogOpen(true);
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        ✅ Megoldva
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport({ id: report.id, reporterId: report.reporter_id, report });
                          setActionType('dismissed');
                          setActionDialogOpen(true);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        ❌ Elutasítás
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {reports.filter(r => 
                reportsSubTab === 'development' ? r.report_type === 'bug' : r.report_type === 'user_behavior'
              ).length === 0 && (
                <div className="text-center py-8 text-white/50">
                  Nincs {reportsSubTab === 'development' ? 'fejlesztői' : 'felhasználói'} jelentés
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* Action Dialog */}
      {selectedReport && (
        <AdminReportActionDialog
          open={actionDialogOpen}
          onOpenChange={setActionDialogOpen}
          report={selectedReport.report}
          actionType={actionType}
          onSuccess={() => {
            fetchData();
            setSelectedReport(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
