import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

const VERIFY_TIMEOUT_MS = 30000; // 30 seconds

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { t } = useI18n();
  const queryClient = useQueryClient();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast.error(t('payment.error.invalid_session'));
      navigate('/dashboard', { replace: true });
      return;
    }

    // OPTIMIZATION: Prefetch Dashboard data immediately for instant navigation
    const prefetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          // Prefetch wallet data
          queryClient.prefetchQuery({
            queryKey: ['wallet', session.user.id],
            queryFn: async () => {
              const { data } = await supabase.functions.invoke('get-wallet', {
                headers: { Authorization: `Bearer ${session.access_token}` }
              });
              return data;
            }
          });
          
          // Prefetch profile data
          queryClient.prefetchQuery({
            queryKey: ['profile', session.user.id],
            queryFn: async () => {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              return data;
            }
          });
        }
      } catch (err) {
        console.error('Prefetch error:', err);
        // Silent fail - prefetch is optimization, not critical
      }
    };
    
    prefetchDashboardData();

    const verifyPayment = async () => {
      setVerifying(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error(t('payment.error.not_logged_in'));
          navigate('/dashboard', { replace: true });
          return;
        }
        
        // SECURITY: 30-second timeout for verify API call
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), VERIFY_TIMEOUT_MS);
        });
        
        const verifyPromise = supabase.functions.invoke('verify-premium-booster-payment', {
          body: { sessionId },
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        
        const { data, error } = await Promise.race([
          verifyPromise,
          timeoutPromise
        ]) as any;

        if (error) throw error;

        if (data?.success) {
          setVerified(true);
          setError(null);
          const successMsg = `${t('payment.success.rewards_prefix')} +${data.grantedRewards?.gold} ${t('payment.success.gold')} ${t('payment.success.and')} +${data.grantedRewards?.lives} ${t('payment.success.lives')} ${t('payment.success.rewards_suffix')}`;
          toast.success(successMsg, { duration: 6000 });
          
          // OPTIMIZATION: Reduced redirect delay from 2s to 800ms (prefetch makes Dashboard instant)
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 800);
        } else {
          // Payment verification failed
          setError(t('payment.error.verification_failed'));
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        
        if (err.message === 'TIMEOUT') {
          setError(t('payment.error.timeout'));
          toast.error(t('payment.error.timeout_message'), { duration: 6000 });
        } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
          setError(t('payment.error.network'));
          toast.error(t('payment.error.network_message'), { duration: 6000 });
        } else {
          setError(t('payment.error.unknown'));
          toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
        }
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, t, queryClient]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      const verifyPayment = async () => {
        setVerifying(true);
        setError(null);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast.error(t('payment.error.not_logged_in'));
            navigate('/dashboard', { replace: true });
            return;
          }
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), VERIFY_TIMEOUT_MS);
          });
          
          const verifyPromise = supabase.functions.invoke('verify-premium-booster-payment', {
            body: { sessionId },
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          
          const { data, error } = await Promise.race([
            verifyPromise,
            timeoutPromise
          ]) as any;

          if (error) throw error;

          if (data?.success) {
            setVerified(true);
            setError(null);
            const successMsg = `${t('payment.success.rewards_prefix')} +${data.grantedRewards?.gold} ${t('payment.success.gold')} ${t('payment.success.and')} +${data.grantedRewards?.lives} ${t('payment.success.lives')} ${t('payment.success.rewards_suffix')}`;
            toast.success(successMsg, { duration: 6000 });
            
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 800);
          } else {
            setError(t('payment.error.verification_failed'));
          }
        } catch (err: any) {
          console.error('Payment verification error:', err);
          
          if (err.message === 'TIMEOUT') {
            setError(t('payment.error.timeout'));
            toast.error(t('payment.error.timeout_message'), { duration: 6000 });
          } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
            setError(t('payment.error.network'));
            toast.error(t('payment.error.network_message'), { duration: 6000 });
          } else {
            setError(t('payment.error.unknown'));
            toast.error(t('payment.error.purchase_failed'), { duration: 4000 });
          }
        } finally {
          setVerifying(false);
        }
      };

      verifyPayment();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
      <div className="text-center space-y-6 p-8 max-w-md">
        {verifying ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold text-foreground">{t('payment.verifying.title')}</h2>
            <p className="text-muted-foreground">{t('payment.verifying.description')}</p>
            {retryCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('payment.retry_attempt')} {retryCount}
              </p>
            )}
          </>
        ) : verified ? (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-foreground">{t('payment.success.title')}</h2>
            <p className="text-muted-foreground">{t('payment.success.redirecting')}</p>
          </>
        ) : error ? (
          <>
            <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold text-foreground">{t('payment.error.title')}</h2>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={handleRetry}
                variant="default"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('payment.retry_button')}
              </Button>
              <Button
                onClick={() => navigate('/dashboard', { replace: true })}
                variant="outline"
                className="w-full"
              >
                {t('payment.back_to_dashboard')}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentSuccess;