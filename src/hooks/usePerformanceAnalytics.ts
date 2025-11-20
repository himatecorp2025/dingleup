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

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No session');
        if (!initialLoadRef.current) setLoading(false);
        return;
      }
      
      // Add time filter to reduce data load (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase.functions.invoke('admin-performance-analytics', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { startDate: sevenDaysAgo.toISOString() }
      });
      if (error) throw error;

      setAnalytics(data || null);
    } catch (err) {
      if (!initialLoadRef.current) setError('Failed to load performance analytics');
    } finally {
      if (!initialLoadRef.current && !background) setLoading(false);
      if (!initialLoadRef.current) initialLoadRef.current = true;
    }
  };

  useEffect(() => {
    fetchPerformanceAnalytics(false);

    // Realtime subscriptions (instant, 0 seconds delay)
    const metricsChannel = supabase
      .channel('admin-performance-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'performance_metrics'
      }, () => {
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
        fetchPerformanceAnalytics(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(errorsChannel);
    };
  }, []);

  return { analytics, loading, error, refetch: () => fetchPerformanceAnalytics(true) };
};
