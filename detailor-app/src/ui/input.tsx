import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={twMerge(
          'w-full h-10 px-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] border border-[var(--color-border)] focus-visible:shadow-[var(--shadow-focus)]',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';


