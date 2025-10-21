import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, TrendingUp, LogOut, Home, Wallet, Award } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

type MenuTab = 'dashboard' | 'users' | 'revenue' | 'payouts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MenuTab>('dashboard');
  const [userName, setUserName] = useState('Admin');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Demo data
  const [totalUsers, setTotalUsers] = useState(18980);
  const [totalRevenue, setTotalRevenue] = useState('78.982');
  const [totalPayouts, setTotalPayouts] = useState('1.290');

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
        setTotalUsers(users.length);
      }

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0a0a1e] border-r border-purple-500/30 p-6 flex flex-col">
        <div className="mb-8">
          <img src={logo} alt="Logo" className="w-16 h-16 mb-2" />
          <h2 className="text-white font-bold text-sm">Szia, {userName}! ✨</h2>
        </div>

        <div className="mb-8">
          <h3 className="text-white/60 text-xs font-bold mb-4 uppercase">Főmenü</h3>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Összes felhasználó</span>
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'revenue'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="font-medium">Teljes árbevétel</span>
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'payouts'
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="font-medium">Teljes nyeremény kifizetés</span>
            </button>
          </nav>
        </div>

        <div className="mt-auto">
          <h3 className="text-white/60 text-xs font-bold mb-4 uppercase">Admin fiók szerkesztése</h3>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium">Profil szerkesztése</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Kijelentkezés</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Top Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a3e]/50 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Összes felhasználó</h3>
              <Users className="w-8 h-8 text-blue-500 bg-blue-500/20 p-2 rounded-lg" />
            </div>
            <p className="text-3xl font-bold text-white">{totalUsers.toLocaleString()}</p>
          </div>

          <div className="bg-[#1a1a3e]/50 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Teljes árbevétel</h3>
              <Wallet className="w-8 h-8 text-blue-500 bg-blue-500/20 p-2 rounded-lg" />
            </div>
            <p className="text-3xl font-bold text-white">{totalRevenue}$</p>
          </div>

          <div className="bg-[#1a1a3e]/50 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/70 text-sm">Teljes nyeremény kifizetés</h3>
              <Award className="w-8 h-8 text-blue-500 bg-blue-500/20 p-2 rounded-lg" />
            </div>
            <p className="text-3xl font-bold text-white">{totalPayouts}$</p>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Üdvözöllek az Admin Felületen!</h2>
              <p className="text-white/70 mb-4">
                Itt kezelheted a platform működését, megtekintheted a statisztikákat és a felhasználókat.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                <p className="text-blue-300 text-sm">
                  💡 <strong>Tipp:</strong> Használd a bal oldali menüt a különböző funkciók eléréséhez.
                </p>
              </div>
            </div>

            <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Gyors elérési útvonalak</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg p-4 text-left transition-colors"
                >
                  <Users className="w-6 h-6 text-blue-400 mb-2" />
                  <h4 className="text-white font-semibold">Felhasználók</h4>
                  <p className="text-white/60 text-sm">Összes felhasználó megtekintése</p>
                </button>
                <button
                  onClick={() => setActiveTab('revenue')}
                  className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg p-4 text-left transition-colors"
                >
                  <DollarSign className="w-6 h-6 text-green-400 mb-2" />
                  <h4 className="text-white font-semibold">Árbevétel</h4>
                  <p className="text-white/60 text-sm">Bevételi adatok megtekintése</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Összes felhasználó ({allUsers.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/70 font-medium py-3 px-4">ID</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Felhasználónév</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Email</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Szerepkör</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Életek</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Érmék</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Helyes válaszok</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Regisztráció</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 text-white text-xs font-mono">{user.id.slice(0, 8)}...</td>
                      <td className="py-4 px-4 text-white">{user.username}</td>
                      <td className="py-4 px-4 text-white">{user.email}</td>
                      <td className="py-4 px-4 text-white">{(user as any).role}</td>
                      <td className="py-4 px-4 text-white">{user.lives}/{user.max_lives}</td>
                      <td className="py-4 px-4 text-white">{user.coins}</td>
                      <td className="py-4 px-4 text-white">{user.total_correct_answers}</td>
                      <td className="py-4 px-4 text-white">
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
          <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Teljes árbevétel</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/70 font-medium py-3 px-4">Ország</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Felhasználók száma</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Átlagos költés</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Zászló</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 text-white">Magyarország</td>
                    <td className="py-4 px-4 text-white">9.783</td>
                    <td className="py-4 px-4 text-white">8$</td>
                    <td className="py-4 px-4 text-white">🇭🇺</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 text-white">Anglia</td>
                    <td className="py-4 px-4 text-white">2.981</td>
                    <td className="py-4 px-4 text-white">7.49$</td>
                    <td className="py-4 px-4 text-white">🇬🇧</td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 text-white">Ausztria</td>
                    <td className="py-4 px-4 text-white">2.432</td>
                    <td className="py-4 px-4 text-white">7.24$</td>
                    <td className="py-4 px-4 text-white">🇦🇹</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-[#1a1a3e]/50 border border-purple-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Nyeremény kifizetések</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/70 font-medium py-3 px-4">Neve</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Megnyert nyeremény</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Dátum</th>
                    <th className="text-left text-white/70 font-medium py-3 px-4">Státusz</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 text-white">Antal István László</td>
                    <td className="py-4 px-4 text-white">100$</td>
                    <td className="py-4 px-4 text-white">2025.03.12</td>
                    <td className="py-4 px-4">
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                        Kifizetne
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 text-white">Vadász Attila</td>
                    <td className="py-4 px-4 text-white">100$</td>
                    <td className="py-4 px-4 text-white">2025.03.04</td>
                    <td className="py-4 px-4">
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                        teljesítetlen
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 text-white">Kérdődző Erika</td>
                    <td className="py-4 px-4 text-white">100$</td>
                    <td className="py-4 px-4 text-white">2025.02.21</td>
                    <td className="py-4 px-4">
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
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
