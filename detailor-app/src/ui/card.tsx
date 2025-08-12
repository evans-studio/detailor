import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const cardStyles = cva(
  [
    // Base card styles - Enterprise polish
    'bg-[var(--color-surface-elevated)] text-[var(--color-text)]',
    'border border-[var(--color-border)]',
    'transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
  ],
  {
    variants: {
      variant: {
        // Default elevated card
        elevated: [
          'shadow-[var(--shadow-sm)]',
          'hover:shadow-[var(--shadow-md)]',
          'hover:border-[var(--color-border-strong)]',
        ],
        // Flat card without shadow
        flat: [
          'shadow-none',
          'hover:bg-[var(--color-hover-surface)]',
        ],
        // Outlined card with stronger border
        outlined: [
          'shadow-none border-2',
          'hover:border-[var(--color-primary)]',
          'hover:bg-[var(--color-primary-50)]',
        ],
        // Interactive card for clickable content
        interactive: [
          'shadow-[var(--shadow-sm)] cursor-pointer',
          'hover:shadow-[var(--shadow-lg)] hover:scale-[1.02]',
          'hover:border-[var(--color-primary)]',
          'active:scale-[0.98] active:transition-transform active:duration-75',
        ],
      },
      size: {
        sm: 'p-[var(--space-3)] rounded-[var(--radius-md)]',
        md: 'p-[var(--space-4)] rounded-[var(--radius-lg)]',
        lg: 'p-[var(--space-6)] rounded-[var(--radius-lg)]',
        xl: 'p-[var(--space-8)] rounded-[var(--radius-xl)]',
      },
    },
    defaultVariants: {
      variant: 'elevated',
      size: 'md',
    },
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardStyles> {
  asChild?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? React.Fragment : 'div';
    
    if (asChild) {
      return <>{props.children}</>;
    }
    
    return (
      <div
        ref={ref}
        className={twMerge(cardStyles({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// Card Header - Professional spacing and typography
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge(
        [
          'flex flex-col space-y-[var(--space-1)]',
          'pb-[var(--space-4)] mb-[var(--space-4)]',
          'border-b border-[var(--color-border)]',
        ],
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// Card Title - Enterprise typography hierarchy
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={twMerge(
        [
          'text-[var(--font-size-xl)] font-[var(--font-weight-semibold)]',
          'tracking-[var(--letter-spacing-tight)] leading-[var(--line-height-tight)]',
          'text-[var(--color-text)]',
        ],
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// Card Description - Supporting text
export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={twMerge(
        [
          'text-[var(--font-size-sm)] text-[var(--color-text-muted)]',
          'leading-[var(--line-height-normal)]',
        ],
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

// Card Content - Main content area
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge('text-[var(--font-size-base)] text-[var(--color-text-secondary)]', className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

// Card Footer - Action area
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge(
        [
          'flex items-center justify-between',
          'pt-[var(--space-4)] mt-[var(--space-4)]',
          'border-t border-[var(--color-border)]',
        ],
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';


