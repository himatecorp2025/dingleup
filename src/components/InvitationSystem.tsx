import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UserPlus, Copy, Check, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationSystemProps {
  userId: string;
  invitationCode: string;
}

interface Invitation {
  id: string;
  invited_email: string;
  accepted: boolean;
  accepted_at: string | null;
}

const InvitationSystem = ({ userId, invitationCode }: InvitationSystemProps) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false });

    if (data) setInvitations(data);
  };

  const sendInvitation = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      toast.error('Kérlek adj meg egy email címet');
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Érvénytelen email formátum');
      return;
    }

    if (trimmedEmail.length > 255) {
      toast.error('Az email cím túl hosszú');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase
      .from('invitations')
      .insert({
        inviter_id: userId,
        invited_email: trimmedEmail,
        invitation_code: invitationCode
      });

    if (error) {
      toast.error('Hiba történt a meghívó küldésekor');
    } else {
      toast.success('Meghívó elküldve!');
      setEmail('');
      fetchInvitations();
    }
    setLoading(false);
  };

  const copyInvitationLink = () => {
    const link = `${window.location.origin}/register?code=${invitationCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Meghívó link másolva!');
  };

  const copyInvitationCode = () => {
    navigator.clipboard.writeText(invitationCode);
    toast.success('Meghívó kód másolva!');
  };

  const acceptedCount = invitations.filter(i => i.accepted).length;
  const totalReward = acceptedCount * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-primary" />
          Barátok meghívása
        </CardTitle>
        <CardDescription>
          Hívj meg barátokat és szerezz 100 aranyérmét minden elfogadott meghívóért!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-accent/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">Elfogadott meghívók</p>
            <p className="text-2xl font-bold text-primary">{acceptedCount}</p>
          </div>
          <div className="bg-accent/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">Összesen szerzett</p>
            <p className="text-2xl font-bold text-primary">{totalReward} 🪙</p>
          </div>
        </div>

        {/* Invitation code and link */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Meghívó kódod</label>
            <div className="flex gap-2">
              <Input
                value={invitationCode}
                readOnly
                className="font-mono font-bold"
              />
              <Button onClick={copyInvitationCode} variant="outline" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Meghívó link</label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/register?code=${invitationCode}`}
                readOnly
                className="text-xs"
              />
              <Button onClick={copyInvitationLink} variant="outline" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Send invitation */}
        <div>
          <label className="text-sm font-medium mb-2 block">Meghívó küldése email-ben</label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@pelda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={sendInvitation} disabled={loading || !email}>
              <UserPlus className="w-4 h-4 mr-2" />
              Küldés
            </Button>
          </div>
        </div>

        {/* Invitation list */}
        {invitations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Meghívóid</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{inv.invited_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.accepted ? `Elfogadva: ${new Date(inv.accepted_at!).toLocaleDateString()}` : 'Függőben'}
                    </p>
                  </div>
                  {inv.accepted && (
                    <Gift className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvitationSystem;
