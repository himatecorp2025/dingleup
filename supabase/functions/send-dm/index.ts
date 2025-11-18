import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    const idempotencyKey = req.headers.get('Idempotency-Key');
    
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

    const { recipientId, body, mediaUrl, mediaPath, attachments, clientMessageId } = await req.json();

    console.log('[SendDM] Request:', { recipientId, bodyLength: body?.length, attachmentsCount: attachments?.length });

    // Validate input
    if (!recipientId) {
      return new Response(
        JSON.stringify({ error: 'Missing recipientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Must have either text body or attachments
    const hasBody = body && body.trim() !== '';
    const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;
    const hasMedia = mediaUrl && mediaPath;
    
    if (!hasBody && !hasAttachments && !hasMedia) {
      console.log('[SendDM] Rejected: No content provided');
      return new Response(
        JSON.stringify({ error: 'Message must have text or attachments' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SendDM] Message content check:', { 
      hasBody, 
      hasAttachments, 
      attachmentsCount: attachments?.length || 0,
      hasMedia 
    });

    // Check idempotency
    const checkKey = idempotencyKey || clientMessageId;
    if (checkKey) {
      const { data: existing } = await supabase
        .from('dm_messages')
        .select('id, body')
        .eq('sender_id', user.id)
        .eq('thread_id', 'placeholder') // Will be updated after we get threadId
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .limit(5);
      
      if (existing && existing.length > 0) {
        const bodyToCheck = body || '';
        const match = existing.find(m => m.body === bodyToCheck);
        if (match) {
          console.log('[SendDM] Duplicate message detected via idempotency check');
          return new Response(
            JSON.stringify({ success: true, message: match, duplicate: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // SECURITY: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipientId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipient ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate body if present
    if (body) {
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
    }

    // SECURITY: Sanitize message content to prevent XSS if body exists
    const sanitizedBody = body ? body
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim() : '';

    if (body && sanitizedBody.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message body cannot be empty after sanitization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SendDM] Sending message from', user.id, 'to', recipientId);

    // Check if friendship exists and status allows messaging
    const normalizedIds = [user.id, recipientId].sort();
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('status, requested_by')
      .eq('user_id_a', normalizedIds[0])
      .eq('user_id_b', normalizedIds[1])
      .single();

    if (friendshipError || !friendship) {
      return new Response(
        JSON.stringify({ error: 'Nem küldhetsz üzenetet ennek a felhasználónak' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if allowed: active OR (pending AND current user is requester)
    const isAllowed = friendship.status === 'active' || 
                     (friendship.status === 'pending' && friendship.requested_by === user.id);
    
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: 'Még nem küldhetsz üzenetet - várd meg a visszaigazolást' }),
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

    // Check thread permissions
    const { data: permission } = await supabase
      .from('thread_participants')
      .select('can_send')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .single();

    if (permission && !permission.can_send) {
      return new Response(
        JSON.stringify({ error: 'Még nem küldhetsz üzenetet ebben a beszélgetésben' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert message with sanitized content
    const { data: message, error: messageError } = await supabase
      .from('dm_messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        body: sanitizedBody || ''
      })
      .select()
      .single();

    if (messageError) {
      console.error('[SendDM] Error inserting message:', messageError);
      throw messageError;
    }

    console.log('[SendDM] Message inserted:', message.id);

    // Handle old-style mediaUrl/mediaPath
    if (hasMedia) {
      const { error: mediaError } = await supabase
        .from('message_media')
        .insert({
          message_id: message.id,
          media_type: 'media',
          media_url: mediaPath,
          file_name: null,
          file_size: null,
          mime_type: null,
          thumbnail_url: null,
          width: null,
          height: null,
          duration_ms: null
        });

      if (mediaError) {
        console.error('[SendDM] Error inserting legacy media:', mediaError);
        // Don't throw - message is already created
      }
    }

    // Handle new-style attachments array
    if (hasAttachments) {
      const mediaRecords = attachments.map((att: any) => {
        const path = att.path || att.storagePath || att.mediaUrl || att.key || att.url;
        
        return {
          message_id: message.id,
          media_type: att.kind || 'file',
          media_url: path || att.key || att.url, // store path when possible
          file_name: att.name || att.key?.split('/').pop() || 'file',
          file_size: att.bytes || null,
          mime_type: att.mime || null,
          thumbnail_url: att.thumbnailUrl || null,
          width: att.w || null,
          height: att.h || null,
          duration_ms: att.duration || null
        };
      });

      console.log('[SendDM] Inserting', mediaRecords.length, 'media records');

      const { error: mediaError } = await supabase
        .from('message_media')
        .insert(mediaRecords);

      if (mediaError) {
        console.error('[SendDM] Error inserting attachments:', mediaError);
        // Don't throw - message is already created
      } else {
        console.log('[SendDM] Media records inserted successfully');
      }
    }

    // Fetch complete message with media
    const { data: completeMessage, error: fetchError } = await supabase
      .from('dm_messages')
      .select(`
        id,
        thread_id,
        sender_id,
        body,
        created_at,
        is_deleted,
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
      .eq('id', message.id)
      .single();

    if (fetchError) {
      console.error('[SendDM] Error fetching complete message:', fetchError);
    }

    // Generate signed URLs for media
    let mediaWithSignedUrls = [];
    if (completeMessage?.message_media && Array.isArray(completeMessage.message_media)) {
      mediaWithSignedUrls = await Promise.all(completeMessage.message_media.map(async (media: any) => {
        let signedMediaUrl = media.media_url;
        let signedThumbnailUrl = media.thumbnail_url;

        // Generate signed URL for media_url if it's a storage path
        if (media.media_url && !media.media_url.startsWith('http')) {
          const { data: mediaData, error: mediaError } = await supabase.storage
            .from('chat-media')
            .createSignedUrl(media.media_url, 3600);
          
          if (!mediaError && mediaData?.signedUrl) {
            signedMediaUrl = mediaData.signedUrl;
          }
        }

        // Generate signed URL for thumbnail if it's a storage path
        if (media.thumbnail_url && !media.thumbnail_url.startsWith('http')) {
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from('chat-media')
            .createSignedUrl(media.thumbnail_url, 3600);
          
          if (!thumbError && thumbData?.signedUrl) {
            signedThumbnailUrl = thumbData.signedUrl;
          }
        }

        return {
          ...media,
          media_url: signedMediaUrl,
          thumbnail_url: signedThumbnailUrl
        };
      }));
    }

    const messageResponse = {
      ...message,
      media: mediaWithSignedUrls
    };

    console.log('[SendDM] Message sent successfully with', mediaWithSignedUrls.length, 'media items');

    return new Response(
      JSON.stringify({ success: true, message: messageResponse }),
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
