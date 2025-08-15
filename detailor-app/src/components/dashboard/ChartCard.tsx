"use client";
import * as React from 'react';

type Series = { name: string; data: number[] };
export type ChartType = 'line' | 'bar' | 'pie';

export interface ChartCardProps {
  title: string;
  type: ChartType;
  categories?: string[]; // x-axis labels
  series: Series[]; // for pie, one series where data indexes map to categories
  height?: number;
  loading?: boolean;
  emptyMessage?: string;
  error?: string | null;
  className?: string;
}

const SERIES_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-info)',
  'var(--color-error)',
  'var(--color-primary-700)'
];

export const ChartCard = React.memo(function ChartCard({ title, type, categories = [], series, height = 240, loading = false, emptyMessage = 'No data', error = null, className }: ChartCardProps) {
  const hasData = series && series.length > 0 && series.some(s => s.data && s.data.length > 0 && s.data.some((d) => d != null));
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 ${className || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[var(--color-text)] font-[var(--font-weight-semibold)]">{title}</div>
        <div className="flex items-center gap-3 text-[var(--color-text-muted)] text-[var(--font-size-xs)]" aria-hidden>
          {series.map((s, i) => (
            <div key={s.name} className="flex items-center gap-1">
              <span style={{ background: SERIES_COLORS[i % SERIES_COLORS.length], width: 10, height: 10, borderRadius: 2 }} />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef} style={{ height }} className="relative">
        {loading ? (
          <div role="status" aria-label="Loading chart" className="absolute inset-0 grid place-items-center">
            <div className="h-6 w-24 bg-[var(--color-active-surface)] rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 grid place-items-center text-[var(--color-error)]">{error}</div>
        ) : !hasData ? (
          <div className="absolute inset-0 grid place-items-center text-[var(--color-text-muted)]">{emptyMessage}</div>
        ) : type === 'line' ? (
          <LineChart categories={categories} series={series} height={height} />
        ) : type === 'bar' ? (
          <BarChart categories={categories} series={series} height={height} />
        ) : (
          <PieChart categories={categories} series={series} height={height} />
        )}
      </div>
      {/* SR-only series list for legend accessibility */}
      <div className="sr-only" data-testid="chart-series">
        {series.map((s) => s.name).join(' ')}
      </div>
    </div>
  );
}, (prev, next) => {
  // Avoid re-render if only unrelated props change; deep-compare series and categories
  if (prev.type !== next.type || prev.height !== next.height || prev.loading !== next.loading || prev.error !== next.error) return false;
  const eqArr = (a?: string[], b?: string[]) => {
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };
  const eqSeries = (a: Series[], b: Series[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].name !== b[i].name) return false;
      const da = a[i].data, db = b[i].data;
      if (da.length !== db.length) return false;
      for (let j = 0; j < da.length; j++) if (da[j] !== db[j]) return false;
    }
    return true;
  };
  return eqArr(prev.categories, next.categories) && eqSeries(prev.series, next.series) && prev.className === next.className && prev.title === next.title && prev.emptyMessage === next.emptyMessage;
});

function normalize(series: number[][]) {
  const all = series.flat();
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const span = Math.max(1, max - min);
  return series.map((arr) => arr.map((v) => (v - min) / span));
}

function LineChart({ categories, series, height }: { categories: string[]; series: Series[]; height: number }) {
  const width = Math.max(300, categories.length * 40);
  const padding = 24;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const xs = categories.map((_, i) => padding + (i / Math.max(1, categories.length - 1)) * innerW);
  const norm = normalize(series.map((s) => s.data));
  return (
    <svg role="img" aria-label="Line chart" width="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--color-border)" />
      {norm.map((arr, si) => {
        const d = arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${padding + (1 - v) * innerH}`).join(' ');
        return (
          <path key={si} d={d} fill="none" stroke={SERIES_COLORS[si % SERIES_COLORS.length]} strokeWidth={2} />
        );
      })}
    </svg>
  );
}

function BarChart({ categories, series, height }: { categories: string[]; series: Series[]; height: number }) {
  const width = Math.max(300, categories.length * 44);
  const padding = 24;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const groupW = innerW / categories.length;
  const barW = Math.max(6, (groupW - 8) / Math.max(1, series.length));
  const norm = normalize(series.map((s) => s.data));
  return (
    <svg role="img" aria-label="Bar chart" width="100%" viewBox={`0 0 ${width} ${height}`}>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" />
      {norm.map((arr, si) => (
        <g key={si}>
          {arr.map((v, i) => {
            const x = padding + i * groupW + si * barW;
            const h = v * innerH;
            const y = height - padding - h;
            return <rect key={i} x={x} y={y} width={barW - 2} height={h} fill={SERIES_COLORS[si % SERIES_COLORS.length]} rx={2} ry={2} />;
          })}
        </g>
      ))}
    </svg>
  );
}

function PieChart({ categories, series, height }: { categories: string[]; series: Series[]; height: number }) {
  const values = series[0]?.data || [];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = height / 2;
  const cy = height / 2;
  const r = (height / 2) - 6;
  let acc = 0;
  const arcs = values.map((v, i) => {
    const start = (acc / total) * Math.PI * 2;
    acc += v;
    const end = (acc / total) * Math.PI * 2;
    const largeArc = end - start > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return <path key={i} d={d} fill={SERIES_COLORS[i % SERIES_COLORS.length]} aria-label={`${categories[i] || `Slice ${i+1}`}: ${((v/total)*100).toFixed(1)}%`} />
  });
  return (
    <svg role="img" aria-label="Pie chart" width="100%" viewBox={`0 0 ${height} ${height}`}>
      {arcs}
    </svg>
  );
}


