import { useEffect } from 'react';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Hook for tracking Core Web Vitals performance metrics
 * Sends metrics to analytics for performance monitoring
 */
export const useWebVitals = () => {
  useEffect(() => {
    // Only run in production
    if (import.meta.env.DEV) return;

    const reportWebVital = (metric: WebVitalsMetric) => {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value, `(${metric.rating})`);
      
      // Send to analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          value: Math.round(metric.value),
          metric_rating: metric.rating,
          metric_delta: metric.value,
        });
      }
    };

    // Largest Contentful Paint (LCP)
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        const value = lastEntry.renderTime || lastEntry.loadTime;
        const rating = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
        
        reportWebVital({ name: 'LCP', value, rating });
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.debug('[Web Vitals] LCP not supported');
      }
    };

    // First Input Delay (FID)
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const value = entry.processingStart - entry.startTime;
          const rating = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
          
          reportWebVital({ name: 'FID', value, rating });
        });
      });

      try {
        observer.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.debug('[Web Vitals] FID not supported');
      }
    };

    // Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Report CLS on page visibility change
        const reportCLS = () => {
          const rating = clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor';
          reportWebVital({ name: 'CLS', value: clsValue, rating });
        };

        window.addEventListener('visibilitychange', reportCLS, { once: true });
      } catch (e) {
        console.debug('[Web Vitals] CLS not supported');
      }
    };

    observeLCP();
    observeFID();
    observeCLS();
  }, []);
};
