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

      // Fetch performance metrics
      const { data: perfMetrics } = await supabase
        .from('performance_metrics')
        .select('*');

      // Calculate overall metrics
      const overallMetrics = {
        avgLoadTime: 0,
        avgTTFB: 0,
        avgLCP: 0,
        avgCLS: 0,
      };

      if (perfMetrics && perfMetrics.length > 0) {
        overallMetrics.avgLoadTime = Math.round(
          perfMetrics.reduce((sum, m) => sum + (m.load_time_ms || 0), 0) / perfMetrics.length
        );
        overallMetrics.avgTTFB = Math.round(
          perfMetrics.reduce((sum, m) => sum + (m.ttfb_ms || 0), 0) / perfMetrics.length
        );
        overallMetrics.avgLCP = Math.round(
          perfMetrics.reduce((sum, m) => sum + (m.lcp_ms || 0), 0) / perfMetrics.length
        );
        overallMetrics.avgCLS = Number(
          (perfMetrics.reduce((sum, m) => sum + (Number(m.cls) || 0), 0) / perfMetrics.length).toFixed(3)
        );
      }

      // Performance by page
      const { data: perfByPage } = await supabase
        .from('performance_by_page')
        .select('*')
        .order('sample_count', { ascending: false })
        .limit(10);

      // Performance by device
      const deviceMap = new Map<string, { total: number; count: number }>();
      perfMetrics?.forEach(m => {
        const device = m.device_type || 'unknown';
        const current = deviceMap.get(device) || { total: 0, count: 0 };
        current.total += m.load_time_ms || 0;
        current.count += 1;
        deviceMap.set(device, current);
      });

      const performanceByDevice = Array.from(deviceMap.entries()).map(([device_type, data]) => ({
        device_type,
        avg_load_time: Math.round(data.total / data.count),
        sample_count: data.count,
      }));

      // Performance by browser
      const browserMap = new Map<string, { total: number; count: number }>();
      perfMetrics?.forEach(m => {
        const browser = m.browser || 'unknown';
        const current = browserMap.get(browser) || { total: 0, count: 0 };
        current.total += m.load_time_ms || 0;
        current.count += 1;
        browserMap.set(browser, current);
      });

      const performanceByBrowser = Array.from(browserMap.entries()).map(([browser, data]) => ({
        browser,
        avg_load_time: Math.round(data.total / data.count),
        sample_count: data.count,
      }));

      // Errors by page
      const { data: errorsByPage } = await supabase
        .from('error_rate_by_page')
        .select('*')
        .order('error_count', { ascending: false })
        .limit(10);

      // Top errors
      const { data: errorLogs } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const errorCountMap = new Map<string, { message: string; count: number; last: string }>();
      errorLogs?.forEach(log => {
        const key = log.error_type;
        const current = errorCountMap.get(key) || { message: log.error_message, count: 0, last: log.created_at };
        current.count += 1;
        if (new Date(log.created_at) > new Date(current.last)) {
          current.last = log.created_at;
        }
        errorCountMap.set(key, current);
      });

      const topErrors = Array.from(errorCountMap.entries())
        .map(([error_type, data]) => ({
          error_type,
          error_message: data.message,
          count: data.count,
          last_occurrence: data.last,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setAnalytics({
        overallMetrics,
        performanceByPage: perfByPage || [],
        performanceByDevice,
        performanceByBrowser,
        errorsByPage: errorsByPage || [],
        topErrors,
      });
    } catch (err) {
      console.error('Error fetching performance analytics:', err);
      setError('Failed to load performance analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceAnalytics();
  }, []);

  return { analytics, loading, error, refetch: fetchPerformanceAnalytics };
};
