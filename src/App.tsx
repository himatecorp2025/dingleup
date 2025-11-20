import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollBehaviorManager } from "@/components/ScrollBehaviorManager";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useWebVitals } from "@/hooks/useWebVitals";
import { useErrorTracking } from "@/hooks/useErrorTracking";
import { usePWAInstallTracking } from "@/hooks/usePWAInstallTracking";
import { lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameErrorBoundary } from "@/components/GameErrorBoundary";
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

// Analytics, Error Tracking, and PWA Install tracking wrapper component
const AppWithAnalytics = () => {
  useAnalytics();
  useWebVitals(); // Track Core Web Vitals performance
  useErrorTracking(); // Track and log errors
  usePWAInstallTracking(); // Track PWA install events
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
          <div className="animate-fade-in">
            <AppRouteGuard>
            <Routes>
              {/* Public routes - no ErrorBoundary needed */}
              <Route path="/" element={<Index />} />
              <Route path="/desktop" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login-username" element={<LoginUsername />} />
              <Route path="/intro" element={<IntroVideo />} />
              
              {/* Protected routes wrapped in ErrorBoundary */}
              <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
              <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
              <Route path="/leaderboard" element={<ErrorBoundary><Leaderboard /></ErrorBoundary>} />
              <Route path="/game" element={<GameErrorBoundary><Game /></GameErrorBoundary>} />
              <Route path="/registration-success" element={<ErrorBoundary><RegistrationSuccess /></ErrorBoundary>} />
              <Route path="/payment-success" element={<ErrorBoundary><PaymentSuccess /></ErrorBoundary>} />
              <Route path="/install" element={<ErrorBoundary><InstallApp /></ErrorBoundary>} />
              <Route path="/invitation" element={<ErrorBoundary><Invitation /></ErrorBoundary>} />
              <Route path="/about" element={<ErrorBoundary><About /></ErrorBoundary>} />
              <Route path="/popular-content" element={<ErrorBoundary><PopularContent /></ErrorBoundary>} />
              <Route path="/profile/game" element={<ErrorBoundary><ProfileGame /></ErrorBoundary>} />
              
              {/* Admin routes wrapped in ErrorBoundary */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
              <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
              <Route path="/admin/analytics" element={<ErrorBoundary><AdvancedAnalytics /></ErrorBoundary>} />
              <Route path="/admin/retention" element={<ErrorBoundary><RetentionDashboard /></ErrorBoundary>} />
              <Route path="/admin/performance" element={<ErrorBoundary><PerformanceDashboard /></ErrorBoundary>} />
              <Route path="/admin/engagement" element={<ErrorBoundary><EngagementDashboard /></ErrorBoundary>} />
              <Route path="/admin/user-journey" element={<ErrorBoundary><UserJourneyDashboard /></ErrorBoundary>} />
              <Route path="/admin/popular-content" element={<ErrorBoundary><AdminPopularContent /></ErrorBoundary>} />
              <Route path="/admin/game-profiles" element={<ErrorBoundary><AdminGameProfiles /></ErrorBoundary>} />
              <Route path="/admin/game-profiles/:userId" element={<ErrorBoundary><AdminGameProfileDetail /></ErrorBoundary>} />
              <Route path="/admin/ad-interests" element={<ErrorBoundary><AdminAdInterests /></ErrorBoundary>} />
              <Route path="/admin/booster-types" element={<ErrorBoundary><AdminBoosterTypes /></ErrorBoundary>} />
              <Route path="/admin/booster-purchases" element={<ErrorBoundary><AdminBoosterPurchases /></ErrorBoundary>} />
              
              {/* 404 fallback */}
              <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
            </Routes>
          </AppRouteGuard>
          </div>
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
