import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/i18n';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast.error(t('payment.error.invalid_session'));
      navigate('/dashboard');
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t('payment.error.not_logged_in'));
          navigate('/dashboard');
          return;
        }
        
        const { data, error } = await supabase.functions.invoke('verify-premium-booster-payment', {
          body: { sessionId },
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error) throw error;

        if (data?.success) {
          setVerified(true);
          const successMsg = `${t('payment.success.rewards_prefix')} +${data.grantedRewards?.gold} ${t('payment.success.gold')} ${t('payment.success.and')} +${data.grantedRewards?.lives} ${t('payment.success.lives')} ${t('payment.success.rewards_suffix')}`;
          toast.success(successMsg, { duration: 6000 });
          
          // Redirect to Dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Sikertelen vásárlás - egységes hibaüzenet
          toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
          // Visszairányítás Dashboard-ra 1.5 másodperc után
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        // Egységes hibaüzenet sikertelen vásárlás esetén
        toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
        // Visszairányítás Dashboard-ra 1.5 másodperc után
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      <div className="text-center space-y-6 p-8">
        {verifying ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold text-foreground">{t('payment.verifying.title')}</h2>
            <p className="text-muted-foreground">{t('payment.verifying.description')}</p>
          </>
        ) : verified ? (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-foreground">{t('payment.success.title')}</h2>
            <p className="text-muted-foreground">{t('payment.success.redirecting')}</p>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentSuccess;