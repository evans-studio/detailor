"use client";

import * as React from 'react';
import { Card, CardContent } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

// Modern KPI Card Variants with Brand System
const kpiCardStyles = cva(
  [
    'relative overflow-hidden group cursor-pointer',
    'transition-all duration-200 ease-out',
    'will-change-transform hover:scale-[1.02]',
    'rounded-xl border shadow-sm hover:shadow-lg',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white border-gray-200',
          'hover:border-gray-300',
        ],
        primary: [
          'bg-gradient-to-br from-blue-500 to-blue-600',
          'border-blue-600 text-white shadow-blue-500/20',
          'hover:shadow-blue-500/30',
        ],
        success: [
          'bg-gradient-to-br from-green-500 to-green-600',
          'border-green-600 text-white shadow-green-500/20',
          'hover:shadow-green-500/30',
        ],
        warning: [
          'bg-gradient-to-br from-amber-500 to-amber-600',
          'border-amber-600 text-white shadow-amber-500/20',
          'hover:shadow-amber-500/30',
        ],
        error: [
          'bg-gradient-to-br from-red-500 to-red-600',
          'border-red-600 text-white shadow-red-500/20',
          'hover:shadow-red-500/30',
        ],
      },
      size: {
        sm: 'min-h-[120px] sm:min-h-[140px]', // Shorter on mobile
        md: 'min-h-[140px] sm:min-h-[160px]',
        lg: 'min-h-[160px] sm:min-h-[180px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Icons for different KPI types
const TrendUpIcon = ({ className }: { className?: string }) => (
  <svg className={twMerge('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = ({ className }: { className?: string }) => (
  <svg className={twMerge('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={twMerge('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CurrencyIcon = ({ className }: { className?: string }) => (
  <svg className={twMerge('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={twMerge('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const iconMap = {
  bookings: CalendarIcon,
  revenue: CurrencyIcon,
  customers: UsersIcon,
  default: CalendarIcon,
};

export interface KPIData {
  label: string;
  value: string | number;
  previousValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendPercentage?: number;
  trendLabel?: string;
  icon?: keyof typeof iconMap;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  onClick?: () => void;
}

export function KPICard({
  label,
  value,
  previousValue,
  trend,
  trendPercentage,
  trendLabel,
  icon = 'default',
  loading = false,
  variant = 'default',
  size = 'md',
  subtitle,
  onClick,
}: KPIData) {
  const IconComponent = iconMap[icon];
  const isColored = variant !== 'default';
  
  // Format value for display
  const displayValue = React.useMemo(() => {
    if (loading) return '—';
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  }, [value, loading]);

  // Calculate trend data
  const trendData = React.useMemo(() => {
    if (!previousValue || !trendPercentage) return null;
    
    return {
      percentage: Math.abs(trendPercentage),
      direction: trend || (trendPercentage > 0 ? 'up' : 'down'),
      label: trendLabel || `vs ${previousValue}`,
    };
  }, [previousValue, trendPercentage, trend, trendLabel]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      // Add ripple effect
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      e.currentTarget.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
      
      onClick();
    }
  };

  return (
    <Card 
      className={twMerge(
        kpiCardStyles({ variant, size }),
        'animate-fade-scale touch-feedback gpu-accelerated' // Add premium animations
      )}
      onClick={handleClick}
      variant={onClick ? 'interactive' : 'elevated'}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      {/* Modern Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-40 h-40 transform translate-x-10 -translate-y-10">
          <div className="w-full h-full rounded-full bg-gradient-radial from-white via-white to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-24 transform -translate-x-6 translate-y-6">
          <div className="w-full h-full rounded-full bg-gradient-radial from-white via-white to-transparent opacity-30" />
        </div>
      </div>

      <CardContent className="relative p-4 sm:p-6 h-full flex flex-col">
        {/* Header with Icon and Label - Mobile Optimized */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`
              p-2 sm:p-3 rounded-lg transition-all duration-200
              ${isColored 
                ? 'bg-white/20 text-white backdrop-blur-sm' 
                : 'bg-blue-50 text-blue-600'
              }
              group-hover:scale-110 group-hover:rotate-2
            `}>
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`
                text-xs sm:text-sm font-semibold mb-1 truncate
                ${isColored ? 'text-white/95' : 'text-gray-600'}
              `}>
                {label}
              </h3>
              {subtitle && (
                <p className={`
                  text-xs leading-tight line-clamp-2
                  ${isColored ? 'text-white/75' : 'text-gray-500'}
                `}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {loading && (
            <div className="animate-pulse">
              <div className="h-2 w-16 bg-current opacity-20 rounded" />
            </div>
          )}
        </div>

        {/* Main Value - Responsive Text */}
        <div className="flex-1 flex items-center py-1 sm:py-2">
          <div className={`
            text-2xl sm:text-3xl font-bold leading-none
            ${isColored ? 'text-white' : 'text-gray-900'}
            transition-transform group-hover:scale-105
          `}>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 w-16 sm:w-20 bg-current opacity-20 rounded" />
              </div>
            ) : (
              displayValue
            )}
          </div>
        </div>

        {/* Trend Indicator - Mobile Friendly */}
        {trendData && !loading && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-auto pt-3 sm:pt-4">
            <div className={`
              flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium text-xs self-start
              ${isColored 
                ? 'bg-white/20 text-white backdrop-blur-sm' 
                : trend === 'up' 
                  ? 'bg-green-100 text-green-700'
                  : trend === 'down'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
              }
            `}>
              {trendData.direction === 'up' ? (
                <TrendUpIcon className="h-3 w-3" />
              ) : trendData.direction === 'down' ? (
                <TrendDownIcon className="h-3 w-3" />
              ) : null}
              <span className="font-semibold">
                {trendData.percentage}%
              </span>
            </div>
            
            <span className={`
              text-xs font-medium truncate
              ${isColored ? 'text-white/80' : 'text-gray-500'}
            `}>
              {trendData.label}
            </span>
          </div>
        )}

        {/* Status Indicator */}
        {variant !== 'default' && !loading && (
          <div className="absolute top-4 right-4">
            <div className={`
              w-2 h-2 rounded-full
              ${isColored ? 'bg-white/60' : 'bg-green-500'}
              animate-pulse
            `} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mobile-First Responsive Grid container for KPI cards with animations
export function KPIGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={twMerge(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      'gap-4 sm:gap-6', // Smaller gap on mobile
      'auto-rows-fr', // Ensure equal height cards
      'stagger-children', // Add staggered animation
      className
    )}>
      {children}
    </div>
  );
}

// Modern loading skeleton for KPI cards
export function KPICardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <KPIGrid>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
          <Card className="min-h-[160px] border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24 mb-6" />
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-3 bg-gray-200 rounded w-12" />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </KPIGrid>
  );
}