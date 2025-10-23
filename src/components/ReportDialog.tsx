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
import { ImagePlus, X } from 'lucide-react';

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
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} nem kép fájl!`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} túl nagy (max 5MB)!`);
        return false;
      }
      return true;
    });

    if (screenshots.length + validFiles.length > 3) {
      toast.error('Maximum 3 képet tölthetsz fel!');
      return;
    }

    setScreenshots(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

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
      // SECURITY: Comprehensive input validation
      if (!description.trim()) {
        toast.error('A leírás mező kötelező!');
        return;
      }

      if (description.length < 10) {
        toast.error('A leírás túl rövid (minimum 10 karakter)!');
        return;
      }

      if (description.length > 2000) {
        toast.error('A leírás túl hosszú (maximum 2000 karakter)!');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Jelentkezz be a jelentés beküldéséhez!');
        return;
      }

      // SECURITY: Sanitize input to prevent XSS
      const sanitizedDescription = description
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();

      // Upload screenshots if any
      const screenshotUrls: string[] = [];
      if (screenshots.length > 0) {
        toast.info('Képek feltöltése...');
        
        for (let i = 0; i < screenshots.length; i++) {
          const file = screenshots[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${session.user.id}/${Date.now()}_${i}.${fileExt}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('report-screenshots')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Screenshot upload error:', uploadError);
            toast.error(`Kép feltöltési hiba: ${file.name}`);
            continue;
          }

          // Store only the path, not the full URL
          screenshotUrls.push(fileName);
        }
      }

      const reportData: any = {
        reporter_id: session.user.id,
        report_type: reportType,
        screenshot_urls: screenshotUrls,
      };

      if (reportType === 'bug') {
        reportData.bug_description = sanitizedDescription;
        reportData.bug_category = bugCategory;
      } else {
        reportData.violation_description = sanitizedDescription;
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
      setScreenshots([]);
      setScreenshotPreviews([]);
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Hiba történt a jelentés küldésekor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-purple-900 to-purple-950 border-2 border-yellow-500/50 text-white z-[9999] p-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-black text-yellow-400">
            Jelentés beküldése
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            Segíts nekünk javítani az alkalmazást vagy jelents vissza sértő viselkedést!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Jelentés típusa</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as 'bug' | 'user_behavior')}>
              <SelectTrigger className="bg-gray-800 border-purple-500/50 h-9">
                <SelectValue placeholder="Válassz típust" />
              </SelectTrigger>
              <SelectContent className="z-[10001] bg-gray-900 border border-yellow-500/40 text-white">
                <SelectItem value="bug">🐛 Fejlesztői jelentés (Bug, hiba)</SelectItem>
                <SelectItem value="user_behavior">⚠️ Felhasználói jelentés (Visszaélés)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'bug' ? (
            <div className="space-y-2">
              <div>
                <Label className="text-sm">Hiba kategória</Label>
                <Select value={bugCategory} onValueChange={setBugCategory}>
                  <SelectTrigger className="bg-gray-800 border-purple-500/50 h-9">
                    <SelectValue placeholder="Válassz kategóriát" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001] bg-gray-900 border border-yellow-500/40 text-white">
                    {DEV_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Hiba leírása</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Írd le részletesen, mit tapasztaltál..."
                  className="min-h-[80px] bg-gray-800 border-purple-500/50 text-white text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <Label className="text-sm">Visszaélés típusa</Label>
                <Select value={violationType} onValueChange={setViolationType}>
                  <SelectTrigger className="bg-gray-800 border-purple-500/50 h-9">
                    <SelectValue placeholder="Válassz típust" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001] bg-gray-900 border border-yellow-500/40 text-white">
                    {SUPPORT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Részletek</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Írd le, mi történt..."
                  className="min-h-[80px] bg-gray-800 border-purple-500/50 text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Screenshot Upload Section */}
          <div>
            <Label className="text-sm">Képernyőképek (opcionális, max 3 kép)</Label>
            <div className="space-y-2 mt-1">
              {screenshotPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {screenshotPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={preview} 
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-purple-500/30"
                      />
                      <button
                        onClick={() => removeScreenshot(index)}
                        className="absolute top-1 right-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {screenshots.length < 3 && (
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 border border-purple-500/50 rounded cursor-pointer hover:bg-gray-700 transition-colors">
                  <ImagePlus className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white">Kép hozzáadása</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleScreenshotSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-800 text-black font-bold h-9 text-sm"
          >
            {submitting ? 'Küldés...' : 'Jelentés beküldése'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}