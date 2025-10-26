import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }
  const corsHeaders = getCorsHeaders(origin);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const anon = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anon.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAdminRole } = await anon.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const service = createClient(supabaseUrl, supabaseServiceKey);

    const [{ data: navEvents }, { data: profiles }, { data: conversionEvents }, { data: gameExitEvents }] = await Promise.all([
      service.from('navigation_events').select('*').order('created_at', { ascending: true }),
      service.from('profiles').select('id, created_at'),
      service.from('conversion_events').select('user_id, event_type'),
      service.from('game_exit_events').select('*'),
    ]);

    const totalUsers = profiles?.length || 0;
    const registeredUsers = totalUsers;
    const visitedDashboard = new Set((navEvents || []).filter((e: any) => e.page_route === '/dashboard').map((e: any) => e.user_id)).size;
    const playedFirstGame = new Set((navEvents || []).filter((e: any) => e.page_route === '/game').map((e: any) => e.user_id)).size;
    const madePurchase = new Set((navEvents || []).filter((e: any) => e.page_route === '/shop').map((e: any) => e.user_id)).size;

    const onboardingFunnel = [
      { step: 'Regisztráció', users: registeredUsers, dropoffRate: 0 },
      { step: 'Dashboard látogatás', users: visitedDashboard, dropoffRate: registeredUsers > 0 ? ((registeredUsers - visitedDashboard) / registeredUsers) * 100 : 0 },
      { step: 'Első játék', users: playedFirstGame, dropoffRate: visitedDashboard > 0 ? ((visitedDashboard - playedFirstGame) / visitedDashboard) * 100 : 0 },
      { step: 'Első vásárlás', users: madePurchase, dropoffRate: playedFirstGame > 0 ? ((playedFirstGame - madePurchase) / playedFirstGame) * 100 : 0 },
    ];

    const visitedShop = new Set((navEvents || []).filter((e: any) => e.page_route === '/shop').map((e: any) => e.user_id)).size;
    const viewedProduct = new Set((conversionEvents || []).filter((e: any) => e.event_type === 'product_viewed').map((e: any) => e.user_id)).size;
    const addedToCart = new Set((conversionEvents || []).filter((e: any) => e.event_type === 'add_to_cart').map((e: any) => e.user_id)).size;
    const completedPurchase = new Set((conversionEvents || []).filter((e: any) => e.event_type === 'purchase_completed').map((e: any) => e.user_id)).size;

    const purchaseFunnel = [
      { step: 'Bolt látogatás', users: visitedShop, dropoffRate: 0 },
      { step: 'Termék megtekintés', users: viewedProduct, dropoffRate: visitedShop > 0 ? ((visitedShop - viewedProduct) / visitedShop) * 100 : 0 },
      { step: 'Kosárba helyezés', users: addedToCart, dropoffRate: viewedProduct > 0 ? ((viewedProduct - addedToCart) / viewedProduct) * 100 : 0 },
      { step: 'Vásárlás', users: completedPurchase, dropoffRate: addedToCart > 0 ? ((addedToCart - completedPurchase) / addedToCart) * 100 : 0 },
    ];

    const startedGame = new Set((navEvents || []).filter((e: any) => e.page_route === '/game').map((e: any) => e.user_id)).size;
    const reached5Questions = new Set((gameExitEvents || []).filter((e: any) => e.question_index >= 5).map((e: any) => e.user_id)).size;
    const reached10Questions = new Set((gameExitEvents || []).filter((e: any) => e.question_index >= 10).map((e: any) => e.user_id)).size;
    const completedGame = new Set((gameExitEvents || []).filter((e: any) => e.question_index >= 15).map((e: any) => e.user_id)).size;

    const gameFunnel = [
      { step: 'Játék kezdés', users: startedGame, dropoffRate: 0 },
      { step: '5. kérdés elérése', users: reached5Questions, dropoffRate: startedGame > 0 ? ((startedGame - reached5Questions) / startedGame) * 100 : 0 },
      { step: '10. kérdés elérése', users: reached10Questions, dropoffRate: reached5Questions > 0 ? ((reached5Questions - reached10Questions) / reached5Questions) * 100 : 0 },
      { step: 'Játék befejezés', users: completedGame, dropoffRate: reached10Questions > 0 ? ((reached10Questions - completedGame) / reached10Questions) * 100 : 0 },
    ];

    const userPaths = new Map<string, string[]>();
    (navEvents || []).forEach((e: any) => {
      if (!userPaths.has(e.session_id)) userPaths.set(e.session_id, []);
      userPaths.get(e.session_id)!.push(e.page_route);
    });
    const pathCounts = new Map<string, number>();
    userPaths.forEach(path => {
      if (path.length >= 3) {
        const pathStr = path.slice(0, 3).join(' → ');
        pathCounts.set(pathStr, (pathCounts.get(pathStr) || 0) + 1);
      }
    });
    const commonPaths = Array.from(pathCounts.entries()).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10);

    const exitCounts = new Map<string, number>();
    userPaths.forEach(path => {
      if (path.length > 0) {
        const last = path[path.length - 1];
        exitCounts.set(last, (exitCounts.get(last) || 0) + 1);
      }
    });
    const exitPoints = Array.from(exitCounts.entries()).map(([page, exits]) => ({ page, exits })).sort((a, b) => b.exits - a.exits).slice(0, 10);

    return new Response(JSON.stringify({
      onboardingFunnel,
      purchaseFunnel,
      gameFunnel,
      commonPaths,
      exitPoints,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[admin-journey-analytics] Fatal', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});