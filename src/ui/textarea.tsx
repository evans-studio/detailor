import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={twMerge(
        'w-full min-h-24 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] border border-[var(--color-border)] focus-visible:shadow-[var(--shadow-focus)]',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';


