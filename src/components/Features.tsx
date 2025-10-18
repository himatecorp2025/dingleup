import { Card } from "@/components/ui/card";
import { Brain, Trophy, Users, Gift, Zap, Target } from "lucide-react";
import featureTrophy from "@/assets/feature-trophy.jpg";
import featureCategories from "@/assets/feature-categories.jpg";
import featureLeaderboard from "@/assets/feature-leaderboard.jpg";

const features = [
  {
    icon: Brain,
    title: "Változatos Témakörök",
    description: "Egészség, Történelem, Kultúra és Pénzügy területeken mérd össze tudásod!",
    image: featureCategories,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Trophy,
    title: "Izgalmas Jutalmak",
    description: "Gyűjts aranyérméket és váltsd be őket hasznos segítségekre és boosterekre!",
    image: featureTrophy,
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    icon: Users,
    title: "Heti Rangsor",
    description: "Versenyezz más játékosokkal a heti ranglistán és légy te a legjobb!",
    image: featureLeaderboard,
    gradient: "from-blue-500 to-cyan-500"
  }
];

const additionalFeatures = [
  {
    icon: Zap,
    title: "Segítségek",
    description: "Harmadoló, 2× válasz, és közönség segítség minden játékban",
    color: "text-yellow-500"
  },
  {
    icon: Gift,
    title: "Napi Ajándék",
    description: "Jelentkezz be naponta és kapj értékes jutalmakat!",
    color: "text-pink-500"
  },
  {
    icon: Target,
    title: "15 Kihívás",
    description: "15 fokozatosan nehezedő kérdés minden menetben",
    color: "text-green-500"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 relative bg-gradient-to-b from-[#0f0f3d] via-[#0a0a2e] to-[#16213e]">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 mb-4">
            <Zap className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-sm font-semibold text-accent">Miért válaszd ezt?</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-poppins text-white">
            Játék <span className="text-white">Funkciók</span>
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Fedezd fel a Milliomos Quiz egyedi lehetőségeit
          </p>
        </div>

        {/* Main Features with Images */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group relative bg-gradient-card border-border/50 p-0 overflow-hidden hover:border-accent/50 transition-all duration-500 hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image Background */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} opacity-60 group-hover:opacity-40 transition-opacity duration-500`}></div>
                
                {/* Icon */}
                <div className="absolute top-4 left-4 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 bg-gradient-to-b from-card/95 to-card">
                <h3 className="text-2xl font-bold mb-3 font-poppins text-white group-hover:text-accent transition-colors duration-300 bg-purple-900/70 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-purple-500/50">
                  {feature.title}
                </h3>
                <p className="text-white/80 leading-relaxed bg-purple-900/70 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-purple-500/50">
                  {feature.description}
                </p>

                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}></div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => (
            <Card 
              key={index}
              className="bg-black/60 border-2 border-purple-500/30 backdrop-blur-sm p-6 hover:border-accent/50 transition-all duration-300 hover:scale-105 group animate-fade-in"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl border border-accent/30 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2 font-poppins text-white group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
