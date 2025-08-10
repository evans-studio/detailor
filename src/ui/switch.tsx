import * as React from 'react';

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <label className={'inline-flex items-center ' + (className || '')}>
      <input type="checkbox" className="sr-only peer" {...props} />
      <span className="peer-checked:bg-[var(--color-primary)] peer-focus:shadow-[var(--shadow-focus)] relative inline-flex h-6 w-10 items-center rounded-full bg-[var(--color-muted)] transition-colors">
        <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-[var(--color-surface)] transition-transform peer-checked:translate-x-5"></span>
      </span>
    </label>
  );
}


