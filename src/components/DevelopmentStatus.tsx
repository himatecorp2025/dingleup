import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Rocket, Users, Crown, TrendingUp, Shield } from "lucide-react";

const statusItems = [
  {
    category: "Felhasználói Élmény",
    progress: 85,
    color: "from-accent to-yellow-500",
    description: "Responzív design optimalizálás, animációk finomhangolása, sötét/világos téma váltás implementálása és általános UX/UI fejlesztések."
  },
  {
    category: "Játékmechanika",
    progress: 90,
    color: "from-secondary to-purple-500",
    description: "Kérdésbank bővítés 500+ kérdésre, timer rendszer optimalizálás, segítségek rendszerének tökéletesítése és pontszámítási logika finomítása."
  },
  {
    category: "Szociális Funkciók",
    progress: 60,
    color: "from-accent to-orange-500",
    description: "Heti rangsor rendszer fejlesztése, meghívó rendszer kidolgozása, social share funkciók és barátok kezelésének implementálása."
  },
  {
    category: "Tesztelés & Biztonság",
    progress: 75,
    color: "from-lime-400 to-green-400",
    description: "Keresztplatform tesztelés, teljesítmény optimalizálás, biztonsági protokollok implementálása és bug fixing folyamatos végzése."
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
    <section className="py-24 px-4 relative bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      <div className="container mx-auto">
        {/* Development Progress Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-sm font-semibold text-accent">Aktív Fejlesztés</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-poppins text-white text-with-stroke">
            Fejlesztési <span className="text-white">Státusz</span>
          </h2>
          <p className="text-xl text-white max-w-2xl mx-auto">
            Folyamatosan dolgozunk azon, hogy a legjobb játékélményt nyújtsuk
          </p>
        </div>

        {/* Progress Bars - Deep 3D */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {statusItems.map((item, index) => (
            <div 
              key={index}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s`, perspective: '1000px' }}
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
              
              <div className="relative p-6 transition-all duration-300 hover:scale-105" style={{ transform: 'translateZ(40px)' }}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold font-poppins text-white drop-shadow-lg">{item.category}</h3>
                  <span className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${item.color} drop-shadow-lg`}>
                    {item.progress}%
                  </span>
                </div>
                <div className={`h-3 w-full bg-muted rounded-full overflow-hidden mb-4 relative`}>
                  <div 
                    className={`h-full bg-gradient-to-r ${item.color} transition-all duration-1000 rounded-full shadow-glow`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-sm text-white/80 leading-relaxed drop-shadow">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Features */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-full px-4 py-2 mb-4">
            <Rocket className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-secondary">Közelgő Funkciók</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-poppins text-white">
            Mit Hozunk <span className="text-white">Nemsokára</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {comingSoonFeatures.map((feature, index) => (
            <div 
              key={index}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s`, perspective: '1000px' }}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-90 border-3 border-purple-500/60 shadow-2xl transition-all duration-300 group-hover:border-secondary/70" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[4px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-br from-black/80 to-black/90 backdrop-blur-sm" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.1), inset 0 -12px 24px rgba(0,0,0,0.4)', transform: 'translateZ(20px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[6px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)', transform: 'translateZ(30px)' }} aria-hidden />
              
              <div className="relative p-6 transition-all duration-300 group-hover:scale-105" style={{ transform: 'translateZ(40px)' }}>
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-secondary to-purple-500 text-white shadow-lg drop-shadow-lg">
                    {feature.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className="relative mb-4" style={{ perspective: '500px' }}>
                  <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary/20 to-purple-500/20 border border-secondary/30 shadow-lg" aria-hidden />
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-secondary drop-shadow-lg" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 font-poppins pr-24 text-white drop-shadow-lg">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed drop-shadow">{feature.description}</p>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DevelopmentStatus;
