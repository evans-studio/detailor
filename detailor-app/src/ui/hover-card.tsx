import * as React from 'react';
import * as RadixHoverCard from '@radix-ui/react-hover-card';

export const HoverCard = RadixHoverCard.Root;
export const HoverCardTrigger = RadixHoverCard.Trigger;
export function HoverCardContent({ children }: { children: React.ReactNode }) {
  return (
    <RadixHoverCard.Portal>
      <RadixHoverCard.Content sideOffset={6} className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-md)]">
        {children}
      </RadixHoverCard.Content>
    </RadixHoverCard.Portal>
  );
}


