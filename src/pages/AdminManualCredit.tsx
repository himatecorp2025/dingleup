import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Coins, Heart, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminManualCredit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userId, setUserId] = useState('');
  const [goldAmount, setGoldAmount] = useState('0');
  const [livesAmount, setLivesAmount] = useState('0');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const gold = parseInt(goldAmount);
    const lives = parseInt(livesAmount);
    
    if (!userId.trim()) {
      toast({
        title: 'Error',
        description: 'User ID is required',
        variant: 'destructive',
        duration: 4000,
      });
      return;
    }
    
    if (gold === 0 && lives === 0) {
      toast({
        title: 'Error',
        description: 'At least one of Gold or Lives must be non-zero',
        variant: 'destructive',
        duration: 4000,
      });
      return;
    }
    
    if (!reason.trim()) {
      toast({
        title: 'Error',
        description: 'Reason is required',
        variant: 'destructive',
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-manual-credit', {
        body: {
          targetUserId: userId.trim(),
          deltaGold: gold,
          deltaLives: lives,
          reason: reason.trim(),
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Success',
        description: `Manual credit applied successfully`,
        duration: 3000,
      });

      // Reset form
      setUserId('');
      setGoldAmount('0');
      setLivesAmount('0');
      setReason('');
      
    } catch (error) {
      console.error('Manual credit error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to apply manual credit',
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-[clamp(1rem,3vw,1.5rem)] max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-[clamp(0.75rem,2vw,1rem)]"
        >
          <ArrowLeft className="mr-[clamp(0.25rem,1vw,0.5rem)] h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)]" />
          Back to Dashboard
        </Button>

        <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-bold mb-[clamp(1rem,3vw,1.5rem)]">Manual Credit</h1>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Rate Limit:</strong> Maximum 10 manual credits per hour per admin user.
            All credits are logged in the audit trail.
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userId">Target User ID *</Label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter user UUID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goldAmount" className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  Gold Amount
                </Label>
                <Input
                  id="goldAmount"
                  type="number"
                  placeholder="0"
                  value={goldAmount}
                  onChange={(e) => setGoldAmount(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="livesAmount" className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Lives Amount
                </Label>
                <Input
                  id="livesAmount"
                  type="number"
                  placeholder="0"
                  value={livesAmount}
                  onChange={(e) => setLivesAmount(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for manual credit (e.g., compensation, bug fix, event reward)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Processing...' : 'Apply Manual Credit'}
            </Button>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminManualCredit;
