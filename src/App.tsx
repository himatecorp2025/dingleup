import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollBehaviorManager } from "@/components/ScrollBehaviorManager";
import { useAnalytics } from "@/hooks/useAnalytics";
import { lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineDetector } from "@/components/OfflineDetector";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { useBackButton } from "@/hooks/useBackButton";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { useSessionMonitor } from "@/hooks/useSessionMonitor";
import { AppRouteGuard } from "@/components/AppRouteGuard";
import { AudioPolicyManager } from "@/components/AudioPolicyManager";

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
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
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

// Analytics wrapper component
const AppWithAnalytics = () => {
  useAnalytics();
  return null;
};

// Main App component with lifecycle management
const AppCore = () => {
  // App lifecycle management
  useAppLifecycle({
    onForeground: () => {
      // Reserved for future use
    },
    onBackground: () => {
      // Reserved for future use
    },
  });

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
    <>
      <Toaster />
      <Sonner />
      <OfflineDetector />
      <UpdatePrompt />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <BackButtonHandler />
        <SessionMonitorWrapper />
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
              <Route path="/payment-success" element={<PaymentSuccess />} />
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
    </>
  );
};

// Wrapper components for hooks requiring Router context
const BackButtonHandler = () => {
  useBackButton();
  return null;
};

const SessionMonitorWrapper = () => {
  useSessionMonitor();
  return null;
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppCore />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
