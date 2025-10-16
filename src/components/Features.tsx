import { Card } from "@/components/ui/card";
import { Coins, Zap, Trophy, Users, Gift, Heart } from "lucide-react";

const features = [
  {
    icon: Coins,
    title: "Aranyérme Rendszer",
    description: "Gyűjts aranyérméket helyes válaszokért és használd őket segítségek vásárlására vagy játék folytatására."
  },
  {
    icon: Zap,
    title: "Speed Shop",
    description: "Szerezz speed boostereket, növeld az életed maximumát és jutalmazd meg magad gyorsabb haladásért!"
  },
  {
    icon: Trophy,
    title: "Heti Rangsor",
    description: "Versenyezz más játékosokkal! A rangsor a helyes válaszok száma és az átlagos válaszidő alapján alakul."
  },
  {
    icon: Users,
    title: "Meghívórendszer",
    description: "Hívd meg barátaidat és szerezz extra aranyérméket és életeket! Minél több barát, annál több jutalom."
  },
  {
    icon: Gift,
    title: "Napi Ajándékok",
    description: "Jelentkezz be minden nap és szerezz értékes jutalmakat! 7 napos sorozat heti resettel."
  },
  {
    icon: Heart,
    title: "Élet Rendszer",
    description: "Indulj 15 ingyenes élettel! Az életek 12 percenként automatikusan töltődnek."
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">
            Játék <span className="text-transparent bg-clip-text bg-gradient-gold">Funkciók</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Minden, amire szükséged van egy izgalmas kvízélményhez
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="bg-gradient-card border-border/50 p-6 hover:border-accent/50 transition-all duration-300 hover:scale-105 hover:shadow-glow animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-accent/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-poppins">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
