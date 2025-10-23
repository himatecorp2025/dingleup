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
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { filename, contentType, threadId } = await req.json();

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid content type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to thread
    const { data: thread, error: threadError } = await supabaseClient
      .from('dm_threads')
      .select('*')
      .eq('id', threadId)
      .or(`user_id_a.eq.${user.id},user_id_b.eq.${user.id}`)
      .single();

    if (threadError || !thread) {
      return new Response(
        JSON.stringify({ error: 'Thread not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique filename
    const fileExt = filename.split('.').pop();
    const uniqueFilename = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${threadId}/${uniqueFilename}`;

    // Create signed URL for upload (valid for 5 minutes)
    const { data: signedData, error: signedError } = await supabaseClient.storage
      .from('chat-media')
      .createSignedUploadUrl(filePath);

    if (signedError) {
      console.error('Error creating signed URL:', signedError);
      throw signedError;
    }

    console.log('Signed upload URL created:', { path: filePath, token: signedData.token });

    return new Response(
      JSON.stringify({
        uploadUrl: signedData.signedUrl,
        path: filePath,
        token: signedData.token
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in upload-chat-image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});