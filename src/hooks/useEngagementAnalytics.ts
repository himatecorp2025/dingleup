import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EngagementAnalytics {
  avgSessionDuration: number;
  avgSessionsPerUser: number;
  totalSessions: number;
  featureUsage: Array<{
    feature_name: string;
    usage_count: number;
    unique_users: number;
  }>;
  engagementByTime: Array<{
    hour: number;
    sessions: number;
  }>;
  mostActiveUsers: Array<{
    user_id: string;
    username: string;
    session_count: number;
    total_duration: number;
  }>;
  gameEngagement: {
    avgGamesPerUser: number;
    avgCorrectAnswers: number;
    mostPlayedCategories: Array<{
      category: string;
      count: number;
    }>;
  };
}

export const useEngagementAnalytics = () => {
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEngagementAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch session events
      const { data: sessionEvents } = await supabase
        .from('app_session_events')
        .select('*');

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username');

      // Calculate session metrics
      const sessionMap = new Map<string, number[]>();
      sessionEvents?.forEach(event => {
        if (event.session_duration_seconds) {
          if (!sessionMap.has(event.user_id)) {
            sessionMap.set(event.user_id, []);
          }
          sessionMap.get(event.user_id)!.push(event.session_duration_seconds);
        }
      });

      const totalSessions = Array.from(sessionMap.values()).reduce((sum, sessions) => sum + sessions.length, 0);
      const totalDuration = Array.from(sessionMap.values()).reduce(
        (sum, sessions) => sum + sessions.reduce((s, d) => s + d, 0),
        0
      );
      const avgSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
      const avgSessionsPerUser = sessionMap.size > 0 ? Math.round(totalSessions / sessionMap.size) : 0;

      // Feature usage
      const { data: featureEvents } = await supabase
        .from('feature_usage_events')
        .select('feature_name, user_id');

      const featureUsageMap = new Map<string, Set<string>>();
      featureEvents?.forEach(event => {
        if (!featureUsageMap.has(event.feature_name)) {
          featureUsageMap.set(event.feature_name, new Set());
        }
        featureUsageMap.get(event.feature_name)!.add(event.user_id);
      });

      const featureUsage = Array.from(featureUsageMap.entries())
        .map(([feature_name, users]) => ({
          feature_name,
          usage_count: users.size,
          unique_users: users.size,
        }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10);

      // Engagement by time
      const hourlyEngagement = new Array(24).fill(0);
      sessionEvents?.forEach(event => {
        const hour = new Date(event.created_at).getHours();
        hourlyEngagement[hour]++;
      });

      const engagementByTime = hourlyEngagement.map((sessions, hour) => ({
        hour,
        sessions,
      }));

      // Most active users
      const mostActiveUsers = Array.from(sessionMap.entries())
        .map(([user_id, durations]) => {
          const profile = profiles?.find(p => p.id === user_id);
          return {
            user_id,
            username: profile?.username || 'Unknown',
            session_count: durations.length,
            total_duration: durations.reduce((sum, d) => sum + d, 0),
          };
        })
        .sort((a, b) => b.session_count - a.session_count)
        .slice(0, 10);

      // Game engagement
      const { data: gameResults } = await supabase
        .from('game_results')
        .select('*');

      const gamesPerUser = new Map<string, number>();
      const categoryCount = new Map<string, number>();
      let totalCorrectAnswers = 0;

      gameResults?.forEach(game => {
        gamesPerUser.set(game.user_id, (gamesPerUser.get(game.user_id) || 0) + 1);
        categoryCount.set(game.category, (categoryCount.get(game.category) || 0) + 1);
        totalCorrectAnswers += game.correct_answers;
      });

      const avgGamesPerUser = gamesPerUser.size > 0 ? 
        Array.from(gamesPerUser.values()).reduce((sum, count) => sum + count, 0) / gamesPerUser.size : 0;
      const avgCorrectAnswers = gameResults && gameResults.length > 0 ? 
        totalCorrectAnswers / gameResults.length : 0;

      const mostPlayedCategories = Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        avgSessionDuration,
        avgSessionsPerUser,
        totalSessions,
        featureUsage,
        engagementByTime,
        mostActiveUsers,
        gameEngagement: {
          avgGamesPerUser: Math.round(avgGamesPerUser * 10) / 10,
          avgCorrectAnswers: Math.round(avgCorrectAnswers * 10) / 10,
          mostPlayedCategories,
        },
      });
    } catch (err) {
      console.error('Error fetching engagement analytics:', err);
      setError('Failed to load engagement analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagementAnalytics();
  }, []);

  return { analytics, loading, error, refetch: fetchEngagementAnalytics };
};
