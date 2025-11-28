import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DevelopmentStatus from "@/components/DevelopmentStatus";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { LanguageSelector } from "@/components/LanguageSelector";
import loadingLogo from '@/assets/dingleup-loading-logo.png';

const Index = () => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => {
    // Immediate check on first render
    return window.innerWidth <= 1024;
  });

  useEffect(() => {
    // Check device type
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobileOrTablet(width <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mobile/tablet: redirect immediately to auth/choice
  if (isMobileOrTablet) {
    return <Navigate to="/auth/choice" replace />;
  }

  // Desktop/laptop: show landing page
  return (
    <main className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033] overflow-x-hidden overflow-y-auto">
      {/* Full-screen deep purple/blue background extending behind status bar */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033]" 
           style={{
             top: 'calc(-1 * env(safe-area-inset-top, 0px))',
             left: 'calc(-1 * env(safe-area-inset-left, 0px))',
             right: 'calc(-1 * env(safe-area-inset-right, 0px))',
             bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
             width: 'calc(100% + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
             height: 'calc(100% + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
             zIndex: 0
           }} 
      />
      
      {/* Language selector - top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="relative z-10">
        <div data-tutorial="hero">
          <Hero />
        </div>
        <div data-tutorial="features">
          <Features />
        </div>
        <DevelopmentStatus />
        <Newsletter />
        
        <Footer />
      </div>
    </main>
  );
};

export default Index;
