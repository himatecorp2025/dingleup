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

    // Bővített fájltípus támogatás - képek, videók, audió, dokumentumok
    const allowedTypes = [
      // Képek
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
      // Videók
      'video/mp4', 'video/quicktime', 'video/webm',
      // Audió
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/flac', 'audio/ogg',
      // Dokumentumok
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      // Archívumok
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (!allowedTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Nem támogatott fájltípus' }),
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
      throw signedError;
    }

    return new Response(
      JSON.stringify({
        uploadUrl: signedData.signedUrl,
        path: filePath,
        token: signedData.token
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
