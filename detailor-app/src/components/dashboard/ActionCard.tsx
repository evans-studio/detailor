"use client";
import * as React from 'react';

export interface ActionCardProps {
  title: string;
  description?: string;
  status?: 'success' | 'warning' | 'error' | 'info' | 'default';
  actions?: Array<{ label: string; onClick: () => void; intent?: 'primary' | 'outline' | 'ghost' }>;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

const statusToClasses: Record<NonNullable<ActionCardProps['status']>, string> = {
  default: 'bg-[var(--color-muted)] text-[var(--color-text)]',
  success: 'bg-[var(--color-success-100)] text-[var(--color-success-600)]',
  warning: 'bg-[var(--color-warning-100)] text-[var(--color-warning-600)]',
  error: 'bg-[var(--color-error-100)] text-[var(--color-error-600)]',
  info: 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]',
};

export function ActionCard({ title, description, status = 'default', actions = [], icon, loading = false, className }: ActionCardProps) {
  return (
    <div className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 ${className || ''}`}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className={`w-10 h-10 rounded-[var(--radius-md)] grid place-items-center ${statusToClasses[status]}`}>{icon}</div>
        ) : null}
        <div className="flex-1">
          <div className="text-[var(--color-text)] font-[var(--font-weight-semibold)]">{title}</div>
          {loading ? (
            <div className="mt-2 h-4 w-1/2 bg-[var(--color-active-surface)] rounded animate-pulse" />
          ) : description ? (
            <div className="mt-1 text-[var(--color-text-secondary)] text-[var(--font-size-sm)]">{description}</div>
          ) : null}
          {actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={a.onClick}
                  className={
                    a.intent === 'primary'
                      ? 'px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-hover-primary)]'
                      : a.intent === 'outline'
                      ? 'px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-hover-surface)]'
                      : 'px-3 py-1 rounded-[var(--radius-sm)] hover:bg-[var(--color-hover-surface)]'
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


