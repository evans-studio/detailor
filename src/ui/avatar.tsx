import * as React from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';

export function Avatar({ src, alt, fallback }: { src?: string; alt?: string; fallback: string }) {
  return (
    <RadixAvatar.Root className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]">
      {src ? <RadixAvatar.Image src={src} alt={alt} className="h-full w-full rounded-full object-cover" /> : null}
      <RadixAvatar.Fallback className="text-[var(--color-text)] text-[var(--font-size-sm)]">{fallback}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}


