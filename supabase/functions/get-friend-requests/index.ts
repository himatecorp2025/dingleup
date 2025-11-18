import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Auth verification with anon client
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseAuth = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for DB ops
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get URL params for filtering
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status') || 'pending'; // 'pending' | 'all'
    const scope = url.searchParams.get('scope') || 'all'; // 'incoming' | 'outgoing' | 'all'

    // Build query for received requests (where current user is NOT the requester)
    const { data: rawReceived, error: receivedError } = await supabaseClient
      .from('friendships')
      .select('id, requested_by, status, created_at, updated_at, user_id_a, user_id_b')
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .neq('requested_by', user.id)
      .eq('status', statusFilter === 'all' ? 'pending' : statusFilter)
      .order('created_at', { ascending: false })
      .limit(50);

    if (receivedError) {
      console.error('Error fetching received requests:', receivedError);
      return new Response(JSON.stringify({ error: 'Failed to fetch requests' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch requester profiles for each received request safely (no FK embedding)
    const mappedReceivedRequests = await Promise.all(
      (rawReceived || []).map(async (req: any) => {
        const requesterId = req.requested_by;
        const { data: requester } = await supabaseClient
          .from('public_profiles')
          .select('id, username, avatar_url')
          .eq('id', requesterId)
          .maybeSingle();
        return {
          id: req.id,
          requested_by: requesterId,
          status: req.status,
          created_at: req.created_at,
          updated_at: req.updated_at,
          requester: requester || { id: requesterId, username: 'Ismeretlen', avatar_url: null }
        };
      })
    );
    // Get requests sent by user
    let sentQuery = supabaseClient
      .from('friendships')
      .select(`
        id,
        user_id_a,
        user_id_b,
        status,
        created_at,
        updated_at
      `)
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .eq('requested_by', user.id);

    if (statusFilter !== 'all') {
      sentQuery = sentQuery.eq('status', statusFilter);
    }

    const { data: sentRequests, error: sentError } = await sentQuery
      .order('created_at', { ascending: false })
      .limit(50);

    if (sentError) {
      console.error('Error fetching sent requests:', sentError);
    }

    // Get profiles for sent requests
    const sentRequestsWithProfiles = await Promise.all(
      (sentRequests || []).map(async (req) => {
        const targetUserId = req.user_id_a === user.id ? req.user_id_b : req.user_id_a;
        // SECURITY: Use public_profiles view
        const { data: profile } = await supabaseClient
          .from('public_profiles')
          .select('id, username, avatar_url')
          .eq('id', targetUserId)
          .single();
        
        return {
          id: req.id,
          target_user: profile,
          status: req.status,
          created_at: req.created_at,
          updated_at: req.updated_at
        };
      })
    );

    return new Response(JSON.stringify({ 
      received: mappedReceivedRequests || [],
      sent: sentRequestsWithProfiles || []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-friend-requests:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
