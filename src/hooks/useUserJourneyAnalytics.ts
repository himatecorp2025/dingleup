import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserJourneyStep {
  step: string;
  users: number;
  dropoffRate: number;
}

export interface UserJourneyAnalytics {
  onboardingFunnel: UserJourneyStep[];
  purchaseFunnel: UserJourneyStep[];
  gameFunnel: UserJourneyStep[];
  commonPaths: Array<{
    path: string;
    count: number;
  }>;
  exitPoints: Array<{
    page: string;
    exits: number;
  }>;
}

export const useUserJourneyAnalytics = () => {
  const [analytics, setAnalytics] = useState<UserJourneyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserJourneyAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch navigation events
      const { data: navEvents } = await supabase
        .from('navigation_events')
        .select('*')
        .order('created_at', { ascending: true });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, created_at');

      // Onboarding funnel
      const totalUsers = profiles?.length || 0;
      const registeredUsers = totalUsers;
      
      const visitedDashboard = new Set(
        navEvents?.filter(e => e.page_route === '/dashboard').map(e => e.user_id) || []
      ).size;
      
      const playedFirstGame = new Set(
        navEvents?.filter(e => e.page_route === '/game').map(e => e.user_id) || []
      ).size;
      
      const madePurchase = new Set(
        navEvents?.filter(e => e.page_route === '/shop').map(e => e.user_id) || []
      ).size;

      const onboardingFunnel: UserJourneyStep[] = [
        { step: 'Regisztráció', users: registeredUsers, dropoffRate: 0 },
        { 
          step: 'Dashboard látogatás', 
          users: visitedDashboard, 
          dropoffRate: registeredUsers > 0 ? ((registeredUsers - visitedDashboard) / registeredUsers) * 100 : 0 
        },
        { 
          step: 'Első játék', 
          users: playedFirstGame, 
          dropoffRate: visitedDashboard > 0 ? ((visitedDashboard - playedFirstGame) / visitedDashboard) * 100 : 0 
        },
        { 
          step: 'Első vásárlás', 
          users: madePurchase, 
          dropoffRate: playedFirstGame > 0 ? ((playedFirstGame - madePurchase) / playedFirstGame) * 100 : 0 
        },
      ];

      // Purchase funnel
      const visitedShop = new Set(
        navEvents?.filter(e => e.page_route === '/shop').map(e => e.user_id) || []
      ).size;

      const { data: conversionEvents } = await supabase
        .from('conversion_events')
        .select('user_id, event_type');

      const viewedProduct = new Set(
        conversionEvents?.filter(e => e.event_type === 'product_viewed').map(e => e.user_id) || []
      ).size;
      
      const addedToCart = new Set(
        conversionEvents?.filter(e => e.event_type === 'add_to_cart').map(e => e.user_id) || []
      ).size;
      
      const completedPurchase = new Set(
        conversionEvents?.filter(e => e.event_type === 'purchase_completed').map(e => e.user_id) || []
      ).size;

      const purchaseFunnel: UserJourneyStep[] = [
        { step: 'Bolt látogatás', users: visitedShop, dropoffRate: 0 },
        { 
          step: 'Termék megtekintés', 
          users: viewedProduct, 
          dropoffRate: visitedShop > 0 ? ((visitedShop - viewedProduct) / visitedShop) * 100 : 0 
        },
        { 
          step: 'Kosárba helyezés', 
          users: addedToCart, 
          dropoffRate: viewedProduct > 0 ? ((viewedProduct - addedToCart) / viewedProduct) * 100 : 0 
        },
        { 
          step: 'Vásárlás', 
          users: completedPurchase, 
          dropoffRate: addedToCart > 0 ? ((addedToCart - completedPurchase) / addedToCart) * 100 : 0 
        },
      ];

      // Game funnel
      const { data: gameExitEvents } = await supabase
        .from('game_exit_events')
        .select('*');

      const startedGame = new Set(navEvents?.filter(e => e.page_route === '/game').map(e => e.user_id) || []).size;
      const reached5Questions = new Set(
        gameExitEvents?.filter(e => e.question_index >= 5).map(e => e.user_id) || []
      ).size;
      const reached10Questions = new Set(
        gameExitEvents?.filter(e => e.question_index >= 10).map(e => e.user_id) || []
      ).size;
      const completedGame = new Set(
        gameExitEvents?.filter(e => e.question_index >= 15).map(e => e.user_id) || []
      ).size;

      const gameFunnel: UserJourneyStep[] = [
        { step: 'Játék kezdés', users: startedGame, dropoffRate: 0 },
        { 
          step: '5. kérdés elérése', 
          users: reached5Questions, 
          dropoffRate: startedGame > 0 ? ((startedGame - reached5Questions) / startedGame) * 100 : 0 
        },
        { 
          step: '10. kérdés elérése', 
          users: reached10Questions, 
          dropoffRate: reached5Questions > 0 ? ((reached5Questions - reached10Questions) / reached5Questions) * 100 : 0 
        },
        { 
          step: 'Játék befejezés', 
          users: completedGame, 
          dropoffRate: reached10Questions > 0 ? ((reached10Questions - completedGame) / reached10Questions) * 100 : 0 
        },
      ];

      // Common paths
      const userPaths = new Map<string, string[]>();
      navEvents?.forEach(event => {
        if (!userPaths.has(event.session_id)) {
          userPaths.set(event.session_id, []);
        }
        userPaths.get(event.session_id)!.push(event.page_route);
      });

      const pathCounts = new Map<string, number>();
      userPaths.forEach(path => {
        if (path.length >= 3) {
          const pathStr = path.slice(0, 3).join(' → ');
          pathCounts.set(pathStr, (pathCounts.get(pathStr) || 0) + 1);
        }
      });

      const commonPaths = Array.from(pathCounts.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Exit points
      const exitCounts = new Map<string, number>();
      userPaths.forEach(path => {
        if (path.length > 0) {
          const lastPage = path[path.length - 1];
          exitCounts.set(lastPage, (exitCounts.get(lastPage) || 0) + 1);
        }
      });

      const exitPoints = Array.from(exitCounts.entries())
        .map(([page, exits]) => ({ page, exits }))
        .sort((a, b) => b.exits - a.exits)
        .slice(0, 10);

      setAnalytics({
        onboardingFunnel,
        purchaseFunnel,
        gameFunnel,
        commonPaths,
        exitPoints,
      });
    } catch (err) {
      console.error('Error fetching user journey analytics:', err);
      setError('Failed to load user journey analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserJourneyAnalytics();

    // Realtime subscriptions
    const navChannel = supabase
      .channel('admin-journey-nav')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'navigation_events'
      }, () => {
        console.log('[UserJourney] Navigation changed, refreshing...');
        fetchUserJourneyAnalytics();
      })
      .subscribe();

    const conversionChannel = supabase
      .channel('admin-journey-conversion')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversion_events'
      }, () => {
        console.log('[UserJourney] Conversion changed, refreshing...');
        fetchUserJourneyAnalytics();
      })
      .subscribe();

    const exitChannel = supabase
      .channel('admin-journey-exit')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_exit_events'
      }, () => {
        console.log('[UserJourney] Game exits changed, refreshing...');
        fetchUserJourneyAnalytics();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUserJourneyAnalytics();
    }, 30000);

    return () => {
      supabase.removeChannel(navChannel);
      supabase.removeChannel(conversionChannel);
      supabase.removeChannel(exitChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: fetchUserJourneyAnalytics };
};
