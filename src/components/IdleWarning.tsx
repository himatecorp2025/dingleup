import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n';

interface IdleWarningProps {
  show: boolean;
  remainingSeconds: number;
  onStayActive: () => void;
}

export const IdleWarning = ({ show, remainingSeconds, onStayActive }: IdleWarningProps) => {
  const { t } = useI18n();
  if (!show) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-600 to-red-800 shadow-2xl border-b-4 border-red-900 animate-slide-down"
         style={{ 
           paddingTop: 'env(safe-area-inset-top)',
         }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-white/20 rounded-full animate-pulse">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm sm:text-base">
              {t('idle.warning_message')}
            </p>
            <p className="text-white/90 text-xs sm:text-sm">
              {t('idle.logout_label')} <span className="font-mono font-black text-lg">{timeString}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onStayActive}
          className="px-4 py-2 bg-white hover:bg-white/90 text-red-700 font-black rounded-lg transition-all shadow-lg whitespace-nowrap text-sm sm:text-base"
        >
          {t('idle.stay_button')}
        </button>
      </div>
    </div>
  );
};
