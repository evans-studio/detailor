import * as React from 'react';

export function Skeleton({ className = '', width = '100%', height = 16 }: { className?: string; width?: string | number; height?: string | number }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-muted)] ${className}`}
      style={{ width, height }}
    />
  );
}


