import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1fe67fc55c88483eb2e59ea42baa3c0f',
  appName: 'DingleUP!',
  webDir: 'dist',
  server: {
    url: 'https://1fe67fc5-5c88-483e-b2e5-9ea42baa3c0f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#0a0a2e',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
