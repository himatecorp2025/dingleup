import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Cron jobs are trusted, no auth needed when called by Supabase's scheduler
    console.log('[CRON] Regenerate lives background job started');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    )

    // Call database function to regenerate lives
    const { error } = await supabaseClient.rpc('regenerate_lives_background')

    if (error) {
      console.error('[INTERNAL] Error regenerating lives:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Lives regenerated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('[INTERNAL] Error in regenerate-lives-background function:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred processing the request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
