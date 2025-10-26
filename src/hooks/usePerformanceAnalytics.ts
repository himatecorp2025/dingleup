import { useState, useEffect, useRef } from 'react';
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
  const initialLoadRef = useRef(false);

  const fetchPerformanceAnalytics = async (background = false) => {
    try {
      if (!initialLoadRef.current && !background) setLoading(true);
      if (!initialLoadRef.current) setError(null);

      const { data, error } = await supabase.functions.invoke('admin-performance-analytics');
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      console.error('[Performance] fetch error:', err);
      if (!initialLoadRef.current) setError('Failed to load performance analytics');
    } finally {
      if (!initialLoadRef.current && !background) setLoading(false);
      if (!initialLoadRef.current) initialLoadRef.current = true;
    }
  };

  useEffect(() => {
    fetchPerformanceAnalytics(false);

    // Realtime subscriptions (háttér frissítés)
    const metricsChannel = supabase
      .channel('admin-performance-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'performance_metrics'
      }, () => {
        console.log('[Performance] Metrics changed, background refresh');
        fetchPerformanceAnalytics(true);
      })
      .subscribe();

    const errorsChannel = supabase
      .channel('admin-performance-errors')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'error_logs'
      }, () => {
        console.log('[Performance] Errors changed, background refresh');
        fetchPerformanceAnalytics(true);
      })
      .subscribe();

    // Auto-refresh every 30 seconds (háttérben)
    const interval = setInterval(() => {
      fetchPerformanceAnalytics(true);
    }, 30000);

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(errorsChannel);
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error, refetch: () => fetchPerformanceAnalytics(true) };
};
