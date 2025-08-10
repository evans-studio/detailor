import * as React from 'react';
import * as RadixScroll from '@radix-ui/react-scroll-area';

export function ScrollArea({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixScroll.Root className={`overflow-hidden ${className}`}>
      <RadixScroll.Viewport className="h-full w-full">{children}</RadixScroll.Viewport>
      <RadixScroll.Scrollbar orientation="vertical" className="bg-[var(--color-muted)]">
        <RadixScroll.Thumb className="bg-[var(--color-border)]" />
      </RadixScroll.Scrollbar>
    </RadixScroll.Root>
  );
}


