import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface GameCompletion {
  category: string;
  correctAnswers: number;
  totalQuestions: number;
  averageResponseTime: number;
}

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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth client for JWT verification ONLY
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Admin client for DB operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Authenticate user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body: GameCompletion = await req.json();

    // SECURITY: Comprehensive input validation
    if (!body.category || typeof body.category !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validCategories = ['mixed'];
    if (!validCategories.includes(body.category)) {
      return new Response(
        JSON.stringify({ error: 'Category must be "mixed"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof body.correctAnswers !== 'number' || body.correctAnswers < 0 || body.correctAnswers > 15) {
      return new Response(
        JSON.stringify({ error: 'Invalid correctAnswers (must be 0-15)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof body.totalQuestions !== 'number' || body.totalQuestions !== 15) {
      return new Response(
        JSON.stringify({ error: 'Invalid totalQuestions (must be 15)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof body.averageResponseTime !== 'number' || body.averageResponseTime < 0 || body.averageResponseTime > 30000) {
      return new Response(
        JSON.stringify({ error: 'Invalid averageResponseTime (0-30000ms)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Összesített érmék számítása (már jóváírva lettek minden helyes válasz után)
    // Ez csak statisztikai célokra kerül a game_results táblába
    let totalCoinsEarned = 1; // Start jutalom
    for (let i = 0; i < body.correctAnswers; i++) {
      if (i >= 0 && i <= 3) totalCoinsEarned += 1;      // 1-4. kérdés
      else if (i >= 4 && i <= 8) totalCoinsEarned += 3; // 5-9. kérdés
      else if (i >= 9 && i <= 13) totalCoinsEarned += 5; // 10-14. kérdés
      else if (i === 14) totalCoinsEarned += 55;         // 15. kérdés
    }
    const coinsEarned = totalCoinsEarned;

    // Insert game result using ADMIN client (bypasses RLS)
    const { error: insertError } = await supabaseAdmin
      .from('game_results')
      .insert({
        user_id: user.id,
        category: body.category,
        correct_answers: body.correctAnswers,
        total_questions: body.totalQuestions,
        coins_earned: coinsEarned,
        average_response_time: body.averageResponseTime,
        completed: true,
        completed_at: new Date().toISOString()
      });

    if (insertError) {
      throw insertError;
    }

    // MEGJEGYZÉS: A jutalmak már jóvá lettek írva minden helyes válasz után
    // a credit-gameplay-reward edge function által, ezért itt NEM írunk jóvá újra

    // Get user profile for leaderboard display
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    // Update weekly_rankings INSTANTLY via RPC (aggregated "mixed" category)
    const { error: weeklyRankError } = await supabaseAdmin.rpc('update_weekly_ranking_for_user', {
      p_user_id: user.id,
      p_correct_answers: body.correctAnswers,
      p_average_response_time: body.averageResponseTime
    });

    if (weeklyRankError) {
      // Ranking update not critical, continue
    }

    // Update global_leaderboard using ADMIN client (AGGREGATE LIFETIME TOTAL)
    const { data: existingGlobal } = await supabaseAdmin
      .from('global_leaderboard')
      .select('total_correct_answers, username')
      .eq('user_id', user.id)
      .maybeSingle();

    const newGlobalTotal = (existingGlobal?.total_correct_answers || 0) + body.correctAnswers;

    const { error: leaderboardError } = await supabaseAdmin
      .from('global_leaderboard')
      .upsert({
        user_id: user.id,
        username: userProfile?.username || existingGlobal?.username || 'Player',
        total_correct_answers: newGlobalTotal,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (leaderboardError) {
      // Leaderboard update not critical, continue
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        coinsEarned,
        message: 'Játék sikeresen befejezve!' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});