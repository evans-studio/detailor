import * as React from 'react';

interface FormRowProps {
  label?: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormRow({ label, help, error, children }: FormRowProps) {
  return (
    <div className="grid gap-1">
      {label && <label className="text-[var(--color-text)] text-[var(--font-size-sm)]">{label}</label>}
      {children}
      {help && !error && (
        <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">{help}</div>
      )}
      {error && <div className="text-[var(--font-size-xs)] text-[var(--color-error)]">{error}</div>}
    </div>
  );
}


