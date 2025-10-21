import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, TrendingUp, LogOut, Home, Wallet, Award, Search, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { Input } from '@/components/ui/input';

type MenuTab = 'dashboard' | 'users' | 'revenue' | 'payouts' | 'purchases';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MenuTab>('dashboard');
  const [userName, setUserName] = useState('Admin');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [purchases, setPurchases] = useState<any[]>([]);
  
  // Real stats from database
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState('0');
  const [totalPayouts, setTotalPayouts] = useState('0');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, allUsers]);

  const filterUsers = () => {
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
  };

  useEffect(() => {
    checkAuth();
  }, []);

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
        toast.error('Nincs admin jogosultságod');
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

      // Fetch all users and their roles
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, email, lives, max_lives, coins, total_correct_answers, created_at')
        .order('created_at', { ascending: false });

      if (!usersError && users) {
        const ids = users.map(u => u.id);
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', ids);
        const roleMap = new Map((rolesData || []).map(r => [r.user_id, r.role]));
        const merged = users.map(u => ({ ...u, role: roleMap.get(u.id) || 'user' }));
        setAllUsers(merged);
        setFilteredUsers(merged);
        setTotalUsers(users.length);
      }

      // Fetch all purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*, profiles!inner(username, email)')
        .order('created_at', { ascending: false });

      if (!purchasesError && purchasesData) {
        setPurchases(purchasesData);
        
        // Calculate real revenue
        const revenue = purchasesData
          .filter(p => p.status === 'completed' && p.amount_usd)
          .reduce((sum, p) => sum + Number(p.amount_usd), 0);
        setTotalRevenue(revenue.toFixed(2));
      }

      // Calculate payouts (demo for now)
      setTotalPayouts('0');

      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/admin/login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Kijelentkezve');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex items-center justify-center">
        <p className="text-white text-lg">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex flex-col lg:flex-row">
      {/* Sidebar - Mobile Hidden, Tablet+ Shown */}
      <div className="hidden lg:flex lg:w-64 bg-[#0a0a1e] border-r border-purple-500/30 p-4 xl:p-6 flex-col">
        <div className="mb-6 xl:mb-8">
          <img src={logo} alt="Logo" className="w-12 h-12 xl:w-16 xl:h-16 mb-2" />
          <h2 className="text-white font-bold text-xs xl:text-sm">Szia, {userName}! ✨</h2>
        </div>

        <div className="mb-6 xl:mb-8">
          <h3 className="text-white/60 text-xs font-bold mb-3 xl:mb-4 uppercase">Főmenü</h3>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg transition-colors text-sm ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4 xl:w-5 xl:h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg transition-colors text-sm ${
                activeTab === 'users'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 xl:w-5 xl:h-5" />
              <span className="font-medium">Összes felhasználó</span>
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg transition-colors text-sm ${
                activeTab === 'purchases'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <ShoppingCart className="w-4 h-4 xl:w-5 xl:h-5" />
              <span className="font-medium">Vásárlások</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto">
          <h3 className="text-white/60 text-xs font-bold mb-3 xl:mb-4 uppercase">Admin fiók szerkesztése</h3>
          <button className="w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors mb-2 text-sm">
            <Users className="w-4 h-4 xl:w-5 xl:h-5" />
            <span className="font-medium">Profil szerkesztése</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 xl:w-5 xl:h-5" />
            <span className="font-medium">Kijelentkezés</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-[#0a0a1e] border-b border-purple-500/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10" />
            <h2 className="text-white font-bold text-sm">Szia, {userName}! ✨</h2>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg text-white/70 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-white/70'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-white/70'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">Felhasználók</span>
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === 'purchases'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-white/70'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-xs font-medium">Vásárlások</span>
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === 'revenue'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-white/70'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-medium">Árbevétel</span>
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === 'payouts'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-white/70'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-xs font-medium">Kifizetések</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className="bg-[#1a1a3e]/50 border border-blue-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-left hover:bg-[#1a1a3e]/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-white/70 text-xs lg:text-sm">Összes felhasználó</h3>
              <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-500 bg-blue-500/20 p-1.5 lg:p-2 rounded-lg" />
            </div>
            <p className="text-xl lg:text-3xl font-bold text-white">{totalUsers.toLocaleString()}</p>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className="bg-[#1a1a3e]/50 border border-blue-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-left hover:bg-[#1a1a3e]/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-white/70 text-xs lg:text-sm">Teljes Bevétel (USD)</h3>
              <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-blue-500 bg-blue-500/20 p-1.5 lg:p-2 rounded-lg" />
            </div>
            <p className="text-xl lg:text-3xl font-bold text-white">${totalRevenue}</p>
            <p className="text-white/50 text-xs mt-1">Stripe fizetésekből</p>
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 lg:space-y-6">
            <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-3 lg:mb-6">Üdvözöllek az Admin Felületen!</h2>
              <p className="text-white/70 text-sm lg:text-base mb-3 lg:mb-4">
                Itt kezelheted a platform működését, megtekintheted a statisztikákat és a felhasználókat.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 lg:p-4 mt-3 lg:mt-4">
                <p className="text-blue-300 text-xs lg:text-sm">
                  💡 <strong>Tipp:</strong> Használd a <span className="lg:hidden">felső</span><span className="hidden lg:inline">bal oldali</span> menüt a különböző funkciók eléréséhez.
                </p>
              </div>
            </div>

            <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-bold text-white mb-3 lg:mb-4">Gyors elérési útvonalak</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg p-3 lg:p-4 text-left transition-colors"
                >
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm lg:text-base">Felhasználók</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Összes felhasználó megtekintése</p>
                </button>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg p-3 lg:p-4 text-left transition-colors"
                >
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm lg:text-base">Bevételek</h4>
                  <p className="text-white/60 text-xs lg:text-sm">Vásárlások és bevételi adatok</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white">Összes felhasználó ({filteredUsers.length})</h2>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  type="text"
                  placeholder="Keresés (ID, név, email, szerepkör, életek, érmék...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/30 border-white/10 text-white placeholder:text-white/50"
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

        {activeTab === 'purchases' && (
          <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Összes vásárlás ({purchases.length})</h2>
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Dátum</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Felhasználó</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Termék</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Összeg</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Fizetési mód</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Ország</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Státusz</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Tranzakció ID</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">
                        {new Date(purchase.created_at).toLocaleString('hu-HU')}
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">
                        {purchase.profiles?.username || 'N/A'}
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">{purchase.product_type}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">
                        {purchase.payment_method === 'stripe' 
                          ? `$${purchase.amount_usd}` 
                          : `${purchase.amount_coins} coins`}
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm capitalize">{purchase.payment_method}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">{purchase.country || 'N/A'}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4">
                        <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${
                          purchase.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          purchase.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          purchase.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs font-mono">
                        {purchase.stripe_payment_intent_id?.slice(0, 20) || 'N/A'}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-xl lg:rounded-2xl p-4 lg:p-6">
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
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Neve</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Megnyert nyeremény</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Dátum</th>
                    <th className="text-left text-white/70 font-medium py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm">Státusz</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">Antal István László</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">100$</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">2025.03.12</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4">
                      <span className="bg-green-500/20 text-green-400 px-2 lg:px-3 py-1 rounded-full text-xs font-medium">
                        Kifizetne
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">Vadász Attila</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">100$</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">2025.03.04</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4">
                      <span className="bg-red-500/20 text-red-400 px-2 lg:px-3 py-1 rounded-full text-xs font-medium">
                        teljesítetlen
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">Kérdődző Erika</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">100$</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4 text-white text-xs lg:text-sm">2025.02.21</td>
                    <td className="py-3 lg:py-4 px-2 lg:px-4">
                      <span className="bg-green-500/20 text-green-400 px-2 lg:px-3 py-1 rounded-full text-xs font-medium">
                        Kifizetne
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
