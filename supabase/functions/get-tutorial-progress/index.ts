import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TutorialProgress {
  [route: string]: boolean;
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
      console.error('[get-tutorial-progress] No authorization header');
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
      console.error('[get-tutorial-progress] User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-tutorial-progress] Fetching tutorial progress for user: ${user.id}`);

    // Fetch all tutorial progress for this user
    const { data: progressRecords, error: fetchError } = await supabase
      .from('tutorial_progress')
      .select('route, completed')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('[get-tutorial-progress] Database fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tutorial progress' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert array to object format: {dashboard: true, profile: false, ...}
    const progress: TutorialProgress = {};
    if (progressRecords) {
      for (const record of progressRecords) {
        progress[record.route] = record.completed;
      }
    }

    console.log(`[get-tutorial-progress] ✓ Fetched ${Object.keys(progress).length} tutorial progress records for user ${user.id}`);

    return new Response(
      JSON.stringify({ progress }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-tutorial-progress] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
