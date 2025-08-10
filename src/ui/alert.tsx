import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const alertStyles = cva('rounded-[var(--radius-md)] p-[var(--space-3)] border', {
  variants: {
    intent: {
      info: 'bg-[var(--color-hover-surface)] text-[var(--color-text)] border-[var(--color-border)]',
      success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30',
      warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30',
      error: 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/30',
    },
  },
  defaultVariants: { intent: 'info' },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertStyles> {}

export function Alert({ className, intent, ...props }: AlertProps) {
  return <div role="alert" className={twMerge(alertStyles({ intent }), className)} {...props} />;
}


