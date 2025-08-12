import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const styles = cva(
  'inline-flex items-center justify-center rounded-[var(--radius-sm)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none',
  {
    variants: {
      intent: {
        primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
        secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-90',
        ghost: 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-hover-surface)]',
        destructive: 'bg-[var(--color-error)] text-[var(--color-error-foreground)] hover:opacity-90',
      },
      size: {
        xs: 'h-7 w-7',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
    },
    defaultVariants: { intent: 'ghost', size: 'md' },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof styles> {}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, intent, size, children, ...props }, ref) => (
    <button ref={ref} className={twMerge(styles({ intent, size }), className)} {...props}>
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';


