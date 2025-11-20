import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
  const { t } = useTranslation();
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
      toast.error(t('errors.serverError'));
    } else {
      toast.success(t('auth.logout'));
      navigate('/login');
    }
  };

  const handleNavigation = (path: string) => {
    // Check if user is authenticated when on landing page
    if (location.pathname === '/' && !isAuthenticated) {
      toast.error(t('bottomNav.notLoggedIn'));
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
      label: t('bottomNav.dashboard'), 
      path: '/dashboard' 
    },
    { 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M18 16C19.6569 16 21 17.3431 21 19C21 20.6569 19.6569 22 18 22C16.3431 22 15 20.6569 15 19C15 17.3431 16.3431 16 18 16Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M8.7 13.7L15.3 17.3M15.3 6.7L8.7 10.3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      label: t('bottomNav.share'), 
      path: '/invitation' 
    },
    { 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9H4.5C3.67157 9 3 8.32843 3 7.5V5C3 4.44772 3.44772 4 4 4H6" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M18 9H19.5C20.3284 9 21 8.32843 21 7.5V5C21 4.44772 20.5523 4 20 4H18" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M8 4H16V10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10V4Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 14V17M8 20H16M10 17H14V20H10V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      label: t('bottomNav.leaderboard'), 
      path: '/leaderboard' 
    },
    { 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: t('bottomNav.profile'), 
      path: '/profile' 
    },
    { 
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 21H21M3 10H21M5 6L12 3L19 6M4 10V21M20 10V21M8 14V17M12 14V17M16 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: t('bottomNav.about'), 
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
      label: t('bottomNav.logout'), 
      action: handleLogout 
    }
  ];

  // Don't render on desktop/laptop
  if (isDesktop) {
    return null;
  }

  return (
    <div ref={containerRef} className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0a1f] border-t border-white/10 z-[9999]">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-60"></div>
      <div className="flex justify-around items-center gap-2 p-2 max-w-screen-sm mx-auto">
        {navItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={index}
              onClick={() => item.action ? item.action() : handleNavigation(item.path!)}
              className={`
                flex flex-col items-center justify-center py-3 px-3 rounded-lg min-h-[56px]
                transition-all duration-200 relative overflow-hidden flex-1
                ${isActive 
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-white shadow-lg shadow-purple-500/20' 
                  : 'text-white/60 hover:bg-white/5'}
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent animate-pulse"></div>
              )}
              <div className={`mb-1 relative z-10 text-purple-400`}>
                <IconComponent />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium relative z-10 leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
