import { Brain, Trophy, Users, Gift, Zap, Target } from "lucide-react";
import featureTrophy from "@/assets/feature-trophy.jpg";
import featureCategories from "@/assets/feature-categories.jpg";
import featureLeaderboard from "@/assets/feature-leaderboard.jpg";
import { useTranslation } from "react-i18next";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Brain,
      title: t('landing.featureTopics'),
      description: t('landing.featureTopicsDesc'),
      image: featureCategories,
    },
    {
      icon: Trophy,
      title: t('landing.featureRewards'),
      description: t('landing.featureRewardsDesc'),
      image: featureTrophy,
    },
    {
      icon: Users,
      title: t('landing.featureRanking'),
      description: t('landing.featureRankingDesc'),
      image: featureLeaderboard,
    }
  ];

  const additionalFeatures = [
    {
      icon: Zap,
      title: t('landing.featureHelps'),
      description: t('landing.featureHelpsDesc'),
    },
    {
      icon: Gift,
      title: t('landing.featureDailyGift'),
      description: t('landing.featureDailyGiftDesc'),
    },
    {
      icon: Target,
      title: t('landing.featureChallenges'),
      description: t('landing.featureChallengesDesc'),
    }
  ];

  return (
    <section id="features" className="py-24 px-4 relative bg-gradient-to-br from-[#1a0033] via-[#2d1b69] to-[#0f0033]">
      {/* Animated glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-6 py-3 mb-6 backdrop-blur-sm">
            <Zap className="w-5 h-5 text-pink-400 animate-pulse" />
            <span className="text-sm sm:text-base font-bold text-pink-300">{t('landing.whyChoose')}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            {t('landing.gameFeaturesTitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500">{t('landing.gameFeaturesHighlight')}</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-lg">
            {t('landing.gameFeaturesSubtitle')}
          </p>
        </div>

        {/* Main Features with Images */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-3xl border-2 border-white/10 overflow-hidden hover:border-yellow-400/50 transition-all duration-500 transform hover:scale-105 shadow-2xl">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 to-transparent"></div>
                </div>
                
                {/* Content */}
                <div className="relative p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-white drop-shadow-lg">{feature.title}</h3>
                  </div>
                  <p className="text-white/90 leading-relaxed drop-shadow">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {additionalFeatures.map((feature, index) => (
            <div 
              key={index}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${(index + 3) * 0.1}s` }}
            >
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-2 border-white/10 hover:border-pink-400/50 transition-all duration-300 transform hover:scale-105 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-pink-500/50 group-hover:shadow-pink-500/80 transition-all">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 drop-shadow-lg">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed drop-shadow">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
