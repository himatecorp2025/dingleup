import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('[GetThreads] Fetching threads for user:', user.id);

    // Get all threads where user is participant and not archived
    const { data: threads, error: threadsError } = await supabase
      .from('dm_threads')
      .select('id, user_id_a, user_id_b, last_message_at, archived_by_user_a, archived_by_user_b')
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (threadsError) {
      console.error('[GetThreads] Error fetching threads:', threadsError);
      throw threadsError;
    }

    console.log('[GetThreads] Found threads:', threads?.length);

    // Filter out archived threads for this user
    const activeThreads = (threads || []).filter(thread => {
      if (thread.user_id_a === user.id) {
        return !thread.archived_by_user_a;
      } else {
        return !thread.archived_by_user_b;
      }
    });

    // For each thread, get other user's profile, last message, and unread count
    const threadsWithData = await Promise.all(
      activeThreads.map(async (thread) => {
        const otherUserId = thread.user_id_a === user.id ? thread.user_id_b : thread.user_id_a;

        // SECURITY: Get other user's profile - use public_profiles view
        const { data: profile } = await supabase
          .from('public_profiles')
          .select('id, username, avatar_url')
          .eq('id', otherUserId)
          .single();

        // Get online status
        const { data: presence } = await supabase
          .from('user_presence')
          .select('is_online')
          .eq('user_id', otherUserId)
          .single();

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
        const { data: readStatus } = await supabase
          .from('message_reads')
          .select('last_read_at')
          .eq('thread_id', thread.id)
          .eq('user_id', user.id)
          .maybeSingle();

        let unreadCount = 0;
        if (readStatus?.last_read_at) {
          const { count } = await supabase
            .from('dm_messages')
            .select('id', { count: 'exact', head: true })
            .eq('thread_id', thread.id)
            .neq('sender_id', user.id)
            .eq('is_deleted', false)
            .gt('created_at', readStatus.last_read_at);
          
          unreadCount = count || 0;
        }

        return {
          id: thread.id,
          other_user_id: otherUserId,
          other_user_name: profile?.username || 'Unknown',
          other_user_avatar: profile?.avatar_url || null,
          last_message_preview: lastMessage?.body || null,
          last_message_at: lastMessage?.created_at || thread.last_message_at,
          unread_count: unreadCount,
          online_status: presence?.is_online ? 'online' : 'offline',
        };
      })
    );

    // Sort by last message time (most recent first)
    threadsWithData.sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });

    return new Response(
      JSON.stringify({ threads: threadsWithData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[GetThreads] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
