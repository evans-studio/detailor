import * as React from 'react';
import { IconButton } from '@/ui/icon-button';

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(totalPages, page + 1));
  return (
    <div className="inline-flex items-center gap-2">
      <IconButton intent="ghost" aria-label="Previous" onClick={prev} disabled={page <= 1}>
        ‹
      </IconButton>
      <span className="text-[var(--color-text)] text-[var(--font-size-sm)]">
        {page} / {totalPages}
      </span>
      <IconButton intent="ghost" aria-label="Next" onClick={next} disabled={page >= totalPages}>
        ›
      </IconButton>
    </div>
  );
}


