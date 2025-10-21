import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DevelopmentStatus from "@/components/DevelopmentStatus";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { AlertCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(true);

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-x-hidden overflow-y-auto relative pb-24">
      <Hero />
      <Features />
      <DevelopmentStatus />
      <Newsletter />
      <Footer />
      <BottomNav />
    </main>
  );
};

export default Index;
