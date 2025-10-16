import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";

const Newsletter = () => {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto bg-gradient-hero rounded-3xl p-12 text-center relative overflow-hidden animate-fade-in">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="bg-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-8 h-8 text-accent" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-poppins">
              Légy az Elsők Között!
            </h2>
            <p className="text-lg text-foreground/80 mb-8">
              Iratkozz fel és értesülj azonnal, amikor a Dingle UP! elérhető lesz. Plusz exkluzív Welcome Bonusz: 2500 arany + 50 élet!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Add meg az email címed" 
                className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground flex-1"
              />
              <Button className="bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 whitespace-nowrap">
                Feliratkozás
              </Button>
            </div>

            <p className="text-sm text-foreground/60 mt-4">
              Nem küldünk spam-et. Bármikor leiratkozhatsz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
