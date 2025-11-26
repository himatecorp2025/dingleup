import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

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

const ADMIN_GAME_PROFILES_KEY = 'admin-game-profiles';

async function fetchAdminGameProfiles(): Promise<AdminUserGameProfileRow[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session');

  const { data, error } = await supabase.functions.invoke('admin-game-profiles', {
    method: 'GET',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw error;
  return data || [];
}

export function useAdminGameProfilesQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [ADMIN_GAME_PROFILES_KEY],
    queryFn: fetchAdminGameProfiles,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Real-time subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-game-profiles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_results',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [ADMIN_GAME_PROFILES_KEY] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_likes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [ADMIN_GAME_PROFILES_KEY] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_dislikes',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [ADMIN_GAME_PROFILES_KEY] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_question_analytics',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [ADMIN_GAME_PROFILES_KEY] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    profiles: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}
