import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
          thumbnail_url,
          file_name,
          file_size,
          width,
          height,
          duration_ms,
          mime_type
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

    // Transform messages to include media array with signed URLs
    const transformedMessages = await Promise.all((messages || []).map(async (msg: any) => {
      console.log(`[GetThreadMessages] Processing message ${msg.id}, has ${msg.message_media?.length || 0} media items`);
      
      const mediaWithSignedUrls = await Promise.all((msg.message_media || []).map(async (media: any) => {
        // Generate signed URLs for private storage (valid for 1 hour)
        let signedMediaUrl = media.media_url;
        let signedThumbnailUrl = media.thumbnail_url;

        const toStoragePath = (u: string | null | undefined) => {
          if (!u) return null;
          if (!u.startsWith('http')) return u;
          const publicMarker = '/storage/v1/object/public/chat-media/';
          const signedMarker = '/storage/v1/object/sign/chat-media/';
          if (u.includes(publicMarker)) return u.substring(u.indexOf(publicMarker) + publicMarker.length);
          if (u.includes(signedMarker)) return u.substring(u.indexOf(signedMarker) + signedMarker.length).split('?')[0];
          return null;
        };

        const mediaPath = toStoragePath(media.media_url);
        if (mediaPath) {
          const { data: mediaData, error: mediaError } = await supabase.storage
            .from('chat-media')
            .createSignedUrl(mediaPath, 600); // 10 perc
          if (!mediaError && mediaData?.signedUrl) {
            signedMediaUrl = mediaData.signedUrl;
          } else {
            console.error('[GetThreadMessages] Signed URL error for media:', mediaError?.message, 'path:', mediaPath);
          }
        }

        const thumbPath = toStoragePath(media.thumbnail_url);
        if (thumbPath) {
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from('chat-media')
            .createSignedUrl(thumbPath, 600);
          if (!thumbError && thumbData?.signedUrl) {
            signedThumbnailUrl = thumbData.signedUrl;
          } else {
            console.error('[GetThreadMessages] Signed URL error for thumbnail:', thumbError?.message, 'path:', thumbPath);
          }
        }

        return {
          ...media,
          media_url: signedMediaUrl,
          thumbnail_url: signedThumbnailUrl
        };
      }));

      return {
        ...msg,
        media: mediaWithSignedUrls
      };
    }));

    console.log(`[GetThreadMessages] Transformed ${transformedMessages.length} messages, first has ${transformedMessages[0]?.media?.length || 0} media`);

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
