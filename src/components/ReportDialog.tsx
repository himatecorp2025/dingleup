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
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-purple-900 to-purple-950 border-2 border-yellow-500/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-yellow-400">
            Jelentés beküldése
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Segíts nekünk javítani az alkalmazást vagy jelents vissza sértő viselkedést!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reportType} onValueChange={(v) => setReportType(v as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bug" id="bug" />
              <Label htmlFor="bug" className="cursor-pointer">
                🐛 Fejlesztői jelentés (Bug, hiba)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user_behavior" id="user_behavior" />
              <Label htmlFor="user_behavior" className="cursor-pointer">
                ⚠️ Felhasználói jelentés (Visszaélés)
              </Label>
            </div>
          </RadioGroup>

          {reportType === 'bug' ? (
            <div className="space-y-3">
              <div>
                <Label>Hiba kategória</Label>
                <Select value={bugCategory} onValueChange={setBugCategory}>
                  <SelectTrigger className="bg-gray-800 border-purple-500/50">
                    <SelectValue placeholder="Válassz kategóriát" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functionality">Működési hiba</SelectItem>
                    <SelectItem value="ui">Megjelenítési probléma</SelectItem>
                    <SelectItem value="performance">Teljesítmény</SelectItem>
                    <SelectItem value="other">Egyéb</SelectItem>
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
                  <SelectContent>
                    <SelectItem value="discrimination">
                      Diszkrimináció (vallás, etnikai, nemi)
                    </SelectItem>
                    <SelectItem value="harassment">Zaklatás</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="other">Egyéb</SelectItem>
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
};
