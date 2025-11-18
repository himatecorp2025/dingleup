import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface UploadRequest {
  filename: string;
  contentType: string;
  threadId: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { files }: { files: UploadRequest[] } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate presigned URLs for all files in parallel
    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const sanitizedFilename = file.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${file.threadId}/${user.id}/${timestamp}-${randomStr}.${sanitizedFilename.split('.').pop()}`;

      try {
        // Generate presigned upload URL (1 hour expiry)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-media')
          .createSignedUploadUrl(filePath, {
            upsert: true,
          });

        if (uploadError) {
          return { error: uploadError.message, filename: file.filename };
        }

        return {
          filename: file.filename,
          path: filePath,
          uploadUrl: uploadData.signedUrl,
          token: uploadData.token,
        };
      } catch (error) {
        return { error: 'Failed to generate upload URL', filename: file.filename };
      }
    });

    const results = await Promise.all(uploadPromises);

    // Check for any errors
    const errors = results.filter(r => 'error' in r);

    return new Response(JSON.stringify({ uploads: results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
