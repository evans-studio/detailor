import * as React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export function PopoverContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={6}
        className={`rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] p-2 ${className}`}
      >
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
}


