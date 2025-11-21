import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  coins: number;
  lives: number;
  max_lives: number;
  total_correct_answers: number;
  country_code: string;
  preferred_language: string | null;
  daily_gift_streak: number;
  welcome_bonus_claimed: boolean;
}

/**
 * Optimized profile hook with React Query caching
 * Real-time updates instead of manual polling
 */
export const useProfileOptimized = (userId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch profile with cache
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Real-time subscription to profile updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('[useProfileOptimized] Profile updated:', payload);
          
          // Optimistic update
          if (payload.new && typeof payload.new === 'object') {
            queryClient.setQueryData(['profile', userId], payload.new as UserProfile);
          }
          
          // Invalidate for full refetch
          queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return {
    profile,
    loading: isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  };
};
