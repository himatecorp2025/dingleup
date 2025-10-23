import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

type DeliveryStatusType = 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';

interface DeliveryStatusProps {
  status: DeliveryStatusType;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const DeliveryStatus = ({ status, showRetry, onRetry }: DeliveryStatusProps) => {
  if (status === 'sending') {
    return (
      <div className="flex items-center gap-1 text-white/40 text-[10px]">
        <Clock className="w-3 h-3" />
        <span>Küldés...</span>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-red-500 text-[10px]">
          <AlertCircle className="w-3 h-3" />
          <span>Sikertelen</span>
        </div>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="text-[10px] text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors underline"
          >
            Újra
          </button>
        )}
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className="flex items-center gap-1 text-white/40" title="Elküldve">
        <Check className="w-3 h-3" />
      </div>
    );
  }

  if (status === 'delivered') {
    return (
      <div className="flex items-center gap-1 text-white/60" title="Kézbesítve">
        <CheckCheck className="w-3 h-3" />
      </div>
    );
  }

  if (status === 'seen') {
    return (
      <div className="flex items-center gap-1 text-[#138F5E]" title="Látta">
        <CheckCheck className="w-3 h-3" />
      </div>
    );
  }

  return null;
};
