import { useEffect, useState } from 'react';
import { usePlatformDetection } from '@/hooks/usePlatformDetection';
import BottomNav from '@/components/BottomNav';
import { Building2 } from 'lucide-react';

const About = () => {
  const isHandheld = usePlatformDetection();

  // Only show on mobile/tablet
  if (!isHandheld) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
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
    <div className="page-scroll bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      {/* Casino lights at top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 opacity-80 animate-pulse z-50"></div>
      
      <div className="max-w-4xl mx-auto p-6 pt-12 pb-24">
        {/* Header */}
        <div className="text-center mb-12 pt-safe">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-600 to-yellow-900 rounded-2xl mb-6 border-4 border-yellow-400/50 shadow-xl">
            <Building2 className="w-10 h-10 text-yellow-200" />
          </div>
          <h1 className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 bg-clip-text text-transparent">
            Rólunk
          </h1>
          <p className="text-xl text-white/90 font-bold">
            DingleUP! - Ahol a tudás találkozik a szórakozással
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Mission Section */}
          <div className="bg-black/60 border-2 border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-yellow-400 mb-4">Küldetésünk</h2>
            <p className="text-white/90 leading-relaxed">
              A DingleUP! egy innovatív kérdés-válasz játék, amely ötvözi a kvízjátékok izgalmát 
              a modern mobil gaming élményével. Célunk, hogy szórakoztató és versengő környezetet 
              teremtsünk, ahol a játékosok fejleszthetik tudásukat, miközben kitartó kihívásokkal 
              néznek szembe.
            </p>
          </div>

          {/* Features Section */}
          <div className="bg-black/60 border-2 border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-purple-400 mb-4">Miért játssz velünk?</h2>
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
          <div className="bg-black/60 border-2 border-green-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-green-400 mb-4">Csapatunk</h2>
            <p className="text-white/90 leading-relaxed">
              A DingleUP!-ot szenvedélyes fejlesztők és játékrajongók csapata készítette, akik hisznek 
              abban, hogy a tanulás és a szórakozás kéz a kézben járhat. Folyamatosan dolgozunk új 
              funkciók fejlesztésén és a játékélmény javításán.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-black/60 border-2 border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-blue-400 mb-4">Kapcsolat</h2>
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
    </div>
  );
};

export default About;
