import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { supabase } from '@/integrations/supabase/client';

const InstallApp = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [googlePlayUrl, setGooglePlayUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');

  useEffect(() => {
    fetchDownloadLinks();
  }, []);

  const fetchDownloadLinks = async () => {
    const { data } = await supabase
      .from('app_download_links')
      .select('google_play_url, app_store_url')
      .single();
    
    if (data) {
      setGooglePlayUrl(data.google_play_url || '');
      setAppStoreUrl(data.app_store_url || '');
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 p-3 rounded-full hover:scale-110 transition-all"
        title={t('install.back_to_home')}
      >
        {/* BASE SHADOW */}
        <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
        
        {/* OUTER FRAME */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
        
        {/* MIDDLE FRAME */}
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
        
        {/* INNER LAYER */}
        <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
        
        {/* SPECULAR HIGHLIGHT */}
        <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
        
        {/* Icon */}
        <LogOut className="w-6 h-6 text-white relative z-10 -scale-x-100" />
      </button>

      <div className="max-w-md mx-auto pt-20 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="128"
          height="128"
          viewBox="0 0 1024 1024"
          className="mx-auto mb-6"
        >
          <image
            href="/logo.png"
            x="0"
            y="0"
            width="1024"
            height="1024"
            preserveAspectRatio="xMidYMid meet"
          />
        </svg>
        
        <h1 className="text-3xl font-black text-white mb-2">
          {t('install.title')}
        </h1>
        <p className="text-white/70 text-base mb-8">
          {t('install.app_only_message')}
        </p>

        {/* Store Download Buttons */}
        {(googlePlayUrl || appStoreUrl) && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="text-white font-bold text-lg mb-4">
              {t('install.download_from_store')}
            </h3>
            
            <div className="flex flex-col gap-3">
              {googlePlayUrl && (
                <a
                  href={googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-black hover:bg-black/80 text-white py-3 px-6 rounded-lg transition-all hover:scale-105"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <span className="font-semibold">Google Play</span>
                </a>
              )}
              
              {appStoreUrl && (
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-black hover:bg-black/80 text-white py-3 px-6 rounded-lg transition-all hover:scale-105"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                  </svg>
                  <span className="font-semibold">App Store</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* OR Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="text-white/50 font-semibold text-sm uppercase">{t('install.or')}</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        {/* PWA Installation Instructions */}
        {(isIOS || isAndroid) && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-400" />
              {t('install.pwa_title')}
            </h3>
            {isIOS && (
              <ol className="text-white/80 space-y-3 text-sm list-decimal list-inside">
                <li>{t('install.ios.step1')}</li>
                <li>{t('install.ios.step2')}</li>
                <li>{t('install.ios.step3')}</li>
              </ol>
            )}
            {isAndroid && (
              <ol className="text-white/80 space-y-3 text-sm list-decimal list-inside">
                <li>{t('install.android.step1')}</li>
                <li>{t('install.android.step2')}</li>
                <li>{t('install.android.step3')}</li>
              </ol>
            )}
          </div>
        )}

        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full"
        >
          {t('install.back_to_home')}
        </Button>
      </div>
    </div>
  );
};

export default InstallApp;