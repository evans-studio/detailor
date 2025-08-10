"use client";
import * as React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

export function Sheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/30" />
        <RadixDialog.Content className="fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-4)] shadow-[var(--shadow-lg)] md:left-1/2 md:top-1/2 md:inset-x-auto md:bottom-auto md:w-[520px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-lg)]">
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}


