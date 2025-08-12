import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const badgeStyles = cva(
  [
    'inline-flex items-center justify-center gap-1',
    'px-[var(--space-2)] py-[var(--space-0-5)]',
    'rounded-[var(--radius-full)]',
    'text-[var(--font-size-xs)] font-[var(--font-weight-medium)]',
    'transition-colors duration-[var(--duration-fast)]',
  ],
  {
    variants: {
      variant: {
        // Default neutral badge
        default: [
          'bg-[var(--color-muted)] text-[var(--color-text-secondary)]',
          'border border-[var(--color-border)]',
        ],
        // Primary brand badge
        primary: [
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
          'shadow-[var(--shadow-xs)]',
        ],
        // Secondary badge
        secondary: [
          'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
          'shadow-[var(--shadow-xs)]',
        ],
        // Status badges
        success: [
          'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
          'shadow-[var(--shadow-xs)]',
        ],
        warning: [
          'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]',
          'shadow-[var(--shadow-xs)]',
        ],
        error: [
          'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
          'shadow-[var(--shadow-xs)]',
        ],
        info: [
          'bg-[var(--color-info)] text-[var(--color-info-foreground)]',
          'shadow-[var(--shadow-xs)]',
        ],
        // Outline variants
        outline: [
          'bg-transparent text-[var(--color-text)]',
          'border border-[var(--color-border-strong)]',
        ],
        'outline-primary': [
          'bg-transparent text-[var(--color-primary)]',
          'border border-[var(--color-primary)]',
        ],
      },
      size: {
        sm: [
          'h-5 px-[var(--space-1-5)]',
          'text-[var(--font-size-xs)]',
        ],
        md: [
          'h-6 px-[var(--space-2)]',
          'text-[var(--font-size-xs)]',
        ],
        lg: [
          'h-7 px-[var(--space-2-5)]',
          'text-[var(--font-size-sm)]',
        ],
      },
    },
    defaultVariants: { 
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLSpanElement>, 
    VariantProps<typeof badgeStyles> {
  // For backward compatibility
  intent?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, intent, ...props }, ref) => {
    // Map old intent prop to new variant prop for backward compatibility
    const resolvedVariant = intent ? intent : variant;
    
    return (
      <span 
        ref={ref}
        className={twMerge(badgeStyles({ variant: resolvedVariant, size }), className)} 
        {...props} 
      />
    );
  }
);
Badge.displayName = 'Badge';


