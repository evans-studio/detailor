import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const badgeStyles = cva('inline-flex items-center px-2 py-0.5 rounded-[var(--radius-full)] text-[var(--font-size-xs)]', {
  variants: {
    intent: {
      default: 'bg-[var(--color-muted)] text-[var(--color-text)]',
      success: 'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
      warning: 'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]',
      error: 'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
      info: 'bg-[var(--color-info)] text-[var(--color-info-foreground)]',
    },
  },
  defaultVariants: { intent: 'default' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeStyles> {}

export function Badge({ className, intent, ...props }: BadgeProps) {
  return <span className={twMerge(badgeStyles({ intent }), className)} {...props} />;
}


