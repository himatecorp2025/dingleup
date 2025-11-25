import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Brain, 
  Heart,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  Activity,
  Target,
  Zap,
  ShoppingBag,
  Gamepad2,
  Calendar,
  Languages,
  BarChart3,
  Database,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isHandheld } = usePlatformDetection();
  const [sidebarOpen, setSidebarOpen] = useState(!isHandheld);

  useEffect(() => {
    checkAuth();
  }, []);

  // Mobilon minden navigáláskor zárjuk be a sidebárt
  useEffect(() => {
    if (isHandheld) {
      setSidebarOpen(false);
    }
  }, [location.pathname, location.search, isHandheld]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/admin/login');
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

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/dashboard?tab=users', label: 'Összes felhasználó', icon: Users },
    { path: '/admin/game-profiles', label: 'Játékos Profilozás', icon: Brain },
    { path: '/admin/ad-interests', label: 'Reklámprofilok (Előkészítés)', icon: Target },
    { path: '/admin/dashboard?tab=invitations', label: 'Meghívások', icon: Users, badge: 'invitations' },
    { path: '/admin/dashboard?tab=reports', label: 'Jelentések', icon: AlertTriangle, badge: 'reports' },
    { path: '/admin/popular-content', label: 'Népszerű tartalmak', icon: TrendingUp },
    { path: '/admin/question-pools', label: 'Question Pools (Kérdésbázis)', icon: Database },
    { path: '/admin/booster-types', label: 'Booster Csomagok', icon: Zap },
    { path: '/admin/booster-purchases', label: 'Booster Vásárlások', icon: ShoppingBag },
    { path: '/admin/translations', label: 'Fordítások (UI & Kérdések)', icon: Languages },
    { path: '/admin/load-test', label: 'Terheléses Teszt (Load Test)', icon: BarChart3 },
    { path: '/admin/advanced-analytics', label: 'Fejlett Analitika', icon: Activity },
    { path: '/admin/age-statistics', label: 'Korcsoport Statisztika', icon: Calendar },
    { path: '/admin/profile', label: 'Profil Szerkesztése', icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Telefonos/tablet módban a Rólunk oldalra irányítunk
    navigate(isHandheld ? '/about' : '/');
  };

  const isActive = (path: string) => {
    if (path.includes('?')) {
      const [basePath, query] = path.split('?');
      return location.pathname === basePath && location.search.includes(query);
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-dvh min-h-svh relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0a1f]">
      {/* Animated glowing orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
          <div className="h-full backdrop-blur-xl bg-white/5 border-r border-white/10 p-6">
            {/* Logo */}
            <div className="mb-6 xl:mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-30"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 1024 1024"
                  className="w-12 h-12 xl:w-16 xl:h-16 mb-2 relative z-10"
                >
                  <image
                    href="/logo.png"
                    x="0"
                    y="0"
                    width="1024"
                    height="1024"
                    preserveAspectRatio="xMidYMid meet"
                  />
                </svg>
              </div>
              <h2 className="text-white font-bold text-xs xl:text-sm mt-2">Admin Panel</h2>
            </div>

            <div className="mb-6 xl:mb-8">
              <h3 className="text-white/50 text-xs font-bold mb-3 xl:mb-4 uppercase tracking-wider">Főmenü</h3>
              
              {/* Menu Items */}
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg transition-all text-sm ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white shadow-lg shadow-purple-500/20'
                          : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 xl:w-5 xl:h-5 text-purple-400" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Admin fiók szerkesztése gombok */}
            <div className="space-y-2">
              {/* Vissza a játékba gomb - csak mobilon/tableten */}
              <button
                onClick={() => navigate('/dashboard')}
                className="md:hidden w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg text-white/60 hover:bg-white/5 transition-all text-sm"
              >
                <Gamepad2 className="w-4 h-4 xl:w-5 xl:h-5 text-purple-400" />
                <span className="font-medium">Vissza a játékba</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg text-white/60 hover:bg-white/5 transition-all text-sm"
              >
                <LogOut className="w-4 h-4 xl:w-5 xl:h-5 text-purple-400" />
                <span className="font-medium">Kijelentkezés</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-dvh min-h-svh overflow-auto">
          {/* Toggle Sidebar Button */}
          <div className="p-4 flex items-center gap-3">
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            {/* Vissza a játékba gomb - csak mobilon/tableten, mindig látható */}
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="md:hidden text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2"
            >
              <Gamepad2 className="h-5 w-5" />
              <span className="font-medium">Vissza a játékba</span>
            </Button>
          </div>

          {/* Page Content */}
          <div className="px-4 sm:px-6 lg:px-8 pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
