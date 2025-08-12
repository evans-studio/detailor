import * as React from 'react';

export function Table({ children, className = '' }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={`w-full border-collapse ${className}`}>{children}</table>
  );
}
export function THead({ children }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="text-left text-[var(--font-size-sm)] text-[var(--color-text-muted)]">{children}</thead>;
}
export function TBody({ children }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="text-[var(--color-text)]">{children}</tbody>;
}
export function TR({ children }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="border-b border-[var(--color-border)]">{children}</tr>;
}
export function TH({ children }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}
export function TD({ children }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className="px-3 py-2">{children}</td>;
}


