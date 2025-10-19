import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, ShoppingBag, LogOut, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Hiba a kijelentkezés során');
    } else {
      toast.success('Sikeresen kijelentkeztél');
      navigate('/login');
    }
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: User, label: 'Profil', path: '/profile' },
    { icon: ShoppingBag, label: 'Bolt', path: '/shop' },
    { icon: Building2, label: 'Rólunk', path: '/' },
    { icon: LogOut, label: 'Kilépés', action: handleLogout }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t-2 border-purple-500/50 backdrop-blur-sm z-50">
      <div className="grid grid-cols-5 gap-1 p-2 max-w-screen-sm mx-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={index}
              onClick={() => item.action ? item.action() : navigate(item.path!)}
              className={`
                flex flex-col items-center justify-center py-3 px-2 rounded-lg
                transition-all duration-200
                ${isActive ? 'bg-purple-600/30 text-purple-300' : 'text-white/70 hover:text-white hover:bg-white/10'}
              `}
              style={{ transform: 'scaleX(1.25)' }}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
