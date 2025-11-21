import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Optimized for mobile performance with aggressive caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 1 minute before considering it stale
      staleTime: 60 * 1000,
      // Keep data in cache for 5 minutes even if unused (gcTime in v5)
      gcTime: 5 * 60 * 1000,
      // Don't refetch when window regains focus (saves mobile data)
      refetchOnWindowFocus: false,
      // Don't refetch on component remount (uses cache)
      refetchOnMount: false,
      // Only retry failed queries once
      retry: 1,
      // Disable automatic background refetching
      refetchInterval: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
