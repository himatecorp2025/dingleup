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
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-600 to-red-800 shadow-2xl animate-slide-down"
         style={{ 
           paddingTop: 'env(safe-area-inset-top)',
           borderBottomWidth: 'clamp(2px, 0.5vw, 4px)',
           borderColor: '#7f1d1d'
         }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between"
        style={{
          padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)',
          gap: 'clamp(0.75rem, 2vw, 1rem)'
        }}
      >
        <div className="flex items-center flex-1" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
          <div className="bg-white/20 rounded-full animate-pulse"
            style={{ padding: 'clamp(0.375rem, 1vw, 0.5rem)' }}
          >
            <AlertCircle style={{ width: 'clamp(20px, 5vw, 24px)', height: 'clamp(20px, 5vw, 24px)' }} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold"
              style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' }}
            >
              {t('idle.warning_message')}
            </p>
            <p className="text-white/90"
              style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8125rem)' }}
            >
              {t('idle.logout_label')} <span className="font-mono font-black" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)' }}>{timeString}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onStayActive}
          className="bg-white hover:bg-white/90 text-red-700 font-black rounded-lg transition-all shadow-lg whitespace-nowrap"
          style={{
            padding: 'clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.75rem, 2.5vw, 1rem)',
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
          }}
        >
          {t('idle.stay_button')}
        </button>
      </div>
    </div>
  );
};
