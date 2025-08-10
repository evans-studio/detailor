import * as React from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';

export const DropdownMenu = RadixMenu.Root;
export const DropdownTrigger = RadixMenu.Trigger;
export function DropdownContent({ children }: { children: React.ReactNode }) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] p-1">
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  );
}
export function DropdownItem({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) {
  return (
    <RadixMenu.Item
      onSelect={onSelect}
      className="cursor-pointer rounded-[var(--radius-xs)] px-2 py-1 text-[var(--color-text)] hover:bg-[var(--color-hover-surface)]"
    >
      {children}
    </RadixMenu.Item>
  );
}


