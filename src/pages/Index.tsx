import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DevelopmentStatus from "@/components/DevelopmentStatus";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { AlertCircle } from "lucide-react";
import { LoginPromoManager } from '@/components/LoginPromoManager';

const Index = () => {
  const navigate = useNavigate();
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check device type
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobileOrTablet(width <= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-x-hidden overflow-y-auto relative">
      <div data-tutorial="hero">
        <Hero />
      </div>
      <div data-tutorial="features">
        <Features />
      </div>
      <DevelopmentStatus />
      <Newsletter />
      
      <Footer />
    </main>
  );
};

export default Index;
