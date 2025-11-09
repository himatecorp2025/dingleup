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
      <div className="min-h-dvh min-h-svh flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <div className="text-center px-6 max-w-md">
          <h1 className="text-3xl font-black text-white mb-4">📱 Csak mobilon elérhető</h1>
          <p className="text-white/80 mb-6">
            Ez az oldal csak telefonon és táblagépen használható.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh h-svh w-screen bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] overflow-hidden fixed inset-0" style={{
      paddingTop: 'max(calc(env(safe-area-inset-top) + 2%), env(safe-area-inset-top) + 8px)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Casino lights at top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse z-50"></div>
      
      <div className="h-full w-full flex flex-col overflow-y-auto overflow-x-hidden px-6 py-4 max-w-4xl mx-auto relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)' }}>
      {/* Header */}
      <div className="text-center mb-4">
        {/* Report Button - Top Right */}
        <button
          onClick={() => setShowReportDialog(true)}
          className="absolute top-4 right-4 p-2 bg-red-600/80 hover:bg-red-700 rounded-lg transition-colors border border-red-400/50 shadow-lg z-10"
          title="Jelentés küldése"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-600 to-yellow-900 rounded-2xl mb-3 border-4 border-yellow-400/50 shadow-xl">
            <Building2 className="w-8 h-8 text-yellow-200" />
          </div>
          <h1 className="text-3xl font-black text-center mb-2 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 bg-clip-text text-transparent">
            Rólunk
          </h1>
          <p className="text-lg text-white/90 font-bold">
            DingleUP! - Ahol a tudás találkozik a szórakozással
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Mission Section */}
          <div className="bg-black/60 border-2 border-yellow-500/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-yellow-400 mb-2">Küldetésünk</h2>
            <p className="text-white/90 leading-relaxed">
              A DingleUP! egy innovatív kérdés-válasz játék, amely ötvözi a kvízjátékok izgalmát 
              a modern mobil gaming élményével. Célunk, hogy szórakoztató és versengő környezetet 
              teremtsünk, ahol a játékosok fejleszthetik tudásukat, miközben kitartó kihívásokkal 
              néznek szembe.
            </p>
          </div>

          {/* Features Section */}
          <div className="bg-black/60 border-2 border-purple-500/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-purple-400 mb-2">Miért játssz velünk?</h2>
            <ul className="space-y-3 text-white/90">
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 text-xl">✓</span>
                <span><strong className="text-white">Változatos témák:</strong> Történelem, kultúra, egészség és még sok más</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 text-xl">✓</span>
                <span><strong className="text-white">Ranglisták:</strong> Versenyezz más játékosokkal és mutasd meg tudásod</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 text-xl">✓</span>
                <span><strong className="text-white">Speed Boosterek:</strong> Gyorsítsd fel fejlődésed különleges erősítőkkel</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 text-xl">✓</span>
                <span><strong className="text-white">Közösség:</strong> Csevegj barátaiddal és hívd meg őket</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 text-xl">✓</span>
                <span><strong className="text-white">Napi jutalmak:</strong> Gyűjts aranyérméket és életeket</span>
              </li>
            </ul>
          </div>

          {/* Team Section */}
          <div className="bg-black/60 border-2 border-green-500/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-green-400 mb-2">Csapatunk</h2>
            <p className="text-white/90 leading-relaxed">
              A DingleUP!-ot szenvedélyes fejlesztők és játékrajongók csapata készítette, akik hisznek 
              abban, hogy a tanulás és a szórakozás kéz a kézben járhat. Folyamatosan dolgozunk új 
              funkciók fejlesztésén és a játékélmény javításán.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-black/60 border-2 border-blue-500/30 rounded-2xl p-4 backdrop-blur-sm">
            <h2 className="text-xl font-black text-blue-400 mb-2">Kapcsolat</h2>
            <p className="text-white/90 leading-relaxed mb-4">
              Kérdésed van? Szeretnél visszajelzést adni? Lépj kapcsolatba velünk!
            </p>
            <div className="space-y-2 text-white/80">
              <p>📧 Email: info@dingleup.com</p>
              <p>🌐 Web: www.dingleup.com</p>
            </div>
          </div>

          {/* Footer/Impressum */}
          <div className="text-center text-white/60 text-sm space-y-2 pt-6 border-t border-white/10">
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
