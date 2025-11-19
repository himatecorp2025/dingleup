import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders } from '../_shared/cors.ts';

const corsHeaders = getCorsHeaders();

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface UpdateUserGameSettingsRequest {
  aiPersonalizedQuestionsEnabled?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;
    const body: UpdateUserGameSettingsRequest = await req.json();

    // Upsert settings
    const { data, error } = await supabaseClient
      .from('user_game_settings')
      .upsert({
        user_id: userId,
        ai_personalized_questions_enabled: body.aiPersonalizedQuestionsEnabled ?? true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[update-user-game-settings] Error:', error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true, settings: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[update-user-game-settings] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
