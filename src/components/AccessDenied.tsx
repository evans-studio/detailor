"use client";
import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/ui/button';

export function AccessDenied({ message = 'You do not have permission to view this page.' }: { message?: string }) {
  return (
    <div className="mx-auto grid max-w-md gap-3 p-6 text-center">
      <div className="text-[var(--font-size-2xl)] font-semibold">Access Denied</div>
      <div className="text-[var(--color-text-muted)]">{message}</div>
      <div className="flex justify-center gap-2">
        <Link href="/signin"><Button>Sign in</Button></Link>
        <Link href="/"><Button intent="ghost">Home</Button></Link>
      </div>
    </div>
  );
}


