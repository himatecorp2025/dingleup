import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimit.ts';

/**
 * Consolidated dashboard data endpoint
 * Fetches all required dashboard data in a single call:
 * - User profile (coins, lives, username, avatar)
 * - Wallet data (ledger, next life time)
 * - Weekly rankings (user's current rank)
 * - Leaderboard top 100 (country-specific)
 */

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Rate limiting
    const rateLimitResult = await checkRateLimit(supabaseClient, 'get-dashboard-data', RATE_LIMITS.WALLET);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Túl sok kérés' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function: get current week start (Monday)
    const getWeekStart = (): string => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      monday.setHours(0, 0, 0, 0);
      return monday.toISOString().split('T')[0];
    };

    // Parallel fetch all required data
    const [profileResult, walletLedgerResult, weeklyRankResult, leaderboardResult] = await Promise.all([
      // 1. User profile with regenerated lives
      supabaseClient.rpc('regenerate_lives').then(() =>
        supabaseClient
          .from('profiles')
          .select('id, username, avatar_url, coins, lives, max_lives, last_life_regeneration, lives_regeneration_rate, total_correct_answers, country_code')
          .eq('id', user.id)
          .single()
      ),
      
      // 2. Wallet ledger (last 50 transactions)
      supabaseClient
        .from('wallet_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // 3. User's weekly ranking
      supabaseClient
        .from('weekly_rankings')
        .select('rank, total_correct_answers')
        .eq('user_id', user.id)
        .eq('category', 'mixed')
        .eq('week_start', getWeekStart())
        .maybeSingle(),
      
      // 4. Top 100 leaderboard (country-specific)
      (async () => {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('country_code')
          .eq('id', user.id)
          .single();
        
        const countryCode = profile?.country_code || 'HU';
        
        return supabaseClient
          .from('weekly_rankings')
          .select(`
            user_id,
            total_correct_answers,
            profiles!inner (
              username,
              avatar_url,
              country_code
            )
          `)
          .eq('week_start', getWeekStart())
          .eq('category', 'mixed')
          .eq('profiles.country_code', countryCode)
          .order('total_correct_answers', { ascending: false })
          .limit(100);
      })()
    ]);

    const { data: profile, error: profileError } = profileResult;
    const { data: ledger, error: ledgerError } = walletLedgerResult;
    const { data: weeklyRank } = weeklyRankResult;
    const { data: leaderboard, error: leaderboardError } = leaderboardResult;

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate next life regeneration time
    let nextLifeAt: string | null = null;
    if (profile && profile.lives < profile.max_lives) {
      const lastRegen = new Date(profile.last_life_regeneration);
      const regenMinutes = profile.lives_regeneration_rate || 12;
      const nextLife = new Date(lastRegen.getTime() + regenMinutes * 60 * 1000);
      nextLifeAt = nextLife.toISOString();
    }

    // Construct consolidated response
    const dashboardData = {
      profile: {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        coins: profile.coins || 0,
        lives: profile.lives || 0,
        max_lives: profile.max_lives || 15,
        total_correct_answers: profile.total_correct_answers || 0,
        country_code: profile.country_code,
      },
      wallet: {
        coinsCurrent: profile.coins || 0,
        livesCurrent: profile.lives || 0,
        livesMax: profile.max_lives || 15,
        nextLifeAt,
        regenIntervalSec: ((profile.lives_regeneration_rate || 12) * 60),
        regenMinutes: profile.lives_regeneration_rate || 12,
        ledger: ledger || [],
      },
      ranking: {
        rank: weeklyRank?.rank || null,
        total_correct_answers: weeklyRank?.total_correct_answers || 0,
      },
      leaderboard: (leaderboard || []).map((row: any) => ({
        user_id: row.user_id,
        username: row.profiles?.username || 'Player',
        avatar_url: row.profiles?.avatar_url || null,
        total_correct_answers: row.total_correct_answers || 0,
      })),
    };

    return new Response(
      JSON.stringify(dashboardData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
