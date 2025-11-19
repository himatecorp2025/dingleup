import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      toast.error('Érvénytelen fizetési session');
      navigate('/dashboard');
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-premium-booster-payment', {
          body: { sessionId }
        });

        if (error) throw error;

        if (data?.success) {
          setVerified(true);
          toast.success(`Sikeres vásárlás! +${data.grantedRewards?.gold} arany és +${data.grantedRewards?.lives} élet jóváírva. Most aktiválhatod a Premium Speed Boostert.`, { duration: 6000 });
          
          // Redirect to Dashboard after 2 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          throw new Error(data?.error || 'Fizetés ellenőrzése sikertelen');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        toast.error('Hiba történt a fizetés ellenőrzése során');
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
            <h2 className="text-2xl font-bold text-foreground">Fizetés ellenőrzése...</h2>
            <p className="text-muted-foreground">Kérlek várj, amíg megerősítjük a tranzakciót.</p>
          </>
        ) : verified ? (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-foreground">Sikeres vásárlás!</h2>
            <p className="text-muted-foreground">Átirányítás a Dashboard-ra...</p>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentSuccess;
