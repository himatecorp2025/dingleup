import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Rocket, Users, Crown, TrendingUp, Shield } from "lucide-react";

const statusItems = [
  {
    category: "Felhasználói Élmény",
    progress: 85,
    color: "from-accent to-yellow-500"
  },
  {
    category: "Játékmechanika",
    progress: 90,
    color: "from-secondary to-purple-500"
  },
  {
    category: "社交功能",
    progress: 60,
    color: "from-accent to-orange-500"
  },
  {
    category: "Tesztelés & Biztonság",
    progress: 75,
    color: "from-success to-green-500"
  }
];

const comingSoonFeatures = [
  {
    icon: Crown,
    title: "VIP Tagság",
    description: "Exkluzív előnyök, korlátlan életek és különleges témák prémium tagoknak.",
    badge: "Hamarosan"
  },
  {
    icon: Users,
    title: "Többjátékos Mód",
    description: "Versenyezz valós időben barátaiddal vagy random játékosokkal!",
    badge: "Fejlesztés alatt"
  },
  {
    icon: TrendingUp,
    title: "Statisztikák & Elemzés",
    description: "Részletes teljesítmény követés, kategória szerinti pontosság és haladás elemzés.",
    badge: "Tervezés alatt"
  },
  {
    icon: Shield,
    title: "Egyéni Avatárok",
    description: "Testreszabható profilképek és egyedi profilok minden játékosnak.",
    badge: "Hamarosan"
  }
];

const DevelopmentStatus = () => {
  return (
    <section className="py-24 px-4 relative bg-gradient-to-b from-background to-primary/30">
      <div className="container mx-auto">
        {/* Development Progress Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-sm font-semibold text-accent">Aktív Fejlesztés</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">
            Fejlesztési <span className="text-transparent bg-clip-text bg-gradient-gold">Státusz</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Folyamatosan dolgozunk azon, hogy a legjobb játékélményt nyújtsuk
          </p>
        </div>

        {/* Progress Bars */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {statusItems.map((item, index) => (
            <Card 
              key={index}
              className="bg-gradient-card border-border/50 p-6 hover:border-accent/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold font-poppins">{item.category}</h3>
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${item.color}">
                  {item.progress}%
                </span>
              </div>
              <Progress 
                value={item.progress} 
                className="h-3 bg-muted"
              />
              <div className={`h-3 w-full bg-muted rounded-full overflow-hidden mt-[-12px]`}>
                <div 
                  className={`h-full bg-gradient-to-r ${item.color} transition-all duration-1000 rounded-full shadow-glow`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Coming Soon Features */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-full px-4 py-2 mb-4">
            <Rocket className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-secondary">Közelgő Funkciók</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-poppins">
            Mit Hozunk <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-purple-400">Nemsokára</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {comingSoonFeatures.map((feature, index) => (
            <Card 
              key={index}
              className="bg-gradient-card border-border/50 p-6 hover:border-secondary/50 transition-all duration-300 hover:scale-105 group animate-fade-in relative overflow-hidden"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-secondary to-purple-500 text-white shadow-lg">
                  {feature.badge}
                </span>
              </div>

              {/* Icon */}
              <div className="bg-secondary/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-secondary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 font-poppins pr-24">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DevelopmentStatus;
