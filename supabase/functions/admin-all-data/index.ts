import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check using ANON key first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user with anon key
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[AdminAllData] Auth failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: hasAdminRole } = await anonClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      console.error('[AdminAllData] User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AdminAllData] Admin verified, fetching all data with service role...');

    // Now use SERVICE ROLE to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all users
    const { data: users, error: usersError } = await serviceClient
      .from('profiles')
      .select('id, username, email, lives, max_lives, coins, total_correct_answers, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('[AdminAllData] Users error:', usersError);
    }

    // Fetch user roles
    const userIds = users?.map(u => u.id) || [];
    const { data: rolesData } = await serviceClient
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    // Fetch all purchases
    const { data: purchases, error: purchasesError } = await serviceClient
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (purchasesError) {
      console.error('[AdminAllData] Purchases error:', purchasesError);
    }

    // Fetch user profiles for purchases (manual join)
    const purchaseUserIds = [...new Set(purchases?.map(p => p.user_id) || [])];
    const { data: purchaseProfiles } = await serviceClient
      .from('profiles')
      .select('id, username, email')
      .in('id', purchaseUserIds);

    const profileMap = new Map(purchaseProfiles?.map(p => [p.id, p]) || []);
    const purchasesWithProfiles = purchases?.map(p => ({
      ...p,
      profiles: profileMap.get(p.user_id)
    })) || [];

    // Fetch all reports
    const { data: reports, error: reportsError } = await serviceClient
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('[AdminAllData] Reports error:', reportsError);
    }

    // Fetch profiles for reports (manual join)
    const reportUserIds = [...new Set([
      ...(reports?.map(r => r.reporter_id) || []),
      ...(reports?.filter(r => r.reported_user_id).map(r => r.reported_user_id) || [])
    ])];
    const { data: reportProfiles } = await serviceClient
      .from('profiles')
      .select('id, username, email')
      .in('id', reportUserIds);

    const reportProfileMap = new Map(reportProfiles?.map(p => [p.id, p]) || []);
    const reportsWithProfiles = reports?.map(r => ({
      ...r,
      reporter: reportProfileMap.get(r.reporter_id),
      reported_user: r.reported_user_id ? reportProfileMap.get(r.reported_user_id) : null
    })) || [];

    // Fetch ALL invitations
    const { data: invitations, error: invitationsError } = await serviceClient
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('[AdminAllData] Invitations error:', invitationsError);
    }

    console.log('[AdminAllData] Raw invitations from DB:', invitations?.length);

    // Fetch profiles for invitations (manual join)
    const invitationUserIds = [...new Set([
      ...(invitations?.map(i => i.inviter_id) || []),
      ...(invitations?.filter(i => i.invited_user_id).map(i => i.invited_user_id) || [])
    ])];
    const { data: invitationProfiles } = await serviceClient
      .from('profiles')
      .select('id, username, email, avatar_url')
      .in('id', invitationUserIds);

    const invitationProfileMap = new Map(invitationProfiles?.map(p => [p.id, p]) || []);
    const invitationsWithProfiles = invitations?.map(i => ({
      ...i,
      inviter: invitationProfileMap.get(i.inviter_id),
      invited: i.invited_user_id ? invitationProfileMap.get(i.invited_user_id) : null
    })) || [];

    console.log('[AdminAllData] Processed invitations:', invitationsWithProfiles.length);

    // Fetch genius count
    const { count: geniusCount } = await serviceClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_subscribed', true);

    return new Response(
      JSON.stringify({
        users: users || [],
        roles: rolesData || [],
        purchases: purchasesWithProfiles,
        reports: reportsWithProfiles,
        invitations: invitationsWithProfiles,
        geniusCount: geniusCount || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[AdminAllData] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
