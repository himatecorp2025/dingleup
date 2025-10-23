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
  report: {
    id: string;
    reporter_id: string;
    report_type: string;
    bug_category?: string;
    bug_description?: string;
    violation_type?: string;
    violation_description?: string;
    reported_user?: { username: string };
    reporter?: { username: string; email: string };
  };
  actionType: 'reviewing' | 'resolved' | 'dismissed';
  onSuccess: () => void;
}

const actionConfig = {
  reviewing: {
    title: 'Jelentés folyamatban',
    description: 'Jelezd a felhasználónak, hogy a jelentést folyamatban van vizsgálva.',
    buttonText: 'Folyamatba helyezés',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
    defaultMessage: 'Folyamatban van. Köszönjük a jelzésedet! A csapatunk vizsgálja az ügyet, és hamarosan válaszolunk.'
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
  report,
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

    // Ensure valid admin session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Lejárt admin munkamenet. Jelentkezz be újra az admin felületen.');
      return;
    }

    setSubmitting(true);

    try {
      console.log('[AdminAction] Sending notification:', {
        reportId: report.id,
        reporterId: report.reporter_id,
        actionType,
        messageLength: message.length
      });

      const { data, error } = await supabase.functions.invoke('admin-send-report-notification', {
        body: {
          reporterId: report.reporter_id,
          message: message.trim(),
          reportId: report.id,
          newStatus: actionType,
          reportDetails: {
            reportType: report.report_type,
            bugCategory: report.bug_category,
            bugDescription: report.bug_description,
            violationType: report.violation_type,
            violationDescription: report.violation_description,
            reportedUsername: report.reported_user?.username,
            reporterUsername: report.reporter?.username,
            reporterEmail: report.reporter?.email
          }
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
      const status = error?.status || error?.context?.status;
      const msg: string = error?.message || '';
      if (status === 401 || status === 403 || /authorization|token/i.test(msg)) {
        toast.error('Lejárt admin munkamenet. Jelentkezz be újra.');
      } else if (/function returned non-?2xx/i.test(msg)) {
        toast.error('Hiba történt a küldés közben. Próbáld újra.');
      } else {
        toast.error(`Hiba: ${msg || 'Ismeretlen hiba történt'}`);
      }
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
