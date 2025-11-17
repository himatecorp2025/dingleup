import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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

    const validCategories = ['health', 'history', 'culture', 'finance'];
    if (!validCategories.includes(body.category)) {
      return new Response(
        JSON.stringify({ error: `Category must be one of: ${validCategories.join(', ')}` }),
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

    console.log('[CompleteGame] User:', user.id, 'Category:', body.category, 'Correct:', body.correctAnswers, 'Total Coins:', coinsEarned);

    // Insert game result
    const { error: insertError } = await supabase
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
      console.error('[CompleteGame] Insert error:', insertError);
      throw insertError;
    }

    // MEGJEGYZÉS: A jutalmak már jóvá lettek írva minden helyes válasz után
    // a credit-gameplay-reward edge function által, ezért itt NEM írunk jóvá újra

    // Calculate current week start (Monday 00:00 UTC)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diff);
    monday.setUTCHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];

    // Get user profile for username
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    // Update weekly_rankings
    const { data: existingWeekly, error: weeklySelectError } = await supabase
      .from('weekly_rankings')
      .select('total_correct_answers')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .eq('category', body.category)
      .maybeSingle();

    const newWeeklyTotal = (existingWeekly?.total_correct_answers || 0) + body.correctAnswers;

    const { error: weeklyError } = await supabase
      .from('weekly_rankings')
      .upsert({
        user_id: user.id,
        username: userProfile?.username || 'Player',
        category: body.category,
        week_start: weekStart,
        total_correct_answers: newWeeklyTotal,
        average_response_time: body.averageResponseTime,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_start,category',
        ignoreDuplicates: false
      });

    if (weeklyError) {
      console.error('[CompleteGame] Weekly rankings update error:', weeklyError);
    }

    // Update global_leaderboard
    const { error: leaderboardError } = await supabase
      .from('global_leaderboard')
      .upsert({
        user_id: user.id,
        total_correct_answers: body.correctAnswers,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (leaderboardError) {
      console.error('[CompleteGame] Leaderboard update warning:', leaderboardError);
      // Don't throw - leaderboard is not critical
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
    console.error('[CompleteGame] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});