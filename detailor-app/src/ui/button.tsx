import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none',
  {
    variants: {
      intent: {
        primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
        secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-90',
        ghost: 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-hover-surface)]',
        destructive: 'bg-[var(--color-error)] text-[var(--color-error-foreground)] hover:opacity-90',
        link: 'bg-transparent text-[var(--color-primary)] underline-offset-2 hover:underline',
      },
      size: {
        xs: 'h-7 px-2 text-[var(--font-size-xs)] rounded-[var(--radius-sm)]',
        sm: 'h-8 px-3 text-[var(--font-size-sm)] rounded-[var(--radius-sm)]',
        md: 'h-10 px-4 text-[var(--font-size-md)] rounded-[var(--radius-md)]',
        lg: 'h-12 px-5 text-[var(--font-size-lg)] rounded-[var(--radius-lg)]',
      },
      loading: {
        true: 'cursor-wait opacity-80',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, loading, leadingIcon, trailingIcon, children, ...props }, ref) => {
    return (
      <button ref={ref} className={twMerge(buttonStyles({ intent, size, loading, className }))} {...props}>
        {leadingIcon}
        {children}
        {trailingIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';


