import * as React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] px-2 py-1"
            sideOffset={6}
          >
            {content}
            <RadixTooltip.Arrow className="fill-[var(--color-surface)]" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}


