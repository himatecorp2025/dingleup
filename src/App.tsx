import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ScrollBehaviorManager } from "@/components/ScrollBehaviorManager";
import { useAudioStore } from "@/stores/audioStore";
import AudioManager from "@/lib/audioManager";
import { useAnalytics } from "@/hooks/useAnalytics";
import { lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";

// Eager load critical pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import LoginUsername from "./pages/LoginUsername";
import Register from "./pages/Register";

// Lazy load secondary pages
const Game = lazy(() => import("./pages/Game"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const RegistrationSuccess = lazy(() => import("./pages/RegistrationSuccess"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const Invitation = lazy(() => import("./pages/Invitation"));
import IntroVideo from "./pages/IntroVideo";
const About = lazy(() => import("./pages/About"));

// Lazy load admin pages
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const RetentionDashboard = lazy(() => import("./pages/RetentionDashboard"));
const PerformanceDashboard = lazy(() => import("./pages/PerformanceDashboard"));
const EngagementDashboard = lazy(() => import("./pages/EngagementDashboard"));
const UserJourneyDashboard = lazy(() => import("./pages/UserJourneyDashboard"));
const PopularContent = lazy(() => import("./pages/PopularContent"));
const AdminPopularContent = lazy(() => import("./pages/AdminPopularContent"));
const ProfileGame = lazy(() => import("./pages/ProfileGame"));
const AdminGameProfiles = lazy(() => import("./pages/AdminGameProfiles"));
const AdminGameProfileDetail = lazy(() => import("./pages/AdminGameProfileDetail"));
const AdminAdInterests = lazy(() => import("./pages/AdminAdInterests"));
const AdminBoosterTypes = lazy(() => import("./pages/AdminBoosterTypes"));
const AdminBoosterPurchases = lazy(() => import("./pages/AdminBoosterPurchases"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-dvh min-h-svh bg-black flex items-center justify-center">
    {/* Silent loading - no visible text or spinner for seamless transition */}
  </div>
);

const queryClient = new QueryClient();

// Platform korlátozás és standalone Intro-first guard
const AppRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const location = useLocation();

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobileOrTablet(width <= 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Standalone intro-first guard (no landing page in app)
  const isStandalone = (() => {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
    } catch {
      return false;
    }
  })();

  const introShown = typeof window !== 'undefined' 
    ? sessionStorage.getItem('app_intro_shown') === '1' 
    : false;

  // Mobile/tablet: skip landing page, go directly to intro or dashboard
  if (isMobileOrTablet && location.pathname === '/') {
    if (!introShown) {
      return <Navigate to="/intro" replace />;
    } else {
      // If intro was already shown, redirect to dashboard instead of staying on landing page
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Mobile/tablet standalone: redirect to /intro ONLY on first load (from root)
  // Do NOT redirect if user is navigating within the app (e.g., Dashboard -> Game)
  // Desktop (width > 1024): ALWAYS show landing page, never redirect to intro
  if (isMobileOrTablet && isStandalone && !introShown && 
      (location.pathname === '/' || location.pathname === '/desktop')) {
    return <Navigate to="/intro" replace />;
  }

  // Admin pages always accessible
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Desktop: only landing and admin pages accessible
  if (!isMobileOrTablet && location.pathname !== '/' && location.pathname !== '/desktop' && !location.pathname.startsWith('/admin')) {
    return (
      <div className="h-dvh h-svh w-screen flex items-center justify-center bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
        <div className="text-center px-6 max-w-md">
          <h1 className="text-3xl font-black text-foreground mb-4">📱 Csak mobilon és táblagépen elérhető</h1>
          <p className="text-foreground/80 mb-6">
            Ez az alkalmazás csak telefonon és táblagépen használható. 
            Kérjük, nyisd meg mobil eszközön!
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold rounded-lg hover:brightness-110 transition-all"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }


  return <>{children}</>;
};

// A3) Routes where music should be BLOCKED
const MUSIC_BLOCKED_ROUTES = [
  /^\/$/,               // Landing page
  /^\/desktop$/,        // Desktop landing page
  /^\/admin/,           // All admin routes including subpages (including admin login)
  /^\/admin-/,          // Any admin-prefixed routes
  /\/admin\//,          // Any path containing /admin/
];

function isMusicAllowed(pathname: string): boolean {
  // Block music on admin routes and landing page
  const blocked = MUSIC_BLOCKED_ROUTES.some(pattern => pattern.test(pathname));
  if (blocked) {
    return false;
  }
  return true;
}

// Audio policy manager component
const AudioPolicyManager = () => {
  const location = useLocation();
  const [isHandheld, setIsHandheld] = useState(false);

  useEffect(() => {
    const checkHandheld = () => {
      const isNarrowViewport = window.matchMedia('(max-width: 1024px)').matches;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setIsHandheld(isNarrowViewport && hasCoarsePointer);
    };
    checkHandheld();
    const viewportMedia = window.matchMedia('(max-width: 1024px)');
    const pointerMedia = window.matchMedia('(pointer: coarse)');
    const handleChange = () => checkHandheld();
    viewportMedia.addEventListener('change', handleChange);
    pointerMedia.addEventListener('change', handleChange);
    return () => {
      viewportMedia.removeEventListener('change', handleChange);
      pointerMedia.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    const applyAudioPolicy = () => {
      const { musicEnabled, volume, loaded } = useAudioStore.getState();
      if (!loaded) return;

      const audioManager = AudioManager.getInstance();
      
      // Platform detection: music ONLY on mobile/tablet, NEVER on desktop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       window.matchMedia('(max-width: 1024px)').matches;
      
      if (!isMobile) {
        // Desktop: disable music entirely
        audioManager.apply(false, 0);
        return;
      }
      
      // Check if music is allowed on current route (blocks admin & landing page)
      const musicAllowed = isMusicAllowed(location.pathname);
      
      if (!musicAllowed) {
        // Admin or landing page: disable music
        audioManager.apply(false, 0);
        return;
      }
      
      // Mobile/Tablet on allowed routes: Switch track based on route
      const isGameRoute = location.pathname === '/game';
      
      if (isGameRoute) {
        // CategorySelector + Game → game music (backmusic.mp3)
        audioManager.switchTrack('game');
      } else {
        // All other allowed pages → general music (DingleUP.mp3)
        audioManager.switchTrack('general');
      }

      // Apply volume settings
      audioManager.apply(musicEnabled, volume);
    };

    applyAudioPolicy();
    
    const unsubscribe = useAudioStore.subscribe((state) => {
      if (state.loaded) {
        applyAudioPolicy();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [location.pathname]);

  return null;
};

// Analytics wrapper component
const AppWithAnalytics = () => {
  useAnalytics();
  return null;
};

// Main App component
const App = () => {
  // Reset intro flag on logout to ensure clean cold-start flow
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        try { sessionStorage.removeItem('app_intro_shown'); } catch {}
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppWithAnalytics />
        <ScrollBehaviorManager />
        <AudioPolicyManager />
        <Suspense fallback={<PageLoader />}>
          <AppRouteGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/desktop" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login-username" element={<LoginUsername />} />
              <Route path="/registration-success" element={<RegistrationSuccess />} />
              <Route path="/install" element={<InstallApp />} />
              <Route path="/invitation" element={<Invitation />} />
              <Route path="/intro" element={<IntroVideo />} />
              <Route path="/game" element={<Game />} />
              <Route path="/about" element={<About />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              
              <Route path="/admin/analytics" element={<AdvancedAnalytics />} />
              <Route path="/admin/retention" element={<RetentionDashboard />} />
              <Route path="/admin/performance" element={<PerformanceDashboard />} />
              <Route path="/admin/engagement" element={<EngagementDashboard />} />
              <Route path="/admin/user-journey" element={<UserJourneyDashboard />} />
              <Route path="/admin/popular-content" element={<AdminPopularContent />} />
              <Route path="/admin/game-profiles" element={<AdminGameProfiles />} />
              <Route path="/admin/game-profiles/:userId" element={<AdminGameProfileDetail />} />
              <Route path="/admin/ad-interests" element={<AdminAdInterests />} />
              <Route path="/admin/booster-types" element={<AdminBoosterTypes />} />
              <Route path="/admin/booster-purchases" element={<AdminBoosterPurchases />} />
              <Route path="/popular-content" element={<PopularContent />} />
              <Route path="/profile/game" element={<ProfileGame />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppRouteGuard>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
