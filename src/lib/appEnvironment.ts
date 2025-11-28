/**
 * Detects if the app is running in a proper app environment
 * (PWA standalone mode or Capacitor native app)
 */
export function isAppEnvironment(): boolean {
  // Check if running as PWA in standalone mode
  const isStandalonePWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true || // iOS Safari
    document.referrer.includes('android-app://'); // Android TWA
  
  // Check if running in Capacitor native environment
  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform;
  
  return isStandalonePWA || isCapacitor;
}
