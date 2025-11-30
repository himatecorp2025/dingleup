import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarkTutorialCompletedRequest {
  route: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[mark-tutorial-completed] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('[mark-tutorial-completed] User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: MarkTutorialCompletedRequest = await req.json();
    const { route } = body;

    if (!route || typeof route !== 'string') {
      console.error('[mark-tutorial-completed] Invalid route parameter');
      return new Response(
        JSON.stringify({ error: 'Invalid route parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[mark-tutorial-completed] Marking tutorial '${route}' as completed for user: ${user.id}`);

    // Upsert tutorial progress (insert or update if exists)
    const { error: upsertError } = await supabase
      .from('tutorial_progress')
      .upsert(
        {
          user_id: user.id,
          route: route,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,route',
        }
      );

    if (upsertError) {
      console.error('[mark-tutorial-completed] Database upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to mark tutorial as completed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[mark-tutorial-completed] ✓ Tutorial '${route}' marked as completed for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, route, completed: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[mark-tutorial-completed] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
