import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';

const BottomNav = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Dynamically sync --bottom-nav-h with actual nav height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const setVar = () => {
      const h = el.offsetHeight;
      document.documentElement.style.setProperty('--bottom-nav-h', `${h}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener('resize', setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setVar);
    };
  }, []);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
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

  const handleNavigation = (path: string) => {
    // Check if user is authenticated when on landing page
    if (location.pathname === '/' && !isAuthenticated) {
      toast.error('Nem vagy bejelentkezve! Kérlek jelentkezz be!');
      navigate('/login');
      return;
    }
    
    // AudioManager handles music policy automatically via route changes
    navigate(path);
  };

  const navItems = [
    { 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Dashboard', 
      path: '/dashboard' 
    },
    { 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Profil', 
      path: '/profile' 
    },
    { 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 21H21M3 10H21M5 6L12 3L19 6M4 10V21M20 10V21M8 14V17M12 14V17M16 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Rólunk', 
      path: '/about' 
    },
    { 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: 'Kilépés', 
      action: handleLogout 
    }
  ];

  // Don't render on desktop/laptop
  if (isDesktop) {
    return null;
  }

  return (
    <div ref={containerRef} className="fixed bottom-0 left-0 right-0 border-t-2 border-yellow-500/50 z-[9999] shadow-[0_-5px_20px_rgba(255,215,0,0.3)]" style={{ backgroundColor: '#000000' }}>
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-60"></div>
      <div className="grid grid-cols-5 gap-1 p-2 max-w-screen-sm mx-auto">
        {navItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={index}
              onClick={() => item.action ? item.action() : handleNavigation(item.path!)}
              className={`
                flex flex-col items-center justify-center py-2 sm:py-3 px-1 sm:px-2 rounded-lg
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
              <div className={`mb-0.5 sm:mb-1 relative z-10 ${isActive ? 'drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]' : ''}`}>
                <IconComponent />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold relative z-10 leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
