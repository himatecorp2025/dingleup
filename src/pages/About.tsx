import { useEffect, useState } from 'react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { Building2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { ReportDialog } from '@/components/ReportDialog';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { isHandheld, isStandalone } = usePlatformDetection();
  const { t } = useTranslation();
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Only show on mobile/tablet
  if (!isHandheld) {
    return (
      <div className="min-h-dvh min-h-svh flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <div className="text-center px-6 max-w-md">
          <h1 className="text-3xl font-black text-foreground mb-4">📱 {t('game.mobileOnly')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('game.mobileOnlyDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh h-svh w-screen overflow-hidden fixed inset-0" style={{
      paddingTop: 'max(calc(env(safe-area-inset-top) + 2%), env(safe-area-inset-top) + 8px)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Full-screen background that covers status bar */}
      <div 
        className="fixed bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]"
        style={{
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          width: 'calc(100vw + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
          height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none'
        }}
      />
      
      {/* Casino lights removed per user requirement */}
      
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden px-6 py-4 max-w-4xl mx-auto relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }}>
      {/* Header */}
      <div className="text-center mb-4">
        {/* Report Button - Top Right */}
        <button
          onClick={() => setShowReportDialog(true)}
          className="absolute top-4 right-4 p-2 bg-destructive/80 hover:bg-destructive rounded-lg transition-colors border border-destructive/50 shadow-lg z-10"
          title={t('dialogs.report.title')}
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl mb-3 border-4 border-accent/50 shadow-xl">
            <Building2 className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-accent via-foreground to-accent bg-clip-text text-transparent">
            {t('about.title')}
          </h1>
          <p className="text-lg text-foreground/90 font-bold">
            {t('about.tagline')}
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Mission Section */}
          <div className="bg-background/60 border-2 border-accent/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-accent mb-2">{t('about.mission.title')}</h2>
            <p className="text-foreground/90 leading-relaxed">
              {t('about.mission.description')}
            </p>
          </div>

          {/* Features Section */}
          <div className="bg-background/60 border-2 border-primary/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-primary-glow mb-2">{t('about.whyPlay')}</h2>
            <ul className="space-y-3 text-foreground/90">
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">{t('about.features.topics')}:</strong> {t('about.features.topicsDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">{t('about.features.leaderboards')}:</strong> {t('about.features.leaderboardsDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">{t('about.features.boosters')}:</strong> {t('about.features.boostersDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">{t('about.features.community')}:</strong> {t('about.features.communityDesc')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">{t('about.features.rewards')}:</strong> {t('about.features.rewardsDesc')}</span>
              </li>
            </ul>
          </div>

          {/* Team Section */}
          <div className="bg-background/60 border-2 border-success/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-success mb-2">{t('about.team.title')}</h2>
            <p className="text-foreground/90 leading-relaxed">
              {t('about.team.description')}
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-background/60 border-2 border-primary-glow/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-primary-glow mb-2">{t('about.contact.title')}</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              {t('about.contact.description')}
            </p>
            <div className="space-y-2 text-foreground/80">
              <p>📧 Email: info@dingleup.com</p>
              <p>🌐 Web: www.dingleup.com</p>
            </div>
          </div>

          {/* Footer/Impressum */}
          <div className="text-center text-muted-foreground text-sm space-y-2 pt-6 border-t border-border">
            <p>{t('about.copyright')}</p>
            <p>{t('about.version')}</p>
            <p className="text-xs">
              {t('about.disclaimer')}
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
      
      {/* Report Dialog */}
      <ReportDialog 
        open={showReportDialog} 
        onOpenChange={setShowReportDialog}
      />
    </div>
  );
};

export default About;
