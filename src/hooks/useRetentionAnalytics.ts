import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RetentionAnalytics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRates: {
    day1: number;
    day7: number;
    day30: number;
  };
  cohortData: Array<{
    cohort: string;
    size: number;
    day1: number;
    day7: number;
    day30: number;
  }>;
  churningUsers: Array<{
    user_id: string;
    username: string;
    last_active: string;
    days_inactive: number;
  }>;
}

export const useRetentionAnalytics = () => {
  const [analytics, setAnalytics] = useState<RetentionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRetentionAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch active users
      const { data: dauData } = await supabase
        .from('app_session_events')
        .select('user_id')
        .gte('created_at', oneDayAgo.toISOString())
        .eq('event_type', 'app_opened');

      const { data: wauData } = await supabase
        .from('app_session_events')
        .select('user_id')
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('event_type', 'app_opened');

      const { data: mauData } = await supabase
        .from('app_session_events')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('event_type', 'app_opened');

      const dau = new Set(dauData?.map(d => d.user_id) || []).size;
      const wau = new Set(wauData?.map(d => d.user_id) || []).size;
      const mau = new Set(mauData?.map(d => d.user_id) || []).size;

      // Fetch user profiles for cohort analysis
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, created_at');

      // Calculate retention rates and cohort data
      const cohortData: Array<{
        cohort: string;
        size: number;
        day1: number;
        day7: number;
        day30: number;
      }> = [];

      const retentionRates = { day1: 0, day7: 0, day30: 0 };

      if (profiles) {
        const cohorts = new Map<string, typeof profiles>();
        profiles.forEach(profile => {
          const cohortMonth = new Date(profile.created_at!).toISOString().slice(0, 7);
          if (!cohorts.has(cohortMonth)) {
            cohorts.set(cohortMonth, []);
          }
          cohorts.get(cohortMonth)!.push(profile);
        });

        for (const [cohortMonth, cohortUsers] of cohorts) {
          const { data: sessionData } = await supabase
            .from('app_session_events')
            .select('user_id, created_at')
            .in('user_id', cohortUsers.map(u => u.id))
            .eq('event_type', 'app_opened');

          const cohortSize = cohortUsers.length;
          let day1Retained = 0;
          let day7Retained = 0;
          let day30Retained = 0;

          cohortUsers.forEach(user => {
            const userSessions = sessionData?.filter(s => s.user_id === user.id) || [];
            const joinDate = new Date(user.created_at!);
            
            const hasDay1Session = userSessions.some(s => {
              const sessionDate = new Date(s.created_at);
              const diffDays = Math.floor((sessionDate.getTime() - joinDate.getTime()) / (24 * 60 * 60 * 1000));
              return diffDays >= 1 && diffDays <= 2;
            });
            
            const hasDay7Session = userSessions.some(s => {
              const sessionDate = new Date(s.created_at);
              const diffDays = Math.floor((sessionDate.getTime() - joinDate.getTime()) / (24 * 60 * 60 * 1000));
              return diffDays >= 7 && diffDays <= 8;
            });
            
            const hasDay30Session = userSessions.some(s => {
              const sessionDate = new Date(s.created_at);
              const diffDays = Math.floor((sessionDate.getTime() - joinDate.getTime()) / (24 * 60 * 60 * 1000));
              return diffDays >= 30 && diffDays <= 31;
            });

            if (hasDay1Session) day1Retained++;
            if (hasDay7Session) day7Retained++;
            if (hasDay30Session) day30Retained++;
          });

          cohortData.push({
            cohort: cohortMonth,
            size: cohortSize,
            day1: cohortSize > 0 ? (day1Retained / cohortSize) * 100 : 0,
            day7: cohortSize > 0 ? (day7Retained / cohortSize) * 100 : 0,
            day30: cohortSize > 0 ? (day30Retained / cohortSize) * 100 : 0,
          });

          retentionRates.day1 += day1Retained;
          retentionRates.day7 += day7Retained;
          retentionRates.day30 += day30Retained;
        }

        const totalUsers = profiles.length;
        if (totalUsers > 0) {
          retentionRates.day1 = (retentionRates.day1 / totalUsers) * 100;
          retentionRates.day7 = (retentionRates.day7 / totalUsers) * 100;
          retentionRates.day30 = (retentionRates.day30 / totalUsers) * 100;
        }
      }

      // Find churning users (no activity in last 7 days)
      const { data: recentSessions } = await supabase
        .from('app_session_events')
        .select('user_id, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('event_type', 'app_opened');

      const activeUserIds = new Set(recentSessions?.map(s => s.user_id) || []);
      
      const churningUsers = profiles
        ?.filter(p => !activeUserIds.has(p.id))
        .map(p => {
          const lastActive = new Date(p.created_at!);
          const daysInactive = Math.floor((now.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000));
          return {
            user_id: p.id,
            username: p.username,
            last_active: lastActive.toISOString(),
            days_inactive: daysInactive,
          };
        })
        .sort((a, b) => b.days_inactive - a.days_inactive)
        .slice(0, 20) || [];

      setAnalytics({
        dailyActiveUsers: dau,
        weeklyActiveUsers: wau,
        monthlyActiveUsers: mau,
        retentionRates,
        cohortData: cohortData.sort((a, b) => b.cohort.localeCompare(a.cohort)),
        churningUsers,
      });
    } catch (err) {
      console.error('Error fetching retention analytics:', err);
      setError('Failed to load retention analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetentionAnalytics();

    // Realtime subscriptions
    const sessionChannel = supabase
      .channel('admin-retention-sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_session_events'
      }, () => {
        console.log('[Retention] Sessions changed, refreshing...');
        fetchRetentionAnalytics();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin-retention-profiles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        console.log('[Retention] Profiles changed, refreshing...');
        fetchRetentionAnalytics();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRetentionAnalytics();
    }, 30000);

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(profilesChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: fetchRetentionAnalytics };
};
