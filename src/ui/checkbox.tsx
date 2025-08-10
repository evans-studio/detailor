import * as React from 'react';

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={
        'h-4 w-4 rounded-[var(--radius-xs)] border-[var(--color-border)] text-[var(--color-primary)] focus-visible:shadow-[var(--shadow-focus)] ' +
        (className || '')
      }
      {...props}
    />
  );
}


