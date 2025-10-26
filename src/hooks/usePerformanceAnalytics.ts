import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceAnalytics {
  overallMetrics: {
    avgLoadTime: number;
    avgTTFB: number;
    avgLCP: number;
    avgCLS: number;
  };
  performanceByPage: Array<{
    page_route: string;
    avg_load_time_ms: number;
    median_load_time_ms: number;
    p95_load_time_ms: number;
    sample_count: number;
  }>;
  performanceByDevice: Array<{
    device_type: string;
    avg_load_time: number;
    sample_count: number;
  }>;
  performanceByBrowser: Array<{
    browser: string;
    avg_load_time: number;
    sample_count: number;
  }>;
  errorsByPage: Array<{
    page_route: string;
    error_type: string;
    error_count: number;
    affected_users: number;
  }>;
  topErrors: Array<{
    error_type: string;
    error_message: string;
    count: number;
    last_occurrence: string;
  }>;
}

export const usePerformanceAnalytics = () => {
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('admin-performance-analytics');
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      console.error('Error fetching performance analytics:', err);
      setError('Failed to load performance analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceAnalytics();

    // Realtime subscriptions
    const metricsChannel = supabase
      .channel('admin-performance-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'performance_metrics'
      }, () => {
        console.log('[Performance] Metrics changed, refreshing...');
        fetchPerformanceAnalytics();
      })
      .subscribe();

    const errorsChannel = supabase
      .channel('admin-performance-errors')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'error_logs'
      }, () => {
        console.log('[Performance] Errors changed, refreshing...');
        fetchPerformanceAnalytics();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPerformanceAnalytics();
    }, 30000);

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(errorsChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: fetchPerformanceAnalytics };
};
