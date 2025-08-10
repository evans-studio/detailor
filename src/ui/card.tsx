import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        'rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[var(--space-4)]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={twMerge('mb-[var(--space-3)]', className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3 className={twMerge('text-[var(--font-size-lg)] font-semibold tracking-[var(--letter-spacing-tight)]', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={twMerge('text-[var(--font-size-md)]', className)} {...props} />;
}


