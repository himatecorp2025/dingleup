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
    description: "1/3, 2× válasz, és közönség segítség minden játékban",
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

        {/* Main Features with Images - Deep 3D */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s`, perspective: '1200px' }}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(8px, 8px)', filter: 'blur(12px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-95 border-4 border-purple-500/60 shadow-2xl transition-all duration-500 group-hover:border-accent/70" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.6)', transform: 'translateZ(15px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[8px] rounded-2xl bg-gradient-to-br from-black/80 to-black/90" style={{ boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.1), inset 0 -16px 32px rgba(0,0,0,0.5)', transform: 'translateZ(30px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[8px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 35%, transparent 75%)', transform: 'translateZ(45px)' }} aria-hidden />
              
              <div className="relative overflow-hidden rounded-2xl transition-all duration-500 group-hover:scale-105" style={{ transform: 'translateZ(60px)' }}>
                {/* Image Background */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} opacity-60 group-hover:opacity-40 transition-opacity duration-500`}></div>
                  
                  {/* Icon with 3D */}
                  <div className="absolute top-4 left-4 relative" style={{ perspective: '500px' }}>
                    <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md border border-white/20 shadow-lg" aria-hidden />
                    <div className="relative p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-black/70 backdrop-blur-sm">
                  <h3 className="text-2xl font-bold mb-3 font-poppins text-white drop-shadow-lg">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed drop-shadow">
                    {feature.description}
                  </p>

                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none rounded-2xl`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features - Deep 3D */}
        <div className="grid md:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => (
            <div 
              key={index}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${0.4 + index * 0.1}s`, perspective: '1000px' }}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-90 border-3 border-purple-500/60 shadow-2xl transition-all duration-300 group-hover:border-accent/70" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[4px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-br from-black/80 to-black/90 backdrop-blur-sm" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.1), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[6px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative p-6 transition-all duration-300 group-hover:scale-105" style={{ transform: 'translateZ(40px)' }}>
                <div className="flex items-start gap-4">
                  <div className="relative" style={{ perspective: '500px' }}>
                    <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-accent/20 to-secondary/20 border border-accent/30 shadow-lg`} aria-hidden />
                    <div className="relative p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className={`w-6 h-6 ${feature.color} drop-shadow-lg`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 font-poppins text-white group-hover:text-accent transition-colors duration-300 drop-shadow-lg">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed drop-shadow">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
