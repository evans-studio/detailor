"use client";
import * as React from 'react';

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-hover-surface)]" />
      ))}
    </div>
  );
}


