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
