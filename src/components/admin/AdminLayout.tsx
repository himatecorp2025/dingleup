import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  LogOut,
  Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { useI18n } from '@/i18n';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { isHandheld } = usePlatformDetection();
  const { t, lang, setLang } = useI18n();

  useEffect(() => {
    checkAuth();
  }, []);

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


  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Telefonos/tablet módban a Rólunk oldalra irányítunk
    navigate(isHandheld ? '/about' : '/');
  };

  return (
    <SidebarProvider defaultOpen={!isHandheld}>
      <div className="min-h-dvh min-h-svh relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0a1f] flex w-full">
        {/* Animated glowing orbs background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 min-h-dvh min-h-svh overflow-auto relative z-10">
          {/* Header with controls */}
          <div className="p-[clamp(0.75rem,2vw,1rem)] flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] justify-between sticky top-0 bg-gradient-to-br from-[#1a0b2e]/95 via-[#2d1b4e]/95 to-[#0f0a1f]/95 backdrop-blur-xl border-b border-white/10 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10" />
              
              {/* Vissza a játékba gomb - csak mobilon/tableten */}
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="md:hidden text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Gamepad2 className="h-5 w-5" />
                <span className="font-medium">{t('admin.layout.back_to_game')}</span>
              </Button>

              {/* Logout button - hidden on mobile */}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="hidden md:flex text-white/70 hover:text-white hover:bg-white/10 items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">{t('admin.layout.logout')}</span>
              </Button>
            </div>

            {/* Language Switcher with Flags */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setLang('hu')}
                variant="ghost"
                size="icon"
                className={`text-2xl hover:bg-white/10 transition-all ${
                  lang === 'hu' ? 'ring-2 ring-white/30 bg-white/10' : 'opacity-60'
                }`}
                title="Magyar"
              >
                🇭🇺
              </Button>
              <Button
                onClick={() => setLang('en')}
                variant="ghost"
                size="icon"
                className={`text-2xl hover:bg-white/10 transition-all ${
                  lang === 'en' ? 'ring-2 ring-white/30 bg-white/10' : 'opacity-60'
                }`}
                title="English"
              >
                🇺🇸
              </Button>
            </div>
          </div>

          {/* Page Content */}
          <div className="px-[clamp(1rem,3vw,2rem)] pb-[clamp(1.5rem,4vw,2rem)]">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
