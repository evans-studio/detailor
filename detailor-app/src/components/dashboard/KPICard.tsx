"use client";

import * as React from 'react';
import { Card, CardContent } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

// Enterprise KPI Card Variants
const kpiCardStyles = cva(
  [
    'relative overflow-hidden ripple-container focus-ring',
    'card-hover group cursor-pointer animate-scale-in',
    'will-change-transform',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-muted)]',
          'border-[var(--color-border)]',
        ],
        primary: [
          'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-600)]',
          'border-[var(--color-primary-600)] text-white',
        ],
        success: [
          'bg-gradient-to-br from-[var(--color-success)] to-[var(--color-success-600)]',
          'border-[var(--color-success-600)] text-white',
        ],
        warning: [
          'bg-gradient-to-br from-[var(--color-warning)] to-[var(--color-warning-600)]',
          'border-[var(--color-warning-600)] text-white',
        ],
        error: [
          'bg-gradient-to-br from-[var(--color-error)] to-[var(--color-error-600)]',
          'border-[var(--color-error-600)] text-white',
        ],
      },
      size: {
        sm: 'min-h-[120px]',
        md: 'min-h-[140px]',
        lg: 'min-h-[160px]',
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
      className={twMerge(kpiCardStyles({ variant, size }))}
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
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-transparent opacity-20" />
        </div>
      </div>

      <CardContent className="relative p-6 h-full flex flex-col justify-between">
        {/* Header with Icon and Label */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-[var(--radius-md)] transition-smooth
              ${isColored 
                ? 'bg-white/20 text-white' 
                : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              }
              group-hover:scale-110 group-hover:rotate-3 animate-delay-100
            `}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`
                text-[var(--font-size-sm)] font-[var(--font-weight-medium)]
                ${isColored ? 'text-white/90' : 'text-[var(--color-text-muted)]'}
              `}>
                {label}
              </h3>
              {subtitle && (
                <p className={`
                  text-[var(--font-size-xs)] mt-0.5
                  ${isColored ? 'text-white/70' : 'text-[var(--color-text-subtle)]'}
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

        {/* Main Value */}
        <div className="flex-1 flex items-center">
          <div className={`
            text-[var(--font-size-4xl)] font-[var(--font-weight-bold)] leading-none
            ${isColored ? 'text-white' : 'text-[var(--color-text)]'}
            transition-transform group-hover:scale-105
          `}>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-10 w-24 bg-current opacity-20 rounded" />
              </div>
            ) : (
              displayValue
            )}
          </div>
        </div>

        {/* Trend Indicator */}
        {trendData && !loading && (
          <div className="flex items-center justify-between mt-4">
            <div className={`
              flex items-center gap-2 px-2 py-1 rounded-[var(--radius-full)]
              ${isColored 
                ? 'bg-white/20 text-white' 
                : trend === 'up' 
                  ? 'bg-[var(--color-success-50)] text-[var(--color-success)]'
                  : trend === 'down'
                    ? 'bg-[var(--color-error-50)] text-[var(--color-error)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-text-muted)]'
              }
            `}>
              {trendData.direction === 'up' ? (
                <TrendUpIcon className="h-3 w-3" />
              ) : trendData.direction === 'down' ? (
                <TrendDownIcon className="h-3 w-3" />
              ) : null}
              <span className="text-[var(--font-size-xs)] font-[var(--font-weight-medium)]">
                {trendData.percentage}%
              </span>
            </div>
            
            <span className={`
              text-[var(--font-size-xs)]
              ${isColored ? 'text-white/70' : 'text-[var(--color-text-muted)]'}
            `}>
              {trendData.label}
            </span>
          </div>
        )}

        {/* Status Badge */}
        {variant !== 'default' && !loading && (
          <div className="absolute top-4 right-4">
            <Badge 
              variant={isColored ? 'outline' : variant}
              size="sm"
              className={isColored ? 'border-white/30 text-white' : ''}
            >
              Live
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Grid container for KPI cards
export function KPIGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={twMerge(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children',
      className
    )}>
      {children}
    </div>
  );
}

// Loading skeleton for KPI cards
export function KPICardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <KPIGrid>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
          <Card className="min-h-[140px] animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 skeleton rounded-[var(--radius-md)]" />
                <div className="h-4 skeleton rounded w-24" />
              </div>
              <div className="h-10 skeleton rounded w-20 mb-4" />
              <div className="flex items-center justify-between">
                <div className="h-6 skeleton rounded w-16" />
                <div className="h-3 skeleton rounded w-12" />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </KPIGrid>
  );
}