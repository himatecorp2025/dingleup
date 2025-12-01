import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
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

    // OPTIMIZATION: Add better error handling for high-load scenarios
    try {
      // Call the improved database function to regenerate lives for all users
      const { error } = await supabaseClient.rpc('regenerate_lives_background');

      if (error) {
        console.error('[regenerate-lives-background] RPC error:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error.message,
            error_code: 'RPC_ERROR'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lives regenerated successfully for eligible users (max 5000/batch)',
          processed_at: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (error) {
      console.error('[regenerate-lives-background] Unexpected error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          error_code: 'UNEXPECTED_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing the request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
