import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { useNavigate } from 'react-router-dom';

interface AgeGateModalProps {
  open: boolean;
  userId: string;
  onSuccess: () => void;
}

export const AgeGateModal = ({ open, userId, onSuccess }: AgeGateModalProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Generate year options (1940 - current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Calculate days in selected month/year
  const getDaysInMonth = (m: number | null, y: number | null) => {
    if (!m || !y) return 31;
    return new Date(y, m, 0).getDate();
  };
  
  const days = Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1);

  // Reset day if it's invalid for the new month/year
  useEffect(() => {
    if (day && month && year) {
      const maxDays = getDaysInMonth(month, year);
      if (day > maxDays) {
        setDay(maxDays);
      }
    }
  }, [month, year]);

  const validateAge = (dob: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSubmit = async () => {
    // Validation
    if (!year || !month || !day) {
      toast.error(t('ageGate.errorInvalidDate'));
      return;
    }

    if (!consent) {
      toast.error(t('ageGate.errorConsentRequired'));
      return;
    }

    // Create date object
    const dob = new Date(year, month - 1, day);
    
    // Check if date is valid
    if (isNaN(dob.getTime()) || 
        dob.getFullYear() !== year || 
        dob.getMonth() !== month - 1 || 
        dob.getDate() !== day) {
      toast.error(t('ageGate.errorInvalidDate'));
      return;
    }

    // Calculate age
    const age = validateAge(dob);

    if (age < 16) {
      toast.error(t('ageGate.errorUnderage'), {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 'bold',
        },
      });
      
      // Log out user and redirect
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/auth/choice');
      }, 3000);
      return;
    }

    // Submit to backend
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('ageGate.errorGeneric'));
        return;
      }

      const { data, error } = await supabase.functions.invoke('submit-dob', {
        body: {
          date_of_birth: dob.toISOString().split('T')[0], // YYYY-MM-DD
          age_consent: true,
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(t('ageGate.successMessage'), {
          duration: 3000,
        });
        onSuccess();
      } else {
        throw new Error(data?.error || t('ageGate.errorGeneric'));
      }
    } catch (error) {
      console.error('[AgeGateModal] Submit error:', error);
      toast.error(t('ageGate.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogContent 
        className="w-[90vw] mx-auto bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-2 border-yellow-400/30 shadow-2xl rounded-lg overflow-y-auto"
        style={{
          maxWidth: 'clamp(320px, 90vw, 450px)',
          height: 'clamp(400px, 70vh, 600px)',
          padding: 'clamp(1rem, 3vh, 1.5rem)',
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col py-4" style={{ gap: 'clamp(1rem, 3vh, 1.5rem)' }}>
          {/* Title */}
          <div className="text-center">
            <h2 className="font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-white to-yellow-400"
              style={{ fontSize: 'clamp(1.25rem, 3.5vh, 1.5rem)', marginBottom: 'clamp(0.5rem, 1vh, 0.5rem)' }}
            >
              {t('ageGate.title')}
            </h2>
            <p className="text-gray-300"
              style={{ fontSize: 'clamp(0.75rem, 1.6vh, 0.875rem)' }}
            >
              {t('ageGate.description')}
            </p>
          </div>

          {/* Date selectors */}
          <div className="grid grid-cols-3" style={{ gap: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
            {/* Year */}
            <div className="flex flex-col" style={{ gap: 'clamp(0.25rem, 1vh, 0.5rem)' }}>
              <label className="text-yellow-400 font-semibold"
                style={{ fontSize: 'clamp(0.7rem, 1.4vh, 0.75rem)' }}
              >
                {t('ageGate.yearLabel')}
              </label>
              <select
                value={year || ''}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-[#1a1a3e] border border-yellow-400/30 rounded text-white focus:outline-none focus:border-yellow-400"
                style={{
                  padding: 'clamp(0.25rem, 1vh, 0.5rem) clamp(0.25rem, 0.8vh, 0.5rem)',
                  fontSize: 'clamp(0.75rem, 1.5vh, 0.875rem)'
                }}
              >
                <option value="">-</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="flex flex-col" style={{ gap: 'clamp(0.25rem, 1vh, 0.5rem)' }}>
              <label className="text-yellow-400 font-semibold"
                style={{ fontSize: 'clamp(0.7rem, 1.4vh, 0.75rem)' }}
              >
                {t('ageGate.monthLabel')}
              </label>
              <select
                value={month || ''}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-[#1a1a3e] border border-yellow-400/30 rounded text-white focus:outline-none focus:border-yellow-400"
                style={{
                  padding: 'clamp(0.25rem, 1vh, 0.5rem) clamp(0.25rem, 0.8vh, 0.5rem)',
                  fontSize: 'clamp(0.75rem, 1.5vh, 0.875rem)'
                }}
              >
                <option value="">-</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Day */}
            <div className="flex flex-col" style={{ gap: 'clamp(0.25rem, 1vh, 0.5rem)' }}>
              <label className="text-yellow-400 font-semibold"
                style={{ fontSize: 'clamp(0.7rem, 1.4vh, 0.75rem)' }}
              >
                {t('ageGate.dayLabel')}
              </label>
              <select
                value={day || ''}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full bg-[#1a1a3e] border border-yellow-400/30 rounded text-white focus:outline-none focus:border-yellow-400"
                style={{
                  padding: 'clamp(0.25rem, 1vh, 0.5rem) clamp(0.25rem, 0.8vh, 0.5rem)',
                  fontSize: 'clamp(0.75rem, 1.5vh, 0.875rem)'
                }}
                disabled={!month || !year}
              >
                <option value="">-</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Consent checkbox */}
          <div className="flex items-start bg-[#1a1a3e] border border-yellow-400/20 rounded"
            style={{ gap: 'clamp(0.5rem, 1.5vh, 0.75rem)', padding: 'clamp(0.75rem, 2vh, 1rem)' }}
          >
            <Checkbox
              id="age-consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked as boolean)}
              className="mt-1"
            />
            <label
              htmlFor="age-consent"
              className="text-gray-200 leading-relaxed cursor-pointer"
              style={{ fontSize: 'clamp(0.7rem, 1.4vh, 0.75rem)' }}
            >
              {t('ageGate.consentLabel')}{' '}
              <a
                href="/aszf"
                target="_blank"
                className="text-yellow-400 underline hover:text-yellow-300"
              >
                {t('ageGate.termsLinkLabel')}
              </a>{' '}
              {t('common.and')}{' '}
              <a
                href="/adatkezeles"
                target="_blank"
                className="text-yellow-400 underline hover:text-yellow-300"
              >
                {t('ageGate.privacyLinkLabel')}
              </a>
              .
            </label>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!year || !month || !day || !consent || submitting}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold hover:from-yellow-500 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem)', fontSize: 'clamp(0.8rem, 1.8vh, 1rem)' }}
          >
            {submitting ? t('common.loading') : t('ageGate.submitButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};