import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

interface GameResultRow {
  user_id: string;
  correct_answers: number;
  average_response_time: number;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Security: Verify this is a legitimate cron request using secret
    const cronSecret = req.headers.get('x-supabase-cron-secret');
    if (cronSecret !== Deno.env.get('SUPABASE_CRON_SECRET')) {
      console.warn('[SECURITY] Unauthorized access attempt to cron endpoint');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting weekly rankings calculation...');

    // Calculate week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];

    console.log('Week start:', weekStart);

    const categories = ['health', 'history', 'culture', 'finance'];

    for (const category of categories) {
      console.log(`Processing category: ${category}`);

      // Get all game results for this week and category
      const { data: results, error: resultsError } = await supabase
        .from('game_results')
        .select('user_id, correct_answers, average_response_time')
        .eq('category', category)
        .eq('completed', true)
        .gte('completed_at', `${weekStart}T00:00:00`)
        .order('completed_at', { ascending: true });

      if (resultsError) {
        console.error(`Error fetching results for ${category}:`, resultsError);
        continue;
      }

      if (!results || results.length === 0) {
        console.log(`No results for ${category} this week`);
        continue;
      }

      // Aggregate by user
      const userStats = new Map<string, { totalCorrect: number; avgTime: number; count: number }>();

      results.forEach((result: GameResultRow) => {
        const existing = userStats.get(result.user_id);
        if (existing) {
          existing.totalCorrect += result.correct_answers;
          existing.avgTime = (existing.avgTime * existing.count + result.average_response_time) / (existing.count + 1);
          existing.count += 1;
        } else {
          userStats.set(result.user_id, {
            totalCorrect: result.correct_answers,
            avgTime: result.average_response_time,
            count: 1
          });
        }
      });

      // Sort by total correct (desc), then by avg time (asc)
      const sortedUsers = Array.from(userStats.entries())
        .sort((a, b) => {
          if (b[1].totalCorrect !== a[1].totalCorrect) {
            return b[1].totalCorrect - a[1].totalCorrect;
          }
          return a[1].avgTime - b[1].avgTime;
        });

      console.log(`Found ${sortedUsers.length} users for ${category}`);

      // Delete existing rankings for this week and category
      await supabase
        .from('weekly_rankings')
        .delete()
        .eq('category', category)
        .eq('week_start', weekStart);

      // Insert new rankings
      const rankings = sortedUsers.map(([userId, stats], index) => ({
        user_id: userId,
        category,
        week_start: weekStart,
        rank: index + 1,
        total_correct_answers: stats.totalCorrect,
        average_response_time: stats.avgTime
      }));

      const { error: insertError } = await supabase
        .from('weekly_rankings')
        .insert(rankings);

      if (insertError) {
        console.error(`Error inserting rankings for ${category}:`, insertError);
      } else {
        console.log(`Successfully inserted ${rankings.length} rankings for ${category}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Weekly rankings calculated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating rankings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
