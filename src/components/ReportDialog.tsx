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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedMessageId?: string;
}

// Development categories
const DEV_CATEGORIES = [
  { value: 'crash', label: 'Összeomlás / Crash' },
  { value: 'ui_bug', label: 'UI/Design hiba' },
  { value: 'functionality', label: 'Funkcionalitás hiba' },
  { value: 'performance', label: 'Teljesítmény probléma' },
  { value: 'data_loss', label: 'Adatvesztés' },
  { value: 'other', label: 'Egyéb' },
];

// Support categories
const SUPPORT_CATEGORIES = [
  { value: 'harassment', label: 'Zaklatás' },
  { value: 'spam', label: 'Spam / Reklám' },
  { value: 'inappropriate', label: 'Nem megfelelő tartalom' },
  { value: 'hate_speech', label: 'Gyűlöletbeszéd' },
  { value: 'impersonation', label: 'Személyazonosság visszaélés' },
  { value: 'discrimination', label: 'Diszkrimináció' },
  { value: 'other', label: 'Egyéb' },
];

export const ReportDialog = ({ open, onOpenChange, reportedUserId, reportedMessageId }: ReportDialogProps) => {
  const [reportType, setReportType] = useState<'bug' | 'user_behavior'>('bug');
  const [bugCategory, setBugCategory] = useState<string>('');
  const [violationType, setViolationType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Kérlek, add meg a jelentés részleteit!');
      return;
    }

    if (reportType === 'bug' && !bugCategory) {
      toast.error('Kérlek, válassz kategóriát!');
      return;
    }

    if (reportType === 'user_behavior' && !violationType) {
      toast.error('Kérlek, válassz kategóriát!');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Jelentkezz be a jelentés beküldéséhez!');
        return;
      }

      const reportData: any = {
        reporter_id: session.user.id,
        report_type: reportType,
      };

      if (reportType === 'bug') {
        reportData.bug_description = description;
        reportData.bug_category = bugCategory;
      } else {
        reportData.violation_description = description;
        reportData.violation_type = violationType;
        if (reportedUserId) reportData.reported_user_id = reportedUserId;
        if (reportedMessageId) reportData.reported_message_id = reportedMessageId;
      }

      const { error } = await supabase.from('reports').insert(reportData);

      if (error) throw error;

      toast.success('Jelentés sikeresen elküldve! Köszönjük!');
      onOpenChange(false);
      setDescription('');
      setBugCategory('');
      setViolationType('');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Hiba történt a jelentés küldésekor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-purple-900 to-purple-950 border-2 border-yellow-500/50 text-white z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-yellow-400">
            Jelentés beküldése
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Segíts nekünk javítani az alkalmazást vagy jelents vissza sértő viselkedést!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Jelentés típusa</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as 'bug' | 'user_behavior')}>
              <SelectTrigger className="bg-gray-800 border-purple-500/50">
                <SelectValue placeholder="Válassz típust" />
              </SelectTrigger>
              <SelectContent className="z-[1000] bg-gray-900 border border-yellow-500/40 text-white">
                <SelectItem value="bug">🐛 Fejlesztői jelentés (Bug, hiba)</SelectItem>
                <SelectItem value="user_behavior">⚠️ Felhasználói jelentés (Visszaélés)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'bug' ? (
            <div className="space-y-3">
              <div>
                <Label>Hiba kategória</Label>
                <Select value={bugCategory} onValueChange={setBugCategory}>
                  <SelectTrigger className="bg-gray-800 border-purple-500/50">
                    <SelectValue placeholder="Válassz kategóriát" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000] bg-gray-900 border border-yellow-500/40 text-white">
                    {DEV_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hiba leírása</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Írd le részletesen, mit tapasztaltál..."
                  className="min-h-[120px] bg-gray-800 border-purple-500/50 text-white"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Visszaélés típusa</Label>
                <Select value={violationType} onValueChange={setViolationType}>
                  <SelectTrigger className="bg-gray-800 border-purple-500/50">
                    <SelectValue placeholder="Válassz típust" />
                  </SelectTrigger>
                  <SelectContent className="z-[1000] bg-gray-900 border border-yellow-500/40 text-white">
                    {SUPPORT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Részletek</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Írd le, mi történt..."
                  className="min-h-[120px] bg-gray-800 border-purple-500/50 text-white"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-800 text-black font-bold"
          >
            {submitting ? 'Küldés...' : 'Jelentés beküldése'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}