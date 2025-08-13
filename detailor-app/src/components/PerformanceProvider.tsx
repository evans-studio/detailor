"use client";

import * as React from 'react';
import { usePerformanceMonitoring, analyzeBundleSize } from '@/hooks/usePerformance';

interface PerformanceContextType {
  isEnabled: boolean;
  togglePerformanceMonitoring: () => void;
  analyzeBundleSize: () => void;
}

const PerformanceContext = React.createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return process.env.NODE_ENV === 'development' || 
             localStorage.getItem('performance-monitoring') === 'enabled';
    }
    return false;
  });

  // Enable performance monitoring
  usePerformanceMonitoring(isEnabled);

  const togglePerformanceMonitoring = React.useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('performance-monitoring', newValue ? 'enabled' : 'disabled');
      }
      return newValue;
    });
  }, []);

  const contextValue = React.useMemo(() => ({
    isEnabled,
    togglePerformanceMonitoring,
    analyzeBundleSize,
  }), [isEnabled, togglePerformanceMonitoring]);

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = React.useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// Component for displaying performance metrics in development
export function PerformanceDevTools() {
  const { isEnabled, togglePerformanceMonitoring, analyzeBundleSize } = usePerformance();
  const [isOpen, setIsOpen] = React.useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open performance dev tools"
      >
        ⚡
      </button>

      {/* Dev Tools Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[9999] w-80 bg-white border border-gray-200 rounded-lg shadow-xl">
          <div className="p-4 bg-gray-50 rounded-t-lg border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Performance Tools</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close dev tools"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Web Vitals Monitoring</span>
              <button
                onClick={togglePerformanceMonitoring}
                className={`px-3 py-1 text-xs rounded-full ${
                  isEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            <button
              onClick={analyzeBundleSize}
              className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Analyze Bundle Size
            </button>
            
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Check the browser console for detailed metrics
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}