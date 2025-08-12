"use client";
import * as React from 'react';
import { Input } from '@/ui/input';

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchPlaceholder = 'Search…',
  onSearch,
  footer,
  enableExport = false,
  exportFilename = 'export.csv',
}: {
  data: T[];
  columns: Array<{ key: keyof T; header: string; render?: (row: T) => React.ReactNode; sortable?: boolean }>;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  footer?: React.ReactNode;
  enableExport?: boolean;
  exportFilename?: string;
}) {
  const [q, setQ] = React.useState('');
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const sorted = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const as = String(av ?? '');
      const bs = String(bv ?? '');
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [data, sortKey, sortDir]);

  function onClickHeader(c: { key: keyof T; sortable?: boolean }) {
    if (!c.sortable) return;
    if (sortKey === c.key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(c.key);
      setSortDir('asc');
    }
  }

  function exportCsv() {
    const headers = columns.map((c) => String(c.header));
    const rows = sorted.map((row) => columns.map((c) => JSON.stringify(row[c.key] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-2">
      {(onSearch || enableExport) && (
        <div className="hidden md:flex items-center justify-between">
          {onSearch ? (
            <Input placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); onSearch(e.target.value); }} style={{ width: 260 }} />
          ) : <div />}
          {enableExport ? (
            <button className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-hover-surface)]" onClick={exportCsv}>Export CSV</button>
          ) : null}
        </div>
      )}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--color-hover-surface)]">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className="px-3 py-2 text-[var(--font-size-sm)] cursor-pointer select-none" onClick={() => onClickHeader(c)}>
                  {c.header}{sortKey === c.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={idx} className="border-t border-[var(--color-border)]">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-3 py-2">{c.render ? c.render(row) : String(row[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}


