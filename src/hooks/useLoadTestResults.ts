import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LoadTestResult {
  id: string;
  test_type: 'comprehensive' | 'game_only';
  test_date: string;
  total_requests: number;
  failed_requests: number;
  error_rate: number;
  avg_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  current_capacity: number;
  target_capacity: number;
  test_status: 'running' | 'completed' | 'failed';
  metrics: any;
  created_at: string;
  updated_at: string;
}

interface Bottleneck {
  id: string;
  test_result_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  description: string;
  impact: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

interface Optimization {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimated_impact: string;
  status: 'todo' | 'in_progress' | 'done';
  complexity: 'easy' | 'medium' | 'hard';
  implemented_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useLoadTestResults = () => {
  const [latestResult, setLatestResult] = useState<LoadTestResult | null>(null);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest load test result
  const fetchLatestResult = async () => {
    try {
      const { data, error } = await supabase
        .from('load_test_results')
        .select('*')
        .order('test_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('[useLoadTestResults] Error fetching latest result:', error);
        return;
      }

      setLatestResult(data as LoadTestResult);
    } catch (err) {
      console.error('[useLoadTestResults] Fetch error:', err);
    }
  };

  // Fetch bottlenecks
  const fetchBottlenecks = async () => {
    try {
      const { data, error } = await supabase
        .from('load_test_bottlenecks')
        .select('*')
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useLoadTestResults] Error fetching bottlenecks:', error);
        return;
      }

      setBottlenecks((data || []) as Bottleneck[]);
    } catch (err) {
      console.error('[useLoadTestResults] Fetch error:', err);
    }
  };

  // Fetch optimizations
  const fetchOptimizations = async () => {
    try {
      const { data, error } = await supabase
        .from('load_test_optimizations')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useLoadTestResults] Error fetching optimizations:', error);
        return;
      }

      setOptimizations((data || []) as Optimization[]);
    } catch (err) {
      console.error('[useLoadTestResults] Fetch error:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchLatestResult(),
        fetchBottlenecks(),
        fetchOptimizations(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to load_test_results changes
    const resultsChannel = supabase
      .channel('load_test_results_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'load_test_results',
        },
        () => {
          console.log('[useLoadTestResults] Load test results changed, refetching...');
          fetchLatestResult();
        }
      )
      .subscribe();

    // Subscribe to bottlenecks changes
    const bottlenecksChannel = supabase
      .channel('bottlenecks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'load_test_bottlenecks',
        },
        () => {
          console.log('[useLoadTestResults] Bottlenecks changed, refetching...');
          fetchBottlenecks();
        }
      )
      .subscribe();

    // Subscribe to optimizations changes
    const optimizationsChannel = supabase
      .channel('optimizations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'load_test_optimizations',
        },
        () => {
          console.log('[useLoadTestResults] Optimizations changed, refetching...');
          fetchOptimizations();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(bottlenecksChannel);
      supabase.removeChannel(optimizationsChannel);
    };
  }, []);

  return {
    latestResult,
    bottlenecks,
    optimizations,
    loading,
    refetch: async () => {
      await Promise.all([
        fetchLatestResult(),
        fetchBottlenecks(),
        fetchOptimizations(),
      ]);
    },
  };
};
