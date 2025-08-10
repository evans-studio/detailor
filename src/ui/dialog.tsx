import * as React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-black/30" />
      <RadixDialog.Content className="fixed left-1/2 top-1/2 w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-4)] shadow-[var(--shadow-lg)]">
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <RadixDialog.Title className="text-[var(--font-size-lg)] font-semibold">{children}</RadixDialog.Title>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <RadixDialog.Description className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">{children}</RadixDialog.Description>;
}


