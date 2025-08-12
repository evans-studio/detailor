"use client";
import * as React from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { createClient } from '@supabase/supabase-js';

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState('');
  const client = React.useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string), []);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await client.auth.updateUser({ password });
  }
  return (
    <main className="mx-auto grid max-w-sm gap-4 p-6">
      <h1 className="text-[var(--font-size-2xl)] font-semibold">Reset password</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit">Update password</Button>
      </form>
    </main>
  );
}


