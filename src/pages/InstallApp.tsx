import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo.png';

const InstallApp = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 p-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full shadow-lg hover:from-red-700 hover:to-red-900 transition-all hover:scale-110 border-2 border-red-400/50"
        title="Vissza"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="max-w-md mx-auto pt-20 text-center">
        <img src={logoImage} alt="Dingle UP!" className="w-32 h-32 mx-auto mb-6" />
        
        <h1 className="text-3xl font-black text-white mb-4">
          Telepítsd az alkalmazást!
        </h1>

        {isInstalled ? (
          <div className="bg-green-600/20 border-2 border-green-500/50 rounded-xl p-6 mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-white text-lg">
              Az alkalmazás már telepítve van!
            </p>
          </div>
        ) : (
          <>
            {isInstallable && !isIOS && (
              <Button
                onClick={handleInstall}
                className="w-full py-6 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-black text-lg rounded-xl mb-6"
              >
                <Download className="w-6 h-6 mr-2" />
                Telepítés most
              </Button>
            )}

            {isIOS && (
              <div className="bg-blue-600/20 border-2 border-blue-500/50 rounded-xl p-6 mb-6 text-left">
                <h3 className="text-white font-bold text-lg mb-3">iOS telepítés:</h3>
                <ol className="text-white/80 space-y-2 text-sm">
                  <li>1. Nyomd meg a <strong>Megosztás</strong> gombot</li>
                  <li>2. Görgess le és válaszd a <strong>"Kezdőképernyőhöz"</strong> opciót</li>
                  <li>3. Nyomd meg a <strong>"Hozzáadás"</strong> gombot</li>
                </ol>
              </div>
            )}

            {isAndroid && !isInstallable && (
              <div className="bg-green-600/20 border-2 border-green-500/50 rounded-xl p-6 mb-6 text-left">
                <h3 className="text-white font-bold text-lg mb-3">Android telepítés:</h3>
                <ol className="text-white/80 space-y-2 text-sm">
                  <li>1. Nyomd meg a böngésző <strong>menü</strong> gombot (⋮)</li>
                  <li>2. Válaszd a <strong>"Telepítés"</strong> vagy <strong>"Kezdőképernyőhöz adás"</strong> opciót</li>
                  <li>3. Erősítsd meg a telepítést</li>
                </ol>
              </div>
            )}

            {!isIOS && !isAndroid && (
              <div className="bg-purple-600/20 border-2 border-purple-500/50 rounded-xl p-6 mb-6">
                <p className="text-white">
                  Nyisd meg ezt az oldalt mobilon a telepítéshez!
                </p>
              </div>
            )}
          </>
        )}

        <div className="space-y-3 text-white/70 text-sm">
          <p>✅ Offline működés</p>
          <p>✅ Gyors betöltés</p>
          <p>✅ Alkalmazás-szerű élmény</p>
          <p>✅ Kezdőképernyő ikon</p>
        </div>
      </div>
    </div>
  );
};

export default InstallApp;
