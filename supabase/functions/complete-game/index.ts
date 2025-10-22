import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameCompletion {
  category: string;
  correctAnswers: number;
  totalQuestions: number;
  averageResponseTime: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    // SERVER-SIDE: Calculate coins based on performance
    // Base coins per correct answer
    const baseCoins = body.correctAnswers * 10;
    
    // Speed bonus (faster = more coins)
    let speedBonus = 0;
    if (body.averageResponseTime < 3000) speedBonus = body.correctAnswers * 5;
    else if (body.averageResponseTime < 5000) speedBonus = body.correctAnswers * 3;
    
    // Perfect score bonus
    let perfectBonus = 0;
    if (body.correctAnswers === body.totalQuestions) perfectBonus = 50;
    
    const coinsEarned = baseCoins + speedBonus + perfectBonus;

    console.log('[CompleteGame] User:', user.id, 'Category:', body.category, 'Correct:', body.correctAnswers, 'Coins:', coinsEarned);

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

    // Award coins using secure RPC
    if (coinsEarned > 0) {
      const { error: coinsError } = await supabase.rpc('award_coins', { 
        amount: coinsEarned 
      });

      if (coinsError) {
        console.error('[CompleteGame] Award coins error:', coinsError);
        throw coinsError;
      }
    }

    // Update leaderboard
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