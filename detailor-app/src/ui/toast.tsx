import * as React from 'react';
import * as RadixToast from '@radix-ui/react-toast';

export function Toaster({ children }: { children?: React.ReactNode }) {
  return (
    <RadixToast.Provider swipeDirection="right">
      {children}
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2" />
    </RadixToast.Provider>
  );
}

export function Toast({ title, description, open, onOpenChange }: { title: string; description?: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <RadixToast.Root open={open} onOpenChange={onOpenChange} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-3">
      <RadixToast.Title className="font-semibold">{title}</RadixToast.Title>
      {description && <RadixToast.Description className="text-[var(--color-text-muted)]">{description}</RadixToast.Description>}
    </RadixToast.Root>
  );
}


