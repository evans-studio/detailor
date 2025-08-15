"use client";
import * as React from 'react';

export type StatChangeType = 'increase' | 'decrease' | 'neutral';

export interface StatCardProps {
  title: string;
  value?: React.ReactNode;
  change?: string | number;
  changeType?: StatChangeType;
  icon?: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  error?: string | null;
  className?: string;
  'data-testid'?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  loading = false,
  emptyMessage = 'No data',
  error = null,
  className,
  ...rest
}: StatCardProps) {
  const statusColor = React.useMemo(() => {
    switch (changeType) {
      case 'increase':
        return 'text-[var(--color-success)]';
      case 'decrease':
        return 'text-[var(--color-error)]';
      default:
        return 'text-[var(--color-text-muted)]';
    }
  }, [changeType]);

  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] ${className || ''}`}
      {...rest}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">{title}</div>
          {loading ? (
            <div role="status" aria-label="Loading statistic" className="mt-2">
              <div className="h-7 w-28 rounded bg-[var(--color-active-surface)] animate-pulse" />
            </div>
          ) : error ? (
            <div className="mt-2 text-[var(--color-error)]" aria-live="polite">{error}</div>
          ) : value == null || value === '' ? (
            <div className="mt-2 text-[var(--color-text-muted)]">{emptyMessage}</div>
          ) : (
            <div className="mt-1 text-[var(--font-size-3xl)] font-[var(--font-weight-bold)] text-[var(--color-text)]" data-testid="stat-value">{value}</div>
          )}
          {!loading && !error && change !== undefined && (
            <div className={`mt-1 text-[var(--font-size-sm)] ${statusColor}`} data-testid="stat-change">
              {changeType === 'increase' ? '▲ ' : changeType === 'decrease' ? '▼ ' : ''}
              {change}
            </div>
          )}
        </div>
        {icon ? (
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-50)] text-[var(--color-primary)] grid place-items-center">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}


