import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AdminReportActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reporterId: string;
  actionType: 'reviewing' | 'resolved' | 'dismissed';
  onSuccess: () => void;
}

const actionConfig = {
  reviewing: {
    title: 'Jelentés folyamatban',
    description: 'Jelezd a felhasználónak, hogy a jelentést folyamatban van vizsgálva.',
    buttonText: 'Folyamatba helyezés',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
    defaultMessage: 'Köszönjük a jelentésedet! A csapatunk vizsgálja az ügyet, és hamarosan válaszolunk.'
  },
  resolved: {
    title: 'Jelentés megoldva',
    description: 'Jelezd a felhasználónak, hogy a jelentés meg lett oldva.',
    buttonText: 'Megoldva',
    buttonClass: 'bg-green-600 hover:bg-green-700',
    defaultMessage: 'Köszönjük a jelentésedet! Az általad jelzett problémát megoldottuk.'
  },
  dismissed: {
    title: 'Jelentés elutasítva',
    description: 'Jelezd a felhasználónak, hogy a jelentés el lett utasítva és miért.',
    buttonText: 'Elutasítás',
    buttonClass: 'bg-red-600 hover:bg-red-700',
    defaultMessage: 'Köszönjük a jelentésedet. Sajnos ez a jelentés nem igényel további intézkedést.'
  }
};

export const AdminReportActionDialog = ({ 
  open, 
  onOpenChange, 
  reportId, 
  reporterId,
  actionType,
  onSuccess 
}: AdminReportActionDialogProps) => {
  const [message, setMessage] = useState(actionConfig[actionType].defaultMessage);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Az üzenet mező kötelező!');
      return;
    }

    if (message.length < 10) {
      toast.error('Az üzenet túl rövid (minimum 10 karakter)!');
      return;
    }

    if (message.length > 2000) {
      toast.error('Az üzenet túl hosszú (maximum 2000 karakter)!');
      return;
    }

    setSubmitting(true);

    try {
      console.log('[AdminAction] Sending notification:', {
        reportId,
        reporterId,
        actionType,
        messageLength: message.length
      });

      const { data, error } = await supabase.functions.invoke('admin-send-report-notification', {
        body: {
          reporterId,
          message: message.trim(),
          reportId,
          newStatus: actionType
        }
      });

      if (error) {
        console.error('[AdminAction] Error:', error);
        throw error;
      }

      console.log('[AdminAction] Success:', data);

      const actionLabel = {
        reviewing: 'folyamatba helyezve',
        resolved: 'megoldva',
        dismissed: 'elutasítva'
      }[actionType];

      toast.success(`Jelentés ${actionLabel}, és a felhasználó értesítést kapott!`);
      onOpenChange(false);
      onSuccess();
      setMessage(actionConfig[actionType].defaultMessage);
    } catch (error: any) {
      console.error('[AdminAction] Fatal error:', error);
      toast.error(`Hiba: ${error.message || 'Ismeretlen hiba történt'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const config = actionConfig[actionType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-purple-900 to-purple-950 border-2 border-yellow-500/50 text-white z-[9999] p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-black text-yellow-400">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-sm text-white mb-2 block">
              Üzenet a felhasználónak
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Írd meg az üzenetet a felhasználónak..."
              className="min-h-[120px] bg-gray-800 border-purple-500/50 text-white text-sm resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-white/50 mt-1">
              {message.length} / 2000 karakter
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 text-white font-bold h-9 text-sm ${config.buttonClass}`}
            >
              {submitting ? 'Küldés...' : config.buttonText}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              variant="outline"
              className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white h-9 text-sm"
            >
              Mégse
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
