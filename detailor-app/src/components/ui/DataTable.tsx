"use client";

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';
import { LoadingSpinner } from './LoadingSpinner';

const tableVariants = cva([
  'w-full border-collapse bg-[var(--color-surface)]',
  'rounded-[var(--radius-lg)] overflow-hidden',
  'shadow-[var(--shadow-sm)] border border-[var(--color-border)]',
], {
  variants: {
    size: {
      sm: 'text-[var(--font-size-sm)]',
      md: 'text-[var(--font-size-base)]',
      lg: 'text-[var(--font-size-lg)]',
    },
    variant: {
      default: '',
      striped: '[&_tbody_tr:nth-child(odd)]:bg-[var(--color-muted)]/30',
      bordered: '[&_td]:border-r [&_th]:border-r [&_td]:border-b [&_th]:border-b',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

const tableRowVariants = cva([
  'table-row-hover animate-gpu transition-smooth',
  'hover:bg-[var(--color-hover-surface)]',
  'focus-within:bg-[var(--color-hover-surface)]',
], {
  variants: {
    state: {
      default: '',
      selected: 'bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10',
      highlighted: 'table-row-highlight',
      expanded: '',
    },
    clickable: {
      true: 'cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    state: 'default',
    clickable: false,
  },
});

export interface Column<T = any> {
  key: string;
  title: string;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T = any> extends VariantProps<typeof tableVariants> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    type: 'checkbox' | 'radio';
    selectedKeys: string[];
    onChange: (selectedKeys: string[]) => void;
    getRowKey: (record: T) => string;
  };
  expandable?: {
    expandedKeys: string[];
    onExpand: (expanded: boolean, record: T) => void;
    getRowKey: (record: T) => string;
    renderExpandedRow: (record: T) => React.ReactNode;
  };
  sorting?: {
    field?: string;
    order?: 'asc' | 'desc';
    onChange: (field: string, order: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters: Record<string, any>;
    onChange: (filters: Record<string, any>) => void;
  };
  onRowClick?: (record: T, index: number) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  rowClassName?: (record: T, index: number) => string;
  className?: string;
  emptyText?: string;
  stickyHeader?: boolean;
  virtualized?: boolean;
  height?: string | number;
}

// Table Header Component
function TableHeader<T>({ 
  columns, 
  sorting, 
  selection,
  expandable,
  onSort,
  onSelectAll,
  className 
}: {
  columns: Column<T>[];
  sorting?: DataTableProps<T>['sorting'];
  selection?: DataTableProps<T>['selection'];
  expandable?: DataTableProps<T>['expandable'];
  onSort?: (field: string) => void;
  onSelectAll?: (checked: boolean) => void;
  className?: string;
}) {
  const [resizing, setResizing] = React.useState<string | null>(null);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    onSort(column.key);
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    const isActive = sorting?.field === column.key;
    const order = sorting?.order;
    
    return (
      <span className={twMerge(
        'ml-1 inline-flex flex-col table-sort-indicator transition-smooth',
        isActive && (order === 'asc' ? 'asc' : 'desc')
      )}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </span>
    );
  };

  return (
    <thead className={twMerge('bg-[var(--color-muted)]/20 border-b border-[var(--color-border)]', className)}>
      <tr>
        {expandable && (
          <th className="w-10 p-3 text-left">
            {/* Expand column header */}
          </th>
        )}
        
        {selection && (
          <th className="w-12 p-3 text-left">
            {selection.type === 'checkbox' && (
              <input
                type="checkbox"
                className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-2"
                onChange={(e) => onSelectAll?.(e.target.checked)}
                aria-label="Select all rows"
              />
            )}
          </th>
        )}
        
        {columns.map((column) => (
          <th
            key={column.key}
            className={twMerge(
              'p-3 text-left font-[var(--font-weight-semibold)] text-[var(--color-text)]',
              column.sortable && 'cursor-pointer hover:bg-[var(--color-hover-surface)] select-none',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.headerClassName
            )}
            style={{
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
            }}
            onClick={() => handleSort(column)}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                {column.renderHeader ? column.renderHeader() : column.title}
                {getSortIcon(column)}
              </span>
              
              {column.resizable && (
                <div
                  className="w-1 h-4 bg-[var(--color-border)] cursor-col-resize hover:bg-[var(--color-primary)] transition-colors ml-2"
                  onMouseDown={(e) => {
                    setResizing(column.key);
                    e.preventDefault();
                  }}
                />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

// Table Row Component  
function TableRow<T>({
  record,
  index,
  columns,
  selection,
  expandable,
  isSelected,
  isExpanded,
  onRowClick,
  onRowDoubleClick,
  onSelect,
  onExpand,
  className,
}: {
  record: T;
  index: number;
  columns: Column<T>[];
  selection?: DataTableProps<T>['selection'];
  expandable?: DataTableProps<T>['expandable'];
  isSelected?: boolean;
  isExpanded?: boolean;
  onRowClick?: (record: T, index: number) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  onSelect?: (checked: boolean, record: T) => void;
  onExpand?: (expanded: boolean, record: T) => void;
  className?: string;
}) {
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const rowRef = React.useRef<HTMLTableRowElement>(null);

  const handleClick = () => {
    onRowClick?.(record, index);
    
    // Add highlight animation
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 1200);
  };

  const handleDoubleClick = () => {
    onRowDoubleClick?.(record, index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <tr
        ref={rowRef}
        className={twMerge(
          tableRowVariants({ 
            state: isSelected ? 'selected' : isHighlighted ? 'highlighted' : 'default',
            clickable: Boolean(onRowClick)
          }),
          className
        )}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={onRowClick ? 0 : undefined}
        role={onRowClick ? 'button' : undefined}
      >
        {expandable && (
          <td className="p-3">
            <Button
              intent="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onExpand?.(!isExpanded, record);
              }}
              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
            >
              <svg 
                className={twMerge(
                  'w-4 h-4 transition-transform',
                  isExpanded && 'rotate-90'
                )} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </td>
        )}
        
        {selection && (
          <td className="p-3">
            <input
              type={selection.type}
              name={selection.type === 'radio' ? 'table-selection' : undefined}
              checked={isSelected}
              className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-2"
              onChange={(e) => {
                e.stopPropagation();
                onSelect?.(e.target.checked, record);
              }}
              aria-label={`Select row ${index + 1}`}
            />
          </td>
        )}
        
        {columns.map((column) => (
          <td
            key={column.key}
            className={twMerge(
              'p-3 border-t border-[var(--color-border)]',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right',
              column.className
            )}
            style={{
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
            }}
          >
            {column.render 
              ? column.render((record as any)[column.key], record, index)
              : (record as any)[column.key]
            }
          </td>
        ))}
      </tr>
      
      {/* Expanded Row */}
      {expandable && isExpanded && (
        <tr className="table-row-expand">
          <td 
            colSpan={columns.length + (selection ? 1 : 0) + 1}
            className="p-4 bg-[var(--color-muted)]/10 border-t border-[var(--color-border)]"
          >
            {expandable.renderExpandedRow(record)}
          </td>
        </tr>
      )}
    </>
  );
}

// Main DataTable Component
export function DataTable<T = any>({
  data,
  columns,
  loading = false,
  pagination,
  selection,
  expandable,
  sorting,
  filtering,
  onRowClick,
  onRowDoubleClick,
  rowClassName,
  className,
  emptyText = "No data available",
  stickyHeader = false,
  height,
  size,
  variant,
}: DataTableProps<T>) {
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    new Set(selection?.selectedKeys || [])
  );
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(
    new Set(expandable?.expandedKeys || [])
  );

  // Handle sorting
  const handleSort = (field: string) => {
    if (!sorting) return;
    
    const newOrder = sorting.field === field && sorting.order === 'asc' ? 'desc' : 'asc';
    sorting.onChange(field, newOrder);
  };

  // Handle selection
  const handleSelect = (checked: boolean, record: T) => {
    if (!selection) return;
    
    const key = selection.getRowKey(record);
    const newSelectedKeys = new Set(selectedKeys);
    
    if (selection.type === 'radio') {
      newSelectedKeys.clear();
      if (checked) {
        newSelectedKeys.add(key);
      }
    } else {
      if (checked) {
        newSelectedKeys.add(key);
      } else {
        newSelectedKeys.delete(key);
      }
    }
    
    setSelectedKeys(newSelectedKeys);
    selection.onChange(Array.from(newSelectedKeys));
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (!selection || selection.type === 'radio') return;
    
    const newSelectedKeys = checked 
      ? new Set(data.map(selection.getRowKey))
      : new Set<string>();
    
    setSelectedKeys(newSelectedKeys);
    selection.onChange(Array.from(newSelectedKeys));
  };

  // Handle expand
  const handleExpand = (expanded: boolean, record: T) => {
    if (!expandable) return;
    
    const key = expandable.getRowKey(record);
    const newExpandedKeys = new Set(expandedKeys);
    
    if (expanded) {
      newExpandedKeys.add(key);
    } else {
      newExpandedKeys.delete(key);
    }
    
    setExpandedKeys(newExpandedKeys);
    expandable.onExpand(expanded, record);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text)] mb-2">
          No data available
        </h3>
        <p className="text-[var(--color-text-muted)]">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className={twMerge('overflow-hidden rounded-[var(--radius-lg)]', className)}>
      <div 
        className="overflow-auto"
        style={{ height }}
      >
        <table className={tableVariants({ size, variant })}>
          <TableHeader
            columns={columns}
            sorting={sorting}
            selection={selection}
            expandable={expandable}
            onSort={handleSort}
            onSelectAll={handleSelectAll}
            className={stickyHeader ? 'sticky top-0 z-10' : ''}
          />
          <tbody className="divide-y divide-[var(--color-border)]">
            {data.map((record, index) => {
              const rowKey = selection?.getRowKey(record) || expandable?.getRowKey(record) || index.toString();
              const isSelected = selectedKeys.has(rowKey);
              const isExpanded = expandedKeys.has(rowKey);
              
              return (
                <TableRow
                  key={rowKey}
                  record={record}
                  index={index}
                  columns={columns}
                  selection={selection}
                  expandable={expandable}
                  isSelected={isSelected}
                  isExpanded={isExpanded}
                  onRowClick={onRowClick}
                  onRowDoubleClick={onRowDoubleClick}
                  onSelect={handleSelect}
                  onExpand={handleExpand}
                  className={rowClassName?.(record, index)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-muted)]/10">
          <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
            Showing {(pagination.current - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              intent="ghost"
              size="sm"
              disabled={pagination.current <= 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              Previous
            </Button>
            <span className="text-[var(--font-size-sm)] text-[var(--color-text)]">
              Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              intent="ghost"
              size="sm"
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}