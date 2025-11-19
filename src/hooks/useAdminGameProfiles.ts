import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUserGameProfileRow {
  userId: string;
  username: string;
  totalAnswered: number;
  overallCorrectRatio: number;
  totalLikes: number;
  totalDislikes: number;
  aiPersonalizedQuestionsEnabled: boolean;
  personalizationActive: boolean;
  topTopics: {
    topicId: string;
    topicName: string;
    score: number;
  }[];
}

export function useAdminGameProfiles() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<AdminUserGameProfileRow[]>([]);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke(
        'admin-game-profiles',
        { method: 'GET' }
      );

      if (invokeError) throw invokeError;
      setProfiles(data || []);
    } catch (err) {
      console.error('[useAdminGameProfiles] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();

    // Realtime subscriptions for automatic updates
    const gameResultsChannel = supabase
      .channel('admin-game-profiles-results')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_results'
      }, () => {
        fetchProfiles();
      })
      .subscribe();

    const likesChannel = supabase
      .channel('admin-game-profiles-likes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'question_likes'
      }, () => {
        fetchProfiles();
      })
      .subscribe();

    const dislikesChannel = supabase
      .channel('admin-game-profiles-dislikes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'question_dislikes'
      }, () => {
        fetchProfiles();
      })
      .subscribe();

    const analyticsChannel = supabase
      .channel('admin-game-profiles-analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_question_analytics'
      }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(gameResultsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(dislikesChannel);
      supabase.removeChannel(analyticsChannel);
    };
  }, [fetchProfiles]);

  return {
    loading,
    error,
    profiles,
    refetch: fetchProfiles,
  };
}

export function useAdminGameProfileDetail(userId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke(
        `admin-game-profile-detail?userId=${userId}`,
        { method: 'GET' }
      );

      if (invokeError) throw invokeError;
      setProfile(data);
    } catch (err) {
      console.error('[useAdminGameProfileDetail] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    loading,
    error,
    profile,
    refetch: fetchProfile,
  };
}
