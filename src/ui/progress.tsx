import * as React from 'react';
import * as RadixProgress from '@radix-ui/react-progress';

export function Progress({ value = 0 }: { value?: number }) {
  return (
    <RadixProgress.Root className="relative h-2 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-muted)]">
      <RadixProgress.Indicator
        className="h-full bg-[var(--color-primary)] transition-transform"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </RadixProgress.Root>
  );
}


