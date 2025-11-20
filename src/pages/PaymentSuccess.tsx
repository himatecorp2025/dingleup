import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast.error(t('payment.invalidSession'));
      navigate('/dashboard');
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t('payment.notLoggedIn'));
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
          toast.success(t('payment.successMessage', { gold: data.grantedRewards?.gold, lives: data.grantedRewards?.lives }), { duration: 6000 });
          
          // Redirect to Dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          throw new Error(data?.error || t('payment.verificationFailed'));
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        toast.error(t('payment.verificationError'));
        navigate('/dashboard');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      <div className="text-center space-y-6 p-8">
        {verifying ? (
          <>
          <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
          <h2 className="text-2xl font-bold text-foreground">{t('payment.verifying')}</h2>
          <p className="text-muted-foreground">{t('payment.pleaseWait')}</p>
          </>
        ) : verified ? (
          <>
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-bold text-foreground">{t('payment.success')}</h2>
          <p className="text-muted-foreground">{t('payment.redirecting')}</p>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentSuccess;
