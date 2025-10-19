import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={isMobile ? <IntroVideo /> : <Index />} />
            <Route path="/desktop" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
