import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Kérlek adj meg egy érvényes email címet!");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === '23505') {
          toast.error("Ez az email cím már fel van iratkozva!");
        } else {
          throw error;
        }
      } else {
        toast.success("Sikeresen feliratkoztál! Hamarosan értesítünk!");
        setEmail("");
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error("Hiba történt a feliratkozás során");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto relative animate-fade-in" style={{ perspective: '1200px' }}>
          {/* BASE SHADOW */}
          <div className="absolute inset-0 bg-black/70 rounded-3xl" style={{ transform: 'translate(8px, 8px)', filter: 'blur(12px)' }} aria-hidden />
          
          {/* OUTER FRAME */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-95 border-4 border-purple-500/60 shadow-2xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
          
          {/* MIDDLE FRAME */}
          <div className="absolute inset-[6px] rounded-3xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.6)', transform: 'translateZ(15px)' }} aria-hidden />
          
          {/* INNER LAYER */}
          <div className="absolute inset-[8px] rounded-3xl bg-gradient-to-br from-black/80 to-black/90" style={{ boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.1), inset 0 -16px 32px rgba(0,0,0,0.5)', transform: 'translateZ(30px)' }} aria-hidden />
          
          {/* SPECULAR HIGHLIGHT */}
          <div className="absolute inset-[8px] rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 35%, transparent 75%)', transform: 'translateZ(45px)' }} aria-hidden />
          
          <div className="relative p-12 text-center overflow-hidden rounded-3xl" style={{ transform: 'translateZ(60px)' }}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="relative mx-auto mb-6 w-16 h-16" style={{ perspective: '500px' }}>
                <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/30 shadow-lg" aria-hidden />
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center">
                  <Bell className="w-8 h-8 text-accent drop-shadow-lg" />
                </div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-poppins text-white text-with-stroke drop-shadow-lg flex items-center justify-center">
                Légy az Elsők Között!
              </h2>
              <p className="text-lg text-white/90 mb-8 drop-shadow text-with-stroke">
                Iratkozz fel és értesülj azonnal, amikor a Dingle UP! elérhető lesz. Plusz exkluzív Welcome Bonusz: 2500 arany + 50 élet!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="Add meg az email címed" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  disabled={loading}
                  className="bg-background/50 border-border/50 text-white placeholder:text-white/60 flex-1"
                />
                <Button 
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 whitespace-nowrap"
                >
                  {loading ? "Feliratkozás..." : "Feliratkozás"}
                </Button>
              </div>

              <p className="text-sm text-white/70 mt-4 text-with-stroke">
                Nem küldünk spam-et. Bármikor leiratkozhatsz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
