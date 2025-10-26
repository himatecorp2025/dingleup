import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ScrollBehaviorManager } from "@/components/ScrollBehaviorManager";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { useAudioStore } from "@/stores/audioStore";
import AudioManager from "@/lib/audioManager";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";
import { useAnalytics } from "@/hooks/useAnalytics";
import { lazy, Suspense } from "react";

// Eager load critical pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import LoginUsername from "./pages/LoginUsername";
import Register from "./pages/Register";

// Lazy load secondary pages
const Game = lazy(() => import("./pages/Game"));
const Profile = lazy(() => import("./pages/Profile"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const RegistrationSuccess = lazy(() => import("./pages/RegistrationSuccess"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const Invitation = lazy(() => import("./pages/Invitation"));
const IntroVideo = lazy(() => import("./pages/IntroVideo"));
const ChatEnhanced = lazy(() => import("./pages/ChatEnhanced"));
const About = lazy(() => import("./pages/About"));

// Lazy load admin pages
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminTipsVideos = lazy(() => import("./pages/AdminTipsVideos"));
const GeniusMembersEnhanced = lazy(() => import("./pages/GeniusMembersEnhanced"));
const NormalUsersAnalytics = lazy(() => import("./pages/NormalUsersAnalytics"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const RetentionDashboard = lazy(() => import("./pages/RetentionDashboard"));
const MonetizationDashboard = lazy(() => import("./pages/MonetizationDashboard"));
const PerformanceDashboard = lazy(() => import("./pages/PerformanceDashboard"));
const EngagementDashboard = lazy(() => import("./pages/EngagementDashboard"));
const UserJourneyDashboard = lazy(() => import("./pages/UserJourneyDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg text-white/70">Betöltés...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

// Platform korlátozás: csak landing page és admin elérhető asztali nézetben
const AppRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      // Tablet és mobil: <= 1024px szélesség
      setIsMobileOrTablet(width <= 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Landing page és admin oldalak mindig elérhetőek
  if (location.pathname === '/' || location.pathname === '/desktop' || 
      location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Minden más oldal csak mobile/tablet-en
  if (!isMobileOrTablet) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <div className="text-center px-6 max-w-md">
          <h1 className="text-3xl font-black text-white mb-4">📱 Csak mobilon és táblagépen elérhető</h1>
          <p className="text-white/80 mb-6">
            Ez az alkalmazás csak telefonon és táblagépen használható. 
            Kérjük, nyisd meg mobil eszközön!
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// A3) Route allow-list - ONLY /game route (includes category selector + gameplay)
// Topics selector IS PART OF /game, not a separate route
// Admin routes are EXPLICITLY excluded - NO MUSIC on any admin page
const MUSIC_ALLOWED_ROUTES = [/^\/game$/];
const MUSIC_BLOCKED_ROUTES = [
  /^\/admin/,           // All admin routes including subpages
  /^\/admin-/,          // Any admin-prefixed routes
  /\/admin\//,          // Any path containing /admin/
];

function isMusicAllowed(pathname: string): boolean {
  // Explicit block for admin routes - ALWAYS check first
  if (MUSIC_BLOCKED_ROUTES.some(pattern => pattern.test(pathname))) {
    console.log('[AudioPolicy] BLOCKED - Admin route detected:', pathname);
    return false;
  }
  const allowed = MUSIC_ALLOWED_ROUTES.some(pattern => pattern.test(pathname));
  console.log('[AudioPolicy] Music allowed:', allowed, 'for route:', pathname);
  return allowed;
}

// Audio policy manager component
const AudioPolicyManager = () => {
  const location = useLocation();
  const isHandheld = usePlatformDetection();

  useEffect(() => {
    const applyAudioPolicy = () => {
      const { musicEnabled, volume, loaded } = useAudioStore.getState();
      if (!loaded) return;

      // Explicit check: admin routes NEVER play music regardless of settings
      const isAdminRoute = location.pathname.startsWith('/admin');
      const allowed = !isAdminRoute && isHandheld && isMusicAllowed(location.pathname);
      const audioManager = AudioManager.getInstance();

      console.log('[AudioPolicy]', { 
        pathname: location.pathname, 
        isAdminRoute,
        allowed, 
        isHandheld,
        musicEnabled, 
        volume 
      });

      if (allowed && musicEnabled) {
        audioManager.apply(true, volume);
      } else {
        audioManager.apply(false, volume);
      }
    };

    applyAudioPolicy();
  }, [location.pathname, isHandheld]);

  // Visibility and focus guards
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audioManager = AudioManager.getInstance();
      const { musicEnabled, volume, loaded } = useAudioStore.getState();
      if (!loaded) return;

      if (document.visibilityState !== 'visible') {
        audioManager.apply(false, volume);
      } else {
        const isAdminRoute = location.pathname.startsWith('/admin');
        const allowed = !isAdminRoute && isHandheld && isMusicAllowed(location.pathname);
        if (allowed && musicEnabled) {
          audioManager.apply(true, volume);
        }
      }
    };

    const handleBlur = () => {
      AudioManager.getInstance().apply(false, useAudioStore.getState().volume);
    };

    const handleFocus = () => {
      const { musicEnabled, volume, loaded } = useAudioStore.getState();
      if (!loaded) return;
      const isAdminRoute = location.pathname.startsWith('/admin');
      const allowed = !isAdminRoute && isHandheld && isMusicAllowed(location.pathname);
      if (allowed && musicEnabled) {
        AudioManager.getInstance().apply(true, volume);
      }
    };

    const handlePageHide = () => {
      AudioManager.getInstance().apply(false, useAudioStore.getState().volume);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [location.pathname, isHandheld]);

  return null;
};

// Wrapper component that uses analytics (must be inside Router)
const AppWithAnalytics = () => {
  useAnalytics();
  return null;
};

const App = () => {
  // Initialize AudioManager singleton and subscribe to store
  useEffect(() => {
    console.log('[App] Initializing AudioManager');
    const audioManager = AudioManager.getInstance();
    
    // Load settings from localStorage
    useAudioStore.getState().loadSettings();
    
    // Subscribe to store changes and apply audio policy with route checking
    const unsubscribe = useAudioStore.subscribe((state, prevState) => {
      if (!state.loaded) return;
      
      // Only apply when store values actually change
      if (state.musicEnabled !== prevState?.musicEnabled || 
          state.volume !== prevState?.volume) {
        
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        const isHandheld = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 1024;
        const allowed = !isAdminRoute && isHandheld && isMusicAllowed(window.location.pathname);
        
        console.log('[App] Store changed, applying policy:', { 
          musicEnabled: state.musicEnabled, 
          volume: state.volume,
          isAdminRoute,
          allowed,
          pathname: window.location.pathname
        });
        
        if (allowed && state.musicEnabled) {
          audioManager.apply(true, state.volume);
        } else {
          audioManager.apply(false, state.volume);
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppWithAnalytics />
        <ScrollBehaviorManager />
        <AudioPolicyManager />
        <BackgroundMusic />
        <AppRouteGuard>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/desktop" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<ChatEnhanced />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/shop" element={<ShopPage />} />
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
              <Route path="/admin/genius" element={<GeniusMembersEnhanced />} />
              <Route path="/admin/normal-users" element={<NormalUsersAnalytics />} />
              <Route path="/admin/tips" element={<AdminTipsVideos />} />
              <Route path="/admin/analytics" element={<AdvancedAnalytics />} />
              <Route path="/admin/retention" element={<RetentionDashboard />} />
              <Route path="/admin/monetization" element={<MonetizationDashboard />} />
              <Route path="/admin/performance" element={<PerformanceDashboard />} />
              <Route path="/admin/engagement" element={<EngagementDashboard />} />
              <Route path="/admin/user-journey" element={<UserJourneyDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppRouteGuard>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
