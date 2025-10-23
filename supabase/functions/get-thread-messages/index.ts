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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Service role client for DB ops
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // SECURITY: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(otherUserId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid otherUserId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate limit to prevent abuse
    if (limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ error: 'Limit must be between 1 and 100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate cursor format if provided
    if (before && !before.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid cursor format' }),
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

    // Get messages with pagination and media
    let query = supabase
      .from('dm_messages')
      .select(`
        *,
        message_media (
          media_url,
          media_type,
          thumbnail_url
        )
      `)
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

    // Transform messages to include media array
    const transformedMessages = (messages || []).map((msg: any) => ({
      ...msg,
      media: msg.message_media || []
    }));

    return new Response(
      JSON.stringify({ 
        messages: transformedMessages.reverse(), // Return in chronological order
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
