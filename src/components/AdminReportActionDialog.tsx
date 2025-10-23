import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

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

// Előre definiált problématípusok listája (megoldva esetén)
const PROBLEM_TYPES = [
  '🎮 Játék összeomlás / nem indul',
  '❓ Kérdés nem jelenik meg helyesen',
  '✅ Helyes válasz helytelennek jelölve',
  '❌ Helytelen válasz helyesnek jelölve',
  '⏱️ Időzítő hiba / nem működik',
  '💰 Érme/élet nem lett jóváírva',
  '🚀 Booster nem aktiválódott',
  '🎁 Ajándék/jutalom nem érkezett meg',
  '💬 Chat üzenet nem küldhető',
  '📸 Kép/média feltöltési hiba',
  '👥 Barát hozzáadási probléma',
  '🏆 Ranglista nem frissül',
  '💳 Fizetési hiba',
  '🔐 Bejelentkezési probléma',
  '📱 Mobil megjelenítési hiba',
  '🐛 Egyéb technikai hiba',
  '⚡ Teljesítmény probléma / lassú',
  '🔄 Szinkronizálási hiba'
];

// Előre definiált elutasítási okok listája
const DISMISSAL_REASONS = [
  // Development (bug) elutasítási okok
  '✅ Nem reprodukálható - nem sikerült újra előidézni',
  '📱 Eszköz specifikus - csak bizonyos eszközökön fordul elő',
  '🌐 Böngésző specifikus - használj másik böngészőt',
  '🔄 Már javítva - a legújabb verzióban megoldva',
  '⚙️ Helyes működés - ez így van tervezve',
  '📋 Duplikált bejelentés - már jelentették',
  '🔧 Felhasználói hiba - nem megfelelő használat',
  '📶 Internetkapcsolat probléma - nem az app hibája',
  '💾 Eszköz tárhely probléma - nincs elég hely',
  '🔋 Alacsony akkumulátor - energiatakarékos mód aktív',
  '📵 Elavult verzió - frissítsd az appot',
  '🔐 Engedélyek hiánya - add meg a szükséges jogokat',
  
  // Support (user behavior) elutasítási okok
  '✅ Nem sérti a szabályokat - normális viselkedés',
  '📝 Nincs elegendő bizonyíték - több részlet szükséges',
  '🤝 Félreértés - nem rosszhiszemű szándék',
  '💬 Kontextus hiányában nem értelmezhető',
  '👤 Védett beszélgetés - nem nyilvános tartalom',
  '⚖️ Nem tartozik az admin hatáskörbe',
  '🔄 Automatikus rendszerüzenet - nem felhasználótól',
  '😊 Viccből írt üzenet - nem komoly szándék',
  '🗣️ Nyelvi különbség - nem sértés, csak másképp fogalmazott',
  '🔒 Mindkét fél jóváhagyta - privát megállapodás'
];

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
  const [reasonType, setReasonType] = useState<string>('');
  const [customReasonType, setCustomReasonType] = useState<string>('');
  const [availableReasonTypes, setAvailableReasonTypes] = useState<string[]>(
    actionType === 'resolved' ? PROBLEM_TYPES : DISMISSAL_REASONS
  );

  // Reset fields when dialog opens
  useEffect(() => {
    if (open) {
      setMessage(actionConfig[actionType].defaultMessage);
      setReasonType('');
      setCustomReasonType('');
      setAvailableReasonTypes(actionType === 'resolved' ? PROBLEM_TYPES : DISMISSAL_REASONS);
    }
  }, [open, actionType]);

  const handleAddCustomReasonType = () => {
    if (customReasonType.trim() && !availableReasonTypes.includes(customReasonType.trim())) {
      const newType = customReasonType.trim();
      setAvailableReasonTypes([...availableReasonTypes, newType]);
      setReasonType(newType);
      setCustomReasonType('');
      toast.success(actionType === 'resolved' ? 'Új problématípus hozzáadva!' : 'Új elutasítási ok hozzáadva!');
    }
  };

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

    if ((actionType === 'resolved' || actionType === 'dismissed') && !reasonType) {
      toast.error(actionType === 'resolved' 
        ? 'Kérlek válaszd ki a megoldott problématípust!' 
        : 'Kérlek válaszd ki az elutasítás okát!');
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
          reasonType: reasonType || null,
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
      setReasonType('');
      setCustomReasonType('');
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
            <Label className="text-base text-yellow-400 mb-2 block font-bold">
              ⚠️ Indoklás (KÖTELEZŐ) - Miért {actionType === 'reviewing' ? 'van folyamatban' : actionType === 'resolved' ? 'lett megoldva' : 'lett elutasítva'}?
            </Label>
            <p className="text-xs text-white/70 mb-2">
              Magyarázd el részletesen a döntésed okát. Ez az üzenet el lesz küldve a bejelentőnek.
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Pl.: ${
                actionType === 'reviewing' 
                  ? 'A hibát vizsgáljuk, a fejlesztői csapat 24 órán belül válaszol...' 
                  : actionType === 'resolved'
                  ? 'A hibát javítottuk a legújabb frissítésben. Köszönjük a jelzést!'
                  : 'Ez a bejelentés nem igényel intézkedést, mert...'
              }`}
              className="min-h-[140px] bg-gray-800 border-2 border-yellow-500/50 text-white text-sm resize-none focus:border-yellow-500"
              maxLength={2000}
              autoFocus
            />
            <p className="text-xs text-white/50 mt-1">
              {message.length} / 2000 karakter {message.length < 10 && message.length > 0 ? '(túl rövid, minimum 10 karakter)' : ''}
            </p>
          </div>

          {/* Reason Type Selector - For resolved and dismissed status */}
          {(actionType === 'resolved' || actionType === 'dismissed') && (
            <div>
              <Label className="text-base text-yellow-400 mb-2 block font-bold">
                ⚠️ {actionType === 'resolved' ? 'Megoldott probléma típusa' : 'Elutasítás oka'} (KÖTELEZŐ)
              </Label>
              <p className="text-xs text-white/70 mb-2">
                {actionType === 'resolved' 
                  ? 'Válaszd ki, milyen típusú problémát oldottál meg, vagy adj hozzá újat.'
                  : 'Válaszd ki az elutasítás okát, vagy adj hozzá újat.'}
              </p>
              <Select value={reasonType} onValueChange={setReasonType}>
                <SelectTrigger className="bg-gray-800 border-2 border-yellow-500/50 text-white focus:border-yellow-500">
                  <SelectValue placeholder={actionType === 'resolved' ? 'Válassz problématípust...' : 'Válassz elutasítási okot...'} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-yellow-500/50 text-white max-h-[300px] z-[10000]">
                  {availableReasonTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-gray-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Reason Type Input */}
              <div className="mt-3 p-3 bg-gray-900/50 border border-yellow-500/30 rounded-lg">
                <Label className="text-sm text-white/90 mb-2 block">
                  ➕ {actionType === 'resolved' ? 'Új problématípus hozzáadása' : 'Új elutasítási ok hozzáadása'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={customReasonType}
                    onChange={(e) => setCustomReasonType(e.target.value)}
                    placeholder={actionType === 'resolved' ? 'Írd be az új problématípust...' : 'Írd be az új elutasítási okot...'}
                    className="flex-1 bg-gray-800 border-purple-500/50 text-white text-sm"
                    maxLength={100}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomReasonType();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomReasonType}
                    disabled={!customReasonType.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap text-sm"
                  >
                    Hozzáad
                  </Button>
                </div>
              </div>
            </div>
          )}

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
