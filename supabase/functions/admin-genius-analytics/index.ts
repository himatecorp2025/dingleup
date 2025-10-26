import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user and role with anon key
    const anon = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAdminRole } = await anon.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client to bypass RLS
    const service = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Fetch Genius profiles
    const { data: profiles, error: profilesError } = await service
      .from('profiles')
      .select('*')
      .eq('is_subscribed', true)
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        totalGenius: 0,
        totalRevenue: 0,
        averagePurchase: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        members: []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userIds = profiles.map((p: any) => p.id);

    // 2) Related datasets
    const [{ data: gameStats }, { data: purchases }, { data: invitations }, { data: friendships }, { data: messages }, { data: sessions }] = await Promise.all([
      service.from('game_results').select('user_id, completed, correct_answers, average_response_time').in('user_id', userIds),
      service.from('purchases').select('user_id, amount_usd, status').in('user_id', userIds).eq('status', 'completed'),
      service.from('invitations').select('inviter_id, accepted').in('inviter_id', userIds),
      service.from('friendships').select('user_id_a, user_id_b').or(`user_id_a.in.(${userIds.join(',')}),user_id_b.in.(${userIds.join(',')})`).eq('status', 'active'),
      service.from('dm_messages').select('sender_id').in('sender_id', userIds),
      service.from('app_session_events').select('user_id, session_duration_seconds, created_at').in('user_id', userIds),
    ]);

    // 3) Aggregate per member
    const members = profiles.map((profile: any) => {
      const userGameStats = (gameStats || []).filter((g: any) => g.user_id === profile.id);
      const userPurchases = (purchases || []).filter((p: any) => p.user_id === profile.id);
      const userInvitations = (invitations || []).filter((i: any) => i.inviter_id === profile.id);
      const userFriends = (friendships || []).filter((f: any) => f.user_id_a === profile.id || f.user_id_b === profile.id);
      const userMessages = (messages || []).filter((m: any) => m.sender_id === profile.id);
      const userSessions = (sessions || []).filter((s: any) => s.user_id === profile.id);

      const completedGames = userGameStats.filter((g: any) => g.completed);
      const totalGames = userGameStats.length;
      const totalCorrect = userGameStats.reduce((sum: number, g: any) => sum + (g.correct_answers || 0), 0);
      const avgResponseTime = userGameStats.length > 0
        ? userGameStats.reduce((sum: number, g: any) => sum + (Number(g.average_response_time) || 0), 0) / userGameStats.length
        : 0;

      const totalSpent = userPurchases.reduce((sum: number, p: any) => sum + (Number(p.amount_usd) || 0), 0);

      const invitationsSent = userInvitations.length;
      const invitationsAccepted = userInvitations.filter((i: any) => i.accepted).length;

      const lastSession = userSessions.length > 0
        ? [...userSessions].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;

      const avgSessionDuration = userSessions.length > 0
        ? userSessions.reduce((sum: number, s: any) => sum + (s.session_duration_seconds || 0), 0) / userSessions.length
        : 0;

      return {
        ...profile,
        total_games: totalGames,
        total_correct_answers: totalCorrect,
        win_rate: totalGames > 0 ? (completedGames.length / totalGames) * 100 : 0,
        avg_response_time: avgResponseTime,
        total_purchases: userPurchases.length,
        total_spent: totalSpent,
        invitations_sent: invitationsSent,
        invitations_accepted: invitationsAccepted,
        last_login: lastSession?.created_at || null,
        total_sessions: userSessions.length,
        avg_session_duration: avgSessionDuration,
        friends_count: userFriends.length,
        messages_sent: userMessages.length,
      };
    });

    const totalRevenue = members.reduce((sum: number, m: any) => sum + (m.total_spent || 0), 0);
    const totalPurchases = members.reduce((sum: number, m: any) => sum + (m.total_purchases || 0), 0);
    const activeSubscriptions = members.filter((m: any) => m.is_subscribed).length;

    return new Response(JSON.stringify({
      totalGenius: members.length,
      totalRevenue,
      averagePurchase: totalPurchases > 0 ? totalRevenue / totalPurchases : 0,
      activeSubscriptions,
      cancelledSubscriptions: members.length - activeSubscriptions,
      members,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[admin-genius-analytics] Fatal', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});