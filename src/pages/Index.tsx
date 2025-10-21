import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DevelopmentStatus from "@/components/DevelopmentStatus";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-x-hidden overflow-y-auto">
      <Hero />
      <Features />
      <DevelopmentStatus />
      <Newsletter />
      <Footer />
    </main>
  );
};

export default Index;
