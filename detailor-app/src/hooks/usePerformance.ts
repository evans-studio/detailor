"use client";

import { useEffect } from 'react';

// Web Vitals metrics interface
interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Performance observer for tracking various metrics
export function usePerformanceMonitoring(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Track Web Vitals
    const trackWebVitals = async () => {
      try {
        const webVitals = await import('web-vitals');
        
        const sendToAnalytics = (metric: WebVitalsMetric) => {
          // Send to your analytics service (Sentry, Google Analytics, etc.)
          console.log('Web Vitals:', metric);
          
          // Example: Send to Sentry
          if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.addBreadcrumb({
              category: 'performance',
              message: `${metric.name}: ${metric.value}`,
              level: 'info',
              data: metric,
            });
          }
        };

        // Track all core web vitals using web-vitals v5 API
        if (webVitals.onCLS) webVitals.onCLS(sendToAnalytics);
        if (webVitals.onINP) webVitals.onINP(sendToAnalytics); // INP replaces FID in v5
        if (webVitals.onFCP) webVitals.onFCP(sendToAnalytics);
        if (webVitals.onLCP) webVitals.onLCP(sendToAnalytics);
        if (webVitals.onTTFB) webVitals.onTTFB(sendToAnalytics);
      } catch (error) {
        console.warn('Web Vitals tracking failed:', error);
      }
    };

    trackWebVitals();

    // Track custom performance metrics
    const trackCustomMetrics = () => {
      if ('performance' in window) {
        // Track navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            domInteractive: navigation.domInteractive - navigation.fetchStart,
            loadComplete: navigation.loadEventEnd - navigation.fetchStart,
            firstByte: navigation.responseStart - navigation.requestStart,
          };
          
          console.log('Custom Performance Metrics:', metrics);
        }

        // Track resource timing for critical resources
        const resources = performance.getEntriesByType('resource');
        const criticalResources = resources.filter((resource) => 
          resource.name.includes('.css') || 
          resource.name.includes('.js') ||
          resource.name.includes('/api/')
        );
        
        if (criticalResources.length > 0) {
          console.log('Critical Resource Timings:', criticalResources.map(r => ({
            name: r.name,
            duration: r.duration,
            size: (r as PerformanceResourceTiming).transferSize,
          })));
        }
      }
    };

    // Track memory usage (if available)
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory Usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        });
      }
    };

    // Run custom tracking after page load
    if (document.readyState === 'complete') {
      trackCustomMetrics();
      trackMemoryUsage();
    } else {
      window.addEventListener('load', () => {
        trackCustomMetrics();
        trackMemoryUsage();
      });
    }

    // Track layout shifts
    if ('PerformanceObserver' in window) {
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Type assertion for layout shift entry
            const layoutShiftEntry = entry as any;
            if (!layoutShiftEntry.hadRecentInput) {
              console.log('Layout Shift:', layoutShiftEntry.value);
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

        // Track long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('Long Task:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

        return () => {
          layoutShiftObserver.disconnect();
          longTaskObserver.disconnect();
        };
      } catch (error) {
        console.warn('Performance Observer setup failed:', error);
      }
    }
  }, [enabled]);
}

// Hook for tracking component render performance
export function useRenderPerformance(componentName: string, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // Flag renders slower than 16ms (60fps threshold)
        console.log(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
}

// Hook for tracking API call performance
export function useAPIPerformance() {
  const trackAPICall = (url: string, startTime: number, endTime: number, success: boolean) => {
    const duration = endTime - startTime;
    
    console.log('API Call Performance:', {
      url,
      duration: duration.toFixed(2),
      success,
      timestamp: new Date().toISOString(),
    });
    
    // Track slow API calls
    if (duration > 1000) {
      console.warn(`Slow API call detected: ${url} took ${duration.toFixed(2)}ms`);
    }
  };

  return { trackAPICall };
}

// Bundle size analysis utility
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const jsResources = resources.filter(r => r.name.endsWith('.js'));
  const cssResources = resources.filter(r => r.name.endsWith('.css'));
  
  const jsSize = jsResources.reduce((total, r) => total + (r.transferSize || 0), 0);
  const cssSize = cssResources.reduce((total, r) => total + (r.transferSize || 0), 0);
  
  console.log('Bundle Analysis:', {
    totalJS: Math.round(jsSize / 1024) + 'KB',
    totalCSS: Math.round(cssSize / 1024) + 'KB',
    jsFiles: jsResources.length,
    cssFiles: cssResources.length,
    largestJS: jsResources.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))[0],
    largestCSS: cssResources.sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))[0],
  });
}

// Core Web Vitals thresholds for monitoring
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint (replaces FID)
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
} as const;