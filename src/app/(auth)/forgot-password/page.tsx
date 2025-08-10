"use client";
import * as React from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { createClient } from '@supabase/supabase-js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const client = React.useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string), []);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Stub: in demo we only simulate
    await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
  }
  return (
    <main className="mx-auto grid max-w-sm gap-4 p-6">
      <h1 className="text-[var(--font-size-2xl)] font-semibold">Forgot password</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit">Send reset link</Button>
      </form>
    </main>
  );
}


