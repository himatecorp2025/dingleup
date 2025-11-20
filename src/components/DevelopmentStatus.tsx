import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Rocket, Users, Crown, TrendingUp, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

const DevelopmentStatus = () => {
  const { t } = useTranslation();
  
  const statusItems = [
    {
      category: t('landing.uxCategory'),
      progress: 85,
      color: "from-accent to-accent",
      description: t('landing.uxDescription')
    },
    {
      category: t('landing.gameCategory'),
      progress: 90,
      color: "from-secondary to-primary",
      description: t('landing.gameDescription')
    },
    {
      category: t('landing.socialCategory'),
      progress: 60,
      color: "from-accent to-accent-dark",
      description: t('landing.socialDescription')
    },
    {
      category: t('landing.testingCategory'),
      progress: 75,
      color: "from-success to-success",
      description: t('landing.testingDescription')
    }
  ];

  const comingSoonFeatures = [
    {
      icon: Crown,
      title: t('landing.vipTitle'),
      description: t('landing.vipDescription'),
      badge: t('landing.comingSoon')
    },
    {
      icon: Users,
      title: t('landing.multiplayerTitle'),
      description: t('landing.multiplayerDescription'),
      badge: t('landing.inDevelopment')
    },
    {
      icon: TrendingUp,
      title: t('landing.statsTitle'),
      description: t('landing.statsDescription'),
      badge: t('landing.inPlanning')
    },
    {
      icon: Shield,
      title: t('landing.avatarTitle'),
      description: t('landing.avatarDescription'),
      badge: t('landing.comingSoon')
    }
  ];

  return (
    <section className="py-24 px-4 relative bg-gradient-to-br from-[#0f0033] via-[#1a0033] to-[#0f0033]">
      {/* Animated glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="container mx-auto relative z-10">
        {/* Development Progress Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-6 py-3 mb-6 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-sm sm:text-base font-bold text-yellow-300">{t('landing.activeDevelopment')}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            {t('landing.developmentTitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500">{t('landing.developmentHighlight')}</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-lg">
            {t('landing.developmentSubtitle')}
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
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-primary-dark opacity-90 border-3 border-primary/60 shadow-2xl transition-all duration-300 group-hover:border-accent/70" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
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
            <span className="text-sm font-semibold text-secondary">{t('landing.upcomingFeatures')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-poppins text-white">
            {t('landing.whatsComing')} <span className="text-white">{t('landing.soon')}</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {comingSoonFeatures.map((feature, index) => (
            <div 
              key={index}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s`, perspective: '1200px' }}
            >
              {/* BASE SHADOW */}
              <div className="absolute inset-0 bg-black/70 rounded-2xl" style={{ transform: 'translate(8px, 8px)', filter: 'blur(12px)' }} aria-hidden />
              
              {/* OUTER FRAME */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-primary-dark opacity-95 border-4 border-primary/60 shadow-2xl transition-all duration-300 group-hover:border-secondary/70" style={{ transform: 'translateZ(0px)' }} aria-hidden />
              
              {/* MIDDLE FRAME */}
              <div className="absolute inset-[6px] rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.6)', transform: 'translateZ(15px)' }} aria-hidden />
              
              {/* INNER LAYER */}
              <div className="absolute inset-[8px] rounded-2xl bg-gradient-to-br from-black/80 to-black/90 backdrop-blur-sm" style={{ boxShadow: 'inset 0 16px 32px rgba(255,255,255,0.1), inset 0 -16px 32px rgba(0,0,0,0.5)', transform: 'translateZ(30px)' }} aria-hidden />
              
              {/* SPECULAR HIGHLIGHT */}
              <div className="absolute inset-[8px] rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 140% 100% at 50% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 35%, transparent 75%)', transform: 'translateZ(45px)' }} aria-hidden />
              
              <div className="relative p-6 transition-all duration-300 group-hover:scale-105" style={{ transform: 'translateZ(60px)' }}>
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-secondary to-primary text-foreground shadow-lg drop-shadow-lg">
                    {feature.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className="relative mb-4" style={{ perspective: '500px' }}>
                  <div className="absolute inset-0 bg-black/40 rounded-xl" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 border border-secondary/30 shadow-lg" aria-hidden />
                  <div className="relative w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-secondary drop-shadow-lg" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 font-poppins pr-24 text-white drop-shadow-lg">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed drop-shadow">{feature.description}</p>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DevelopmentStatus;
