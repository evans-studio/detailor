"use client";
import * as React from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Array<Column<T>>;
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  'data-testid'?: string;
}

export function DataTable<T extends Record<string, any>>({ columns, data, onRowClick, loading = false, emptyMessage = 'No data', ...rest }: DataTableProps<T>) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden" {...rest}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[var(--color-primary-50)]">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} style={{ width: col.width }} className="text-left px-4 py-3 text-[var(--color-text)] font-[var(--font-weight-medium)] text-[var(--font-size-sm)] border-b border-[var(--color-border)]">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)]">
                  {columns.map((c, j) => (
                    <td key={String(c.key) + j} className="px-4 py-3">
                      <div className="h-4 w-3/4 bg-[var(--color-active-surface)] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--color-text-muted)]" colSpan={columns.length}>{emptyMessage}</td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} onClick={() => onRowClick?.(row)} className="border-b border-[var(--color-border)] hover:bg-[var(--color-hover-surface)] cursor-pointer">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3 text-[var(--color-text)] text-[var(--font-size-sm)]">
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


