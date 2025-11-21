import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface AgeGateModalProps {
  onSuccess: () => void;
}

export const AgeGateModal = ({ onSuccess }: AgeGateModalProps) => {
  const { t } = useI18n();
  
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr = [];
    for (let year = currentYear; year >= 1940; year--) {
      arr.push(year);
    }
    return arr;
  }, [currentYear]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnderage, setIsUnderage] = useState(false);

  const daysInMonth = useMemo(() => {
    if (!selectedYear || !selectedMonth) return 31;
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const isValid = selectedYear !== null && selectedMonth !== null && selectedDay !== null && consentChecked;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const dateOfBirth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: t('common.error'),
          description: t('auth.ageGate.errorNoSession'),
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('verify-age', {
        body: {
          date_of_birth: dateOfBirth,
          consent_checked: consentChecked,
        },
      });

      if (error) {
        console.error('[AgeGateModal] Verification error:', error);
        
        if (error.message?.includes('underage')) {
          setIsUnderage(true);
          toast({
            title: t('auth.ageGate.errorUnderage'),
            description: t('auth.ageGate.underageMessage'),
            variant: 'destructive',
            duration: 10000,
          });
        } else if (error.message?.includes('consent_required')) {
          toast({
            title: t('common.error'),
            description: t('auth.ageGate.errorConsentRequired'),
            variant: 'destructive',
          });
        } else if (error.message?.includes('invalid_dob')) {
          toast({
            title: t('common.error'),
            description: t('auth.ageGate.errorInvalidDob'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('common.error'),
            description: t('auth.ageGate.errorGeneric'),
            variant: 'destructive',
          });
        }
        return;
      }

      if (data?.success) {
        toast({
          title: t('common.success'),
          description: t('auth.ageGate.successMessage'),
        });
        onSuccess();
      }
    } catch (err) {
      console.error('[AgeGateModal] Unexpected error:', err);
      toast({
        title: t('common.error'),
        description: t('auth.ageGate.errorUnexpected'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (isUnderage) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">{t('auth.ageGate.errorUnderage')}</h2>
          <p className="text-muted-foreground">{t('auth.ageGate.underageMessage')}</p>
          <Button onClick={handleExit} variant="destructive" className="w-full">
            {t('auth.ageGate.exitButton')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full my-8">
        <h2 className="text-2xl font-bold mb-4 text-center">{t('auth.ageGate.title')}</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {t('auth.ageGate.description')}
        </p>

        <div className="space-y-4 mb-6">
          {/* Date pickers */}
          <div className="grid grid-cols-3 gap-2">
            {/* Year */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">{t('auth.ageGate.yearLabel')}</label>
...
            </div>

            {/* Month */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">{t('auth.ageGate.monthLabel')}</label>
...
            </div>

            {/* Day */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">{t('auth.ageGate.dayLabel')}</label>
              <select
                value={selectedDay || ''}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full h-10 px-3 bg-background border border-border rounded-md text-sm"
                disabled={!selectedYear || !selectedMonth}
              >
                <option value="">-</option>
                {days.map(day => (
                  <option key={day} value={day}>{String(day).padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Consent checkbox */}
          <div className="flex items-start space-x-2 mt-6">
            <Checkbox
              id="consent"
              checked={consentChecked}
              onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
            />
            <label
              htmlFor="consent"
              className="text-xs text-muted-foreground leading-tight cursor-pointer"
            >
              {t('auth.ageGate.consentLabel')
                .replace('{terms}', '')
                .replace('{privacy}', '')}
              <Link to="/legal/aszf" className="text-primary hover:underline mx-1">
                {t('auth.ageGate.linkTerms')}
              </Link>
              {t('auth.ageGate.and')}
              <Link to="/legal/privacy" className="text-primary hover:underline mx-1">
                {t('auth.ageGate.linkPrivacy')}
              </Link>
              .
            </label>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? t('auth.ageGate.submitting') : t('auth.ageGate.submitButton')}
        </Button>
      </div>
    </div>
  );
};
