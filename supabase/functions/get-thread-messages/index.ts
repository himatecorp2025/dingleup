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

    const url = new URL(req.url);
    const otherUserId = url.searchParams.get('otherUserId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const before = url.searchParams.get('before'); // cursor for pagination

    if (!otherUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing otherUserId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GetThreadMessages] Fetching messages for', user.id, '<->', otherUserId);

    // Get thread
    const normalizedIds = [user.id, otherUserId].sort();
    const { data: thread, error: threadError } = await supabase
      .from('dm_threads')
      .select('id')
      .eq('user_id_a', normalizedIds[0])
      .eq('user_id_b', normalizedIds[1])
      .single();

    if (threadError) {
      console.log('[GetThreadMessages] Thread not found, returning empty');
      return new Response(
        JSON.stringify({ messages: [], threadId: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get messages with pagination
    let query = supabase
      .from('dm_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('[GetThreadMessages] Error fetching messages:', messagesError);
      throw messagesError;
    }

    // Update read status
    await supabase
      .from('message_reads')
      .upsert({
        thread_id: thread.id,
        user_id: user.id,
        last_read_at: new Date().toISOString()
      });

    console.log(`[GetThreadMessages] Returning ${messages?.length || 0} messages`);

    return new Response(
      JSON.stringify({ 
        messages: (messages || []).reverse(), // Return in chronological order
        threadId: thread.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[GetThreadMessages] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
