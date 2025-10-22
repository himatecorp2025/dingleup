import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, ShoppingBag, LogOut, Building2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

const BottomNav = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
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

  // Stop background music when navigating
  const stopBackgroundMusic = () => {
    try {
      const w = window as any;
      const audio: HTMLAudioElement | undefined = w.__bgm;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } catch (err) {
      console.error('Error stopping music:', err);
    }
  };

  const handleNavigation = (path: string) => {
    stopBackgroundMusic();
    navigate(path);
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Profil', path: '/profile' },
    { icon: ShoppingBag, label: 'Bolt', path: '/shop' },
    { icon: Building2, label: 'Rólunk', path: '/about' },
    { icon: LogOut, label: 'Kilépés', action: () => {
      stopBackgroundMusic();
      handleLogout();
    }}
  ];

  // Don't render on desktop/laptop
  if (isDesktop) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/90 border-t-2 border-yellow-500/50 backdrop-blur-sm z-50 shadow-[0_-5px_20px_rgba(255,215,0,0.3)]">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-60"></div>
      <div className="grid grid-cols-6 gap-1 p-2 max-w-screen-sm mx-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={index}
              onClick={() => item.action ? item.action() : handleNavigation(item.path!)}
              className={`
                flex flex-col items-center justify-center py-3 px-2 rounded-lg
                transition-all duration-200 relative overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-t from-yellow-600/40 to-yellow-500/30 text-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.4)]' 
                  : 'text-white/70 hover:text-yellow-300 hover:bg-yellow-500/10'}
              `}
              style={{ transform: 'scaleX(1.25)' }}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-600/20 to-transparent animate-pulse"></div>
              )}
              <Icon className={`w-5 h-5 mb-1 relative z-10 ${isActive ? 'drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]' : ''}`} />
              <span className="text-[10px] font-bold relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
