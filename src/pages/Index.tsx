import Hero from "@/components/Hero";
import Features from "@/components/Features";
import GamePreview from "@/components/GamePreview";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <GamePreview />
      <Newsletter />
      <Footer />
    </main>
  );
};

export default Index;
