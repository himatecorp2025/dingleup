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

    const { recipientId, body } = await req.json();

    // Validate input
    if (!recipientId || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing recipientId or body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Üzenet túl hosszú (max 2000 karakter)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Üzenet nem lehet üres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SendDM] Sending message from', user.id, 'to', recipientId);

    // Check if friendship exists and is active
    const normalizedIds = [user.id, recipientId].sort();
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('status')
      .eq('user_id_a', normalizedIds[0])
      .eq('user_id_b', normalizedIds[1])
      .single();

    if (friendshipError || !friendship || friendship.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Nem küldhetsz üzenetet ennek a felhasználónak' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create thread
    const { data: thread, error: threadError } = await supabase
      .from('dm_threads')
      .select('id')
      .eq('user_id_a', normalizedIds[0])
      .eq('user_id_b', normalizedIds[1])
      .single();

    let threadId = thread?.id;

    if (threadError && threadError.code === 'PGRST116') {
      // Thread doesn't exist, create it
      const { data: newThread, error: createError } = await supabase
        .from('dm_threads')
        .insert({
          user_id_a: normalizedIds[0],
          user_id_b: normalizedIds[1]
        })
        .select('id')
        .single();

      if (createError) {
        console.error('[SendDM] Error creating thread:', createError);
        throw createError;
      }

      threadId = newThread.id;
    } else if (threadError) {
      console.error('[SendDM] Error fetching thread:', threadError);
      throw threadError;
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('dm_messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        body: body.trim()
      })
      .select()
      .single();

    if (messageError) {
      console.error('[SendDM] Error inserting message:', messageError);
      throw messageError;
    }

    console.log('[SendDM] Message sent successfully');

    return new Response(
      JSON.stringify({ success: true, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SendDM] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
