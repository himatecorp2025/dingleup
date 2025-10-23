import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ScrollBehaviorManager } from "@/components/ScrollBehaviorManager";
import { useAudioStore } from "@/stores/audioStore";
import AudioManager from "@/lib/audioManager";
import { usePlatformDetection } from "@/hooks/usePlatformDetection";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ShopPage from "./pages/ShopPage";
import Leaderboard from "./pages/Leaderboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import InstallApp from "./pages/InstallApp";
import Invitation from "./pages/Invitation";
import IntroVideo from "./pages/IntroVideo";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTipsVideos from "./pages/AdminTipsVideos";
import GeniusMembers from "./pages/GeniusMembers";
import Chat from "./pages/Chat";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

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

// Route-based music control - ONLY game route (includes topic selector and gameplay)
const MUSIC_ALLOWED_ROUTES = [/^\/game$/];

function isMusicAllowed(pathname: string): boolean {
  return MUSIC_ALLOWED_ROUTES.some(pattern => pattern.test(pathname));
}

// Audio policy manager component
const AudioPolicyManager = () => {
  const location = useLocation();
  const isHandheld = usePlatformDetection();

  useEffect(() => {
    const applyAudioPolicy = () => {
      const { musicEnabled, volume, loaded } = useAudioStore.getState();
      if (!loaded) return;

      const allowed = isHandheld && isMusicAllowed(location.pathname);
      const audioManager = AudioManager.getInstance();

      console.log('[AudioPolicy]', { 
        pathname: location.pathname, 
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
        const allowed = isHandheld && isMusicAllowed(location.pathname);
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
      const allowed = isHandheld && isMusicAllowed(location.pathname);
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

const App = () => {
  // Initialize AudioManager singleton and subscribe to store
  useEffect(() => {
    console.log('[App] Initializing AudioManager');
    const audioManager = AudioManager.getInstance();
    
    // Load settings from localStorage
    useAudioStore.getState().loadSettings();
    
    // Subscribe to store changes
    const unsubscribe = useAudioStore.subscribe((state) => {
      if (!state.loaded) return;
      
      // Only apply if on allowed route and handheld device
      const isHandheld = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 1024;
      const allowed = isHandheld && isMusicAllowed(window.location.pathname);
      
      if (allowed && state.musicEnabled) {
        audioManager.apply(true, state.volume);
      } else {
        audioManager.apply(false, state.volume);
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
        <ScrollBehaviorManager />
        <AudioPolicyManager />
        <AppRouteGuard>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/desktop" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/install" element={<InstallApp />} />
            <Route path="/invitation" element={<Invitation />} />
            <Route path="/intro" element={<IntroVideo />} />
            <Route path="/game" element={<Game />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/genius" element={<GeniusMembers />} />
            <Route path="/admin/tips" element={<AdminTipsVideos />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppRouteGuard>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
