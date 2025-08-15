"use client";
import * as React from 'react';

export interface DashboardGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export function DashboardGrid({ children, columns = 12, gap = 16, className }: DashboardGridProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}


