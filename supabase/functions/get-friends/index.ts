import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
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
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user using anon client
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Use service role for DB operations (bypasses RLS safely)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Validate user ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all friendships where user is either user_id_a or user_id_b
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .eq('status', 'active');

    if (friendshipsError) {
      throw friendshipsError;
    }

    if (!friendships || friendships.length === 0) {
      return new Response(
        JSON.stringify({ friends: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract friend user IDs
    const friendIds = friendships.map(f => 
      f.user_id_a === user.id ? f.user_id_b : f.user_id_a
    );

    // SECURITY: Get friend profiles - use public_profiles view (NEM email, coins!)
    const { data: profiles, error: profilesError } = await supabase
      .from('public_profiles')
      .select('id, username, avatar_url')
      .in('id', friendIds);

    if (profilesError) {
      throw profilesError;
    }

    // Get DM threads and last messages
    const friendsData = await Promise.all(
      (profiles || []).map(async (profile) => {
        const normalizedIds = [user.id, profile.id].sort();
        
        // Get online status
        const { data: presenceData } = await supabase
          .from('user_presence')
          .select('is_online')
          .eq('user_id', profile.id)
          .maybeSingle();
        
        // Get thread
        const { data: thread } = await supabase
          .from('dm_threads')
          .select('id, last_message_at')
          .eq('user_id_a', normalizedIds[0])
          .eq('user_id_b', normalizedIds[1])
          .maybeSingle();

        if (!thread) {
          return {
            id: profile.id,
            display_name: profile.username,
            avatar_url: profile.avatar_url,
            last_message: null,
            last_message_at: null,
            unread_count: 0,
            is_online: presenceData?.is_online || false
          };
        }

        // Get last message
        const { data: lastMessage } = await supabase
          .from('dm_messages')
          .select('body, created_at')
          .eq('thread_id', thread.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { data: readData } = await supabase
          .from('message_reads')
          .select('last_read_at')
          .eq('thread_id', thread.id)
          .eq('user_id', user.id)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from('dm_messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .neq('sender_id', user.id)
          .eq('is_deleted', false)
          .gt('created_at', readData?.last_read_at || '1970-01-01');

        return {
          id: profile.id,
          display_name: profile.username,
          avatar_url: profile.avatar_url,
          last_message: lastMessage?.body?.substring(0, 50) || null,
          last_message_at: lastMessage?.created_at || thread.last_message_at,
          unread_count: unreadCount || 0,
          is_online: presenceData?.is_online || false
        };
      })
    );

    // Sort by last message time
    friendsData.sort((a, b) => {
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    return new Response(
      JSON.stringify({ friends: friendsData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
