import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const buttonStyles = cva(
  [
    // Base styles for enterprise button
    'group relative inline-flex items-center justify-center gap-[var(--space-2)]',
    'font-medium text-center whitespace-nowrap select-none',
    'border border-transparent',
    'transition-all duration-[var(--duration-button)] ease-[var(--ease-out)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2',
    'focus-visible:ring-offset-[var(--color-bg)]',
    'disabled:pointer-events-none disabled:opacity-50',
    // Hover and active states
    'active:scale-[0.98] active:transition-transform active:duration-75',
  ],
  {
    variants: {
      intent: {
        // Primary - Brand authority
        primary: [
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
          'shadow-[var(--shadow-sm)]',
          'hover:bg-[var(--color-primary-600)] hover:shadow-[var(--shadow-md)]',
          'focus-visible:ring-[var(--color-primary-300)]',
        ],
        // Secondary - Elegant alternative
        secondary: [
          'bg-[var(--color-surface)] text-[var(--color-text)]',
          'border-[var(--color-border-strong)] shadow-[var(--shadow-sm)]',
          'hover:bg-[var(--color-hover-surface)] hover:border-[var(--color-slate-300)] hover:shadow-[var(--shadow-md)]',
        ],
        // Ghost - Subtle interaction
        ghost: [
          'bg-transparent text-[var(--color-text)] border-transparent',
          'hover:bg-[var(--color-hover-surface)] hover:text-[var(--color-text)]',
        ],
        // Outline - Professional border style
        outline: [
          'bg-transparent text-[var(--color-primary)] border-[var(--color-primary)]',
          'hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)]',
          'hover:shadow-[var(--shadow-sm)]',
        ],
        // Destructive - Clear danger indication
        destructive: [
          'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
          'shadow-[var(--shadow-sm)]',
          'hover:bg-[var(--color-error-600)] hover:shadow-[var(--shadow-md)]',
          'focus-visible:ring-[var(--color-error-300)]',
        ],
        // Link - Clean text link
        link: [
          'bg-transparent text-[var(--color-primary)] border-transparent',
          'underline-offset-4 hover:underline',
          'focus-visible:ring-offset-0',
        ],
        // Success - Positive actions
        success: [
          'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
          'shadow-[var(--shadow-sm)]',
          'hover:bg-[var(--color-success-600)] hover:shadow-[var(--shadow-md)]',
          'focus-visible:ring-[var(--color-success-300)]',
        ],
        // Warning - Caution indicators
        warning: [
          'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]',
          'shadow-[var(--shadow-sm)]',
          'hover:bg-[var(--color-warning-600)] hover:shadow-[var(--shadow-md)]',
          'focus-visible:ring-[var(--color-warning-300)]',
        ],
      },
      size: {
        xs: [
          'h-[var(--space-7)] px-[var(--space-2)]',
          'text-[var(--font-size-xs)] font-[var(--font-weight-medium)]',
          'rounded-[var(--radius-sm)]',
        ],
        sm: [
          'h-[var(--space-8)] px-[var(--space-3)]',
          'text-[var(--font-size-sm)] font-[var(--font-weight-medium)]',
          'rounded-[var(--radius-sm)]',
        ],
        md: [
          'h-[var(--space-10)] px-[var(--space-4)]',
          'text-[var(--font-size-sm)] font-[var(--font-weight-medium)]',
          'rounded-[var(--radius-md)]',
        ],
        lg: [
          'h-[var(--space-11)] px-[var(--space-5)]',
          'text-[var(--font-size-base)] font-[var(--font-weight-medium)]',
          'rounded-[var(--radius-md)]',
        ],
        xl: [
          'h-[var(--space-12)] px-[var(--space-6)]',
          'text-[var(--font-size-lg)] font-[var(--font-weight-semibold)]',
          'rounded-[var(--radius-lg)]',
        ],
      },
      loading: {
        true: 'cursor-wait',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  }
);

// Loading spinner component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={twMerge('animate-spin -ml-1 h-4 w-4', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    intent, 
    size, 
    loading, 
    fullWidth,
    leadingIcon, 
    trailingIcon, 
    children, 
    loadingText,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled: boolean = Boolean(disabled) || Boolean(loading);
    
    return (
      <button 
        ref={ref} 
        className={twMerge(buttonStyles({ intent, size, loading, fullWidth, className }))} 
        disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leadingIcon}
        <span>{loading && loadingText ? loadingText : children}</span>
        {!loading && trailingIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';


