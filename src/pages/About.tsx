import { useEffect, useState } from 'react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import { Building2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { ReportDialog } from '@/components/ReportDialog';

const About = () => {
  const { isHandheld, isStandalone } = usePlatformDetection();
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Only show on mobile/tablet
  if (!isHandheld) {
    return (
      <div className="min-h-dvh min-h-svh flex items-center justify-center bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
        <div className="text-center px-6 max-w-md">
          <h1 className="text-3xl font-black text-foreground mb-4">📱 Csak mobilon elérhető</h1>
          <p className="text-muted-foreground mb-6">
            Ez az oldal csak telefonon és táblagépen használható.
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
        className="fixed bg-gradient-to-b from-primary-darker via-primary-dark to-primary-darker"
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
          title="Jelentés küldése"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl mb-3 border-4 border-accent/50 shadow-xl">
            <Building2 className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-accent via-foreground to-accent bg-clip-text text-transparent">
            Rólunk
          </h1>
          <p className="text-lg text-foreground/90 font-bold">
            DingleUP! - Ahol a tudás találkozik a szórakozással
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Mission Section */}
          <div className="bg-background/60 border-2 border-accent/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-accent mb-2">Küldetésünk</h2>
            <p className="text-foreground/90 leading-relaxed">
              A DingleUP! egy innovatív kérdés-válasz játék, amely ötvözi a kvízjátékok izgalmát 
              a modern mobil gaming élményével. Célunk, hogy szórakoztató és versengő környezetet 
              teremtsünk, ahol a játékosok fejleszthetik tudásukat, miközben kitartó kihívásokkal 
              néznek szembe.
            </p>
          </div>

          {/* Features Section */}
          <div className="bg-background/60 border-2 border-primary/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-primary-glow mb-2">Miért játssz velünk?</h2>
            <ul className="space-y-3 text-foreground/90">
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">Változatos témák:</strong> Történelem, kultúra, egészség és még sok más</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">Ranglisták:</strong> Versenyezz más játékosokkal és mutasd meg tudásod</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">Speed Boosterek:</strong> Gyorsítsd fel fejlődésed különleges erősítőkkel</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">Közösség:</strong> Csevegj barátaiddal és hívd meg őket</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent text-xl">✓</span>
                <span><strong className="text-foreground">Napi jutalmak:</strong> Gyűjts aranyérméket és életeket</span>
              </li>
            </ul>
          </div>

          {/* Team Section */}
          <div className="bg-background/60 border-2 border-success/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-success mb-2">Csapatunk</h2>
            <p className="text-foreground/90 leading-relaxed">
              A DingleUP!-ot szenvedélyes fejlesztők és játékrajongók csapata készítette, akik hisznek 
              abban, hogy a tanulás és a szórakozás kéz a kézben járhat. Folyamatosan dolgozunk új 
              funkciók fejlesztésén és a játékélmény javításán.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-background/60 border-2 border-primary-glow/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-primary-glow mb-2">Kapcsolat</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Kérdésed van? Szeretnél visszajelzést adni? Lépj kapcsolatba velünk!
            </p>
            <div className="space-y-2 text-foreground/80">
              <p>📧 Email: info@dingleup.com</p>
              <p>🌐 Web: www.dingleup.com</p>
            </div>
          </div>

          {/* Footer/Impressum */}
          <div className="text-center text-muted-foreground text-sm space-y-2 pt-6 border-t border-border">
            <p>&copy; 2025 DingleUP! Minden jog fenntartva.</p>
            <p>Verzió 1.0.0</p>
            <p className="text-xs">
              Ez az alkalmazás kizárólag szórakoztatási célokat szolgál. 
              Felelősen játssz és élvezd a játékot!
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
