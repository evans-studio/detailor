"use client";
import * as React from 'react';
import { ChartCard } from './ChartCard';

export type Period = '7d' | '30d' | '90d' | '365d';

export interface RevenuePoint { date: string; revenue: number; revenue_prev?: number }

export interface RevenueChartProps {
  period?: Period;
  onPeriodChange?: (p: Period) => void;
  comparison?: boolean;
  loading?: boolean;
  error?: string | null;
  data?: RevenuePoint[];
}

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last 12 months' },
];

export function RevenueChart({ period = '30d', onPeriodChange, comparison = true, loading = false, error = null, data = [] }: RevenueChartProps) {
  const categories = data.map((d) => d.date);
  const current = data.map((d) => d.revenue || 0);
  const previous = data.map((d) => d.revenue_prev || 0);
  const series = comparison ? [
    { name: 'Revenue', data: current },
    { name: 'Previous', data: previous },
  ] : [
    { name: 'Revenue', data: current },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[var(--color-text)] font-[var(--font-weight-semibold)]">Revenue</div>
        <div className="flex items-center gap-2">
          <label className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">Period</label>
          <select
            className="px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            value={period}
            onChange={(e) => onPeriodChange?.(e.target.value as Period)}
            aria-label="Select period"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-[var(--color-text-muted)] text-[var(--font-size-sm)]">
            <input type="checkbox" checked={comparison} onChange={() => onPeriodChange?.(period)} aria-label="Toggle comparison" />
            Compare
          </label>
        </div>
      </div>
      <ChartCard
        title=""
        type="line"
        categories={categories}
        series={series}
        loading={loading}
        error={error}
        emptyMessage="No revenue data"
        height={260}
      />
      {/* Expose category labels for a11y/tests */}
      <div className="sr-only">{categories.join(' ')}</div>
    </div>
  );
}


