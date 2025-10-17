import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useDailyGift } from '@/hooks/useDailyGift';
import { Button } from '@/components/ui/button';
import { Heart, Coins, Gift, ArrowLeft, Play } from 'lucide-react';
import DailyGiftDialog from '@/components/DailyGiftDialog';
import WeeklyRankings from '@/components/WeeklyRankings';
import InvitationSystem from '@/components/InvitationSystem';
import Shop from '@/components/Shop';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading } = useGameProfile(userId);
  const { canClaim, currentStreak, nextReward, claimDailyGift, checkDailyGift } = useDailyGift(userId);
  const [showDailyGift, setShowDailyGift] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (canClaim) {
      setShowDailyGift(true);
    }
  }, [canClaim]);

  const handleClaimDailyGift = async () => {
    await claimDailyGift();
    await checkDailyGift();
    setShowDailyGift(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Betöltés...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Hiba a profil betöltésekor</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => navigate('/')} variant="ghost">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Főoldal
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold">{profile.lives}/{profile.max_lives}</span>
            </div>
            <div className="bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-bold">{profile.coins}</span>
            </div>
          </div>
        </div>

        {/* Welcome */}
        <div className="bg-gradient-card rounded-2xl p-8 mb-6 text-center border border-border/50">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-gold">
            Üdv, {profile.username}!
          </h1>
          <p className="text-muted-foreground mb-4">
            Készen állsz a következő kihívásra?
          </p>
          <Button onClick={() => navigate('/game')} size="lg" className="gap-2">
            <Play className="w-5 h-5" />
            Játék indítása
          </Button>
        </div>

        {/* Main content */}
        <Tabs defaultValue="rankings" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="rankings">
              <Gift className="w-4 h-4 mr-2" />
              Rangsor
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Meghívók
            </TabsTrigger>
            <TabsTrigger value="shop">
              Bolt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rankings">
            <WeeklyRankings />
          </TabsContent>

          <TabsContent value="invitations">
            <InvitationSystem 
              userId={userId!} 
              invitationCode={profile.invitation_code || ''} 
            />
          </TabsContent>

          <TabsContent value="shop">
            <Shop userId={userId!} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Daily gift dialog */}
      <DailyGiftDialog
        open={showDailyGift}
        onClose={() => setShowDailyGift(false)}
        onClaim={handleClaimDailyGift}
        currentStreak={currentStreak}
        nextReward={nextReward}
        canClaim={canClaim}
      />
    </div>
  );
};

export default Dashboard;
