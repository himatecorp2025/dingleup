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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('[GetFriends] Fetching friends for user:', user.id);

    // SECURITY: Validate user ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      console.error('[GetFriends] Invalid user ID format');
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
      console.error('[GetFriends] Error fetching friendships:', friendshipsError);
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

    // Get friend profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', friendIds);

    if (profilesError) {
      console.error('[GetFriends] Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Get DM threads and last messages
    const friendsData = await Promise.all(
      (profiles || []).map(async (profile) => {
        const normalizedIds = [user.id, profile.id].sort();
        
        // Get thread
        const { data: thread } = await supabase
          .from('dm_threads')
          .select('id, last_message_at')
          .eq('user_id_a', normalizedIds[0])
          .eq('user_id_b', normalizedIds[1])
          .single();

        if (!thread) {
          return {
            userId: profile.id,
            displayName: profile.username,
            avatarUrl: profile.avatar_url,
            lastMessageSnippet: null,
            lastMessageAt: null,
            unreadCount: 0,
            onlineStatus: 'offline'
          };
        }

        // Get last message
        const { data: lastMessage } = await supabase
          .from('dm_messages')
          .select('body, created_at')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { data: readData } = await supabase
          .from('message_reads')
          .select('last_read_at')
          .eq('thread_id', thread.id)
          .eq('user_id', user.id)
          .single();

        const { count: unreadCount } = await supabase
          .from('dm_messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .gt('created_at', readData?.last_read_at || '1970-01-01');

        return {
          userId: profile.id,
          displayName: profile.username,
          avatarUrl: profile.avatar_url,
          lastMessageSnippet: lastMessage?.body?.substring(0, 50) || null,
          lastMessageAt: lastMessage?.created_at || thread.last_message_at,
          unreadCount: unreadCount || 0,
          onlineStatus: 'offline' // TODO: implement real presence
        };
      })
    );

    // Sort by last message time
    friendsData.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    console.log(`[GetFriends] Returning ${friendsData.length} friends`);

    return new Response(
      JSON.stringify({ friends: friendsData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[GetFriends] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
