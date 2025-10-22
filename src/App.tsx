import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ScrollBehaviorManager } from "@/components/ScrollBehaviorManager";
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
import GeniusMembers from "./pages/GeniusMembers";
import ChatEnhanced from "./pages/ChatEnhanced";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Komponens ami ellenőrzi a képernyő méretet és korlátozza az app-ot mobile/tablet-re
const AppRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkDevice = () => {
      // A fejlesztés során mindig engedélyezzük (preview mode)
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('lovable.app') ||
                           window.location.hostname.includes('lovable.dev');
      setIsMobileOrTablet(isDevelopment || window.innerWidth <= 1024);
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
          <h1 className="text-3xl font-black text-white mb-4">📱 Csak mobilon elérhető</h1>
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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollBehaviorManager />
          <AppRouteGuard>
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
              <Route path="/registration-success" element={<RegistrationSuccess />} />
              <Route path="/install" element={<InstallApp />} />
              <Route path="/invitation" element={<Invitation />} />
              <Route path="/intro" element={<IntroVideo />} />
              <Route path="/game" element={<Game />} />
              <Route path="/about" element={<About />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/genius" element={<GeniusMembers />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppRouteGuard>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
