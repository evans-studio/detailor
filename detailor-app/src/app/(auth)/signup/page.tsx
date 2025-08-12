"use client";
import * as React from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const client = React.useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await client.auth.signUp({ email, password });
  }

  return (
    <main className="mx-auto grid max-w-sm gap-4 p-6">
      <h1 className="text-[var(--font-size-2xl)] font-semibold">Create account</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit">Sign up</Button>
      </form>
    </main>
  );
}


