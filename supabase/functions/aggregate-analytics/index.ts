import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split('T')[0];

    // 1. RETENTION ANALYTICS
    const { data: sessionUsers } = await supabase
      .from('app_session_events')
      .select('user_id, created_at');

    const uniqueToday = new Set(
      sessionUsers?.filter(s => s.created_at >= today).map(s => s.user_id) || []
    );
    
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const uniqueWeek = new Set(
      sessionUsers?.filter(s => new Date(s.created_at) >= last7Days).map(s => s.user_id) || []
    );
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const uniqueMonth = new Set(
      sessionUsers?.filter(s => new Date(s.created_at) >= last30Days).map(s => s.user_id) || []
    );

    const { data: newUsers } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', today);

    await supabase
      .from('retention_analytics')
      .upsert({
        date: today,
        dau: uniqueToday.size,
        wau: uniqueWeek.size,
        mau: uniqueMonth.size,
        new_users: newUsers?.length || 0,
        returning_users: uniqueToday.size - (newUsers?.length || 0),
        churn_rate: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' });

    // 2. MONETIZATION ANALYTICS
    const { data: purchases } = await supabase
      .from('purchases')
      .select('user_id, amount_usd, product_type, status, created_at');

    const completedPurchases = purchases?.filter(p => p.status === 'completed') || [];
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0);
    const payingUsers = new Set(completedPurchases.map(p => p.user_id)).size;

    const { count: totalUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const arpu = totalUsersCount ? totalRevenue / totalUsersCount : 0;
    const conversionRate = totalUsersCount ? (payingUsers / totalUsersCount) * 100 : 0;

    // Revenue by product
    const revenueByProduct: any[] = [];
    const productMap = new Map<string, number>();
    completedPurchases.forEach(p => {
      productMap.set(p.product_type, (productMap.get(p.product_type) || 0) + Number(p.amount_usd || 0));
    });
    productMap.forEach((revenue, product_type) => {
      revenueByProduct.push({ product_type, revenue });
    });

    // Top spenders
    const spendingMap = new Map<string, number>();
    completedPurchases.forEach(p => {
      spendingMap.set(p.user_id, (spendingMap.get(p.user_id) || 0) + Number(p.amount_usd || 0));
    });

    const topSpendersIds = Array.from(spendingMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([user_id]) => user_id);

    const { data: topSpendersProfiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', topSpendersIds);

    const topSpenders = topSpendersIds.map(userId => {
      const profile = topSpendersProfiles?.find(p => p.id === userId);
      return {
        username: profile?.username || 'Unknown',
        total_spent: spendingMap.get(userId) || 0
      };
    });

    await supabase
      .from('monetization_analytics')
      .upsert({
        date: today,
        total_revenue: totalRevenue,
        paying_users: payingUsers,
        total_users: totalUsersCount || 0,
        arpu,
        conversion_rate: conversionRate,
        revenue_by_product: revenueByProduct,
        top_spenders: topSpenders,
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' });

    // 3. ENGAGEMENT ANALYTICS
    const { data: sessions } = await supabase
      .from('app_session_events')
      .select('user_id, session_duration_seconds, created_at');

    const todaySessions = sessions?.filter(s => s.created_at >= today) || [];
    const avgDuration = todaySessions.length > 0
      ? todaySessions.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0) / todaySessions.length
      : 0;

    const userSessionsCount = new Map<string, number>();
    todaySessions.forEach(s => {
      userSessionsCount.set(s.user_id, (userSessionsCount.get(s.user_id) || 0) + 1);
    });
    const avgSessionsPerUser = userSessionsCount.size > 0 
      ? todaySessions.length / userSessionsCount.size 
      : 0;

    // Feature usage
    const { data: featureEvents } = await supabase
      .from('feature_usage_events')
      .select('feature_name, user_id')
      .gte('created_at', today);

    const featureUsageMap = new Map<string, Set<string>>();
    featureEvents?.forEach(e => {
      if (!featureUsageMap.has(e.feature_name)) {
        featureUsageMap.set(e.feature_name, new Set());
      }
      featureUsageMap.get(e.feature_name)!.add(e.user_id);
    });

    const featureUsage = Array.from(featureUsageMap.entries())
      .map(([feature_name, users]) => ({
        feature_name,
        usage_count: users.size
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    // Game engagement
    const { data: gameResults } = await supabase
      .from('game_results')
      .select('user_id, correct_answers, category')
      .gte('created_at', today);

    const gamesPerUser = new Map<string, number>();
    const categoryCount = new Map<string, number>();
    let totalCorrect = 0;

    gameResults?.forEach(g => {
      gamesPerUser.set(g.user_id, (gamesPerUser.get(g.user_id) || 0) + 1);
      categoryCount.set(g.category, (categoryCount.get(g.category) || 0) + 1);
      totalCorrect += g.correct_answers;
    });

    const mostPlayedCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgGamesPerUser = gamesPerUser.size > 0 
      ? Array.from(gamesPerUser.values()).reduce((a, b) => a + b, 0) / gamesPerUser.size 
      : 0;

    const avgCorrectAnswers = gameResults && gameResults.length > 0
      ? totalCorrect / gameResults.length
      : 0;

    await supabase
      .from('engagement_analytics')
      .upsert({
        date: today,
        avg_session_duration: Math.round(avgDuration),
        avg_sessions_per_user: avgSessionsPerUser,
        total_sessions: todaySessions.length,
        feature_usage: featureUsage,
        game_engagement: {
          avgGamesPerUser,
          avgCorrectAnswers,
          mostPlayedCategories
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' });

    // 4. PERFORMANCE SUMMARY
    const { data: perfMetrics } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte('created_at', today);

    if (perfMetrics && perfMetrics.length > 0) {
      const avgLoadTime = perfMetrics.reduce((sum, m) => sum + (m.load_time_ms || 0), 0) / perfMetrics.length;
      const avgTTFB = perfMetrics.reduce((sum, m) => sum + (m.ttfb_ms || 0), 0) / perfMetrics.length;
      const avgLCP = perfMetrics.reduce((sum, m) => sum + (m.lcp_ms || 0), 0) / perfMetrics.length;
      const avgCLS = perfMetrics.reduce((sum, m) => sum + (Number(m.cls) || 0), 0) / perfMetrics.length;

      const { count: errorCount } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      await supabase
        .from('performance_summary')
        .upsert({
          date: today,
          avg_load_time: avgLoadTime,
          avg_ttfb: avgTTFB,
          avg_lcp: avgLCP,
          avg_cls: avgCLS,
          error_count: errorCount || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'date' });
    }

    // 5. USER JOURNEY ANALYTICS
    const { data: navEvents } = await supabase
      .from('navigation_events')
      .select('user_id, page_route, session_id, created_at')
      .gte('created_at', today);

    // Onboarding funnel
    const totalProfiles = totalUsersCount || 0;
    const visitedDashboard = new Set(navEvents?.filter(e => e.page_route === '/dashboard').map(e => e.user_id) || []).size;
    const playedGame = new Set(navEvents?.filter(e => e.page_route === '/game').map(e => e.user_id) || []).size;

    const onboardingFunnel = [
      { step: 'Regisztráció', users: totalProfiles, dropoffRate: 0 },
      { step: 'Dashboard látogatás', users: visitedDashboard, dropoffRate: totalProfiles > 0 ? ((totalProfiles - visitedDashboard) / totalProfiles) * 100 : 0 },
      { step: 'Első játék', users: playedGame, dropoffRate: visitedDashboard > 0 ? ((visitedDashboard - playedGame) / visitedDashboard) * 100 : 0 }
    ];

    await supabase
      .from('user_journey_analytics')
      .upsert({
        date: today,
        onboarding_funnel: onboardingFunnel,
        purchase_funnel: [],
        game_funnel: [],
        common_paths: [],
        exit_points: [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'date' });

    return new Response(
      JSON.stringify({ success: true, message: 'Analytics aggregated successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error aggregating analytics:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});