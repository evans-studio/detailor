import * as React from 'react';

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-[var(--color-text-muted)]">
        {items.map((it, i) => (
          <li key={i} className="inline-flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {it.href ? (
              <a href={it.href} className="text-[var(--color-text)] hover:underline">
                {it.label}
              </a>
            ) : (
              <span className="text-[var(--color-text)]">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}


