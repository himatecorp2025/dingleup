import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
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

    const authHeader = req.headers.get('Authorization') || '';
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (query.length < 2) {
      return new Response(JSON.stringify({ 
        friends: [], 
        threads: [], 
        messages: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store, no-cache' },
      });
    }

    // FRIENDS SEARCH - active friendships only
    const { data: friendsData } = await supabaseClient.rpc('search_users_by_name', {
      search_query: query,
      max_results: limit
    });

    // Filter to only include active friends
    const { data: friendships } = await supabaseClient
      .from('friendships')
      .select('user_id_a, user_id_b')
      .eq('status', 'active')
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`);

    const friendIds = new Set(
      (friendships || []).map(f => 
        f.user_id_a === user.id ? f.user_id_b : f.user_id_a
      )
    );

    const friends = (friendsData || [])
      .filter((u: any) => friendIds.has(u.id))
      .map((u: any) => ({
        id: u.id,
        name: u.username,
        avatarUrl: u.avatar_url,
        online: u.is_online || false
      }));

    // THREADS SEARCH - user's threads with partner names + last message
    const { data: userThreads } = await supabaseClient
      .from('dm_threads')
      .select('id, user_id_a, user_id_b, last_message_at')
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
      .limit(50);

    const threadsWithDetails = await Promise.all(
      (userThreads || []).map(async (thread: any) => {
        const partnerId = thread.user_id_a === user.id ? thread.user_id_b : thread.user_id_a;
        
        const { data: partner } = await supabaseClient
          .from('public_profiles')
          .select('username, avatar_url')
          .eq('id', partnerId)
          .single();

        const { data: lastMessage } = await supabaseClient
          .from('dm_messages')
          .select('body')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          threadId: thread.id,
          partnerId,
          partnerName: partner?.username || 'Ismeretlen',
          partnerAvatar: partner?.avatar_url,
          lastMessageSnippet: lastMessage?.body || '',
          lastAt: thread.last_message_at
        };
      })
    );

    const threads = threadsWithDetails.filter(t => 
      t.partnerName.toLowerCase().includes(query.toLowerCase()) ||
      t.lastMessageSnippet.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    // MESSAGES SEARCH - full-text in user's threads
    const threadIds = (userThreads || []).map((t: any) => t.id);
    
    let messages: any[] = [];
    if (threadIds.length > 0) {
      const { data: messagesData } = await supabaseClient
        .from('dm_messages')
        .select('id, thread_id, body, created_at, sender_id')
        .in('thread_id', threadIds)
        .ilike('body', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      messages = await Promise.all(
        (messagesData || []).map(async (msg: any) => {
          const thread = threadsWithDetails.find(t => t.threadId === msg.thread_id);
          return {
            threadId: msg.thread_id,
            messageId: msg.id,
            excerpt: msg.body.substring(0, 100) + (msg.body.length > 100 ? '...' : ''),
            at: msg.created_at,
            partnerName: thread?.partnerName || 'Ismeretlen',
            isSentByMe: msg.sender_id === user.id
          };
        })
      );
    }

    console.log(`Unified search for "${query}": ${friends.length} friends, ${threads.length} threads, ${messages.length} messages`);

    return new Response(JSON.stringify({ 
      friends, 
      threads, 
      messages 
    }), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      },
    });

  } catch (error) {
    console.error('Error in unified-search:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      friends: [], 
      threads: [], 
      messages: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
