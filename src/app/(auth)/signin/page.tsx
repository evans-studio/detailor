"use client";
import * as React from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SignInPage() {
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
    const res = await client.auth.signInWithPassword({ email, password });
    if (res.error) return;
    // Attempt role landing via profile fetch
    try {
      const token = (await client.auth.getSession()).data.session?.access_token;
      if (token) {
        await fetch('/api/session/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: token }) });
      }
      const apiRes = await fetch('/api/profiles/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const json = await apiRes.json();
      const role = json?.profile?.role as 'admin' | 'staff' | 'customer' | undefined;
      if (role === 'admin') window.location.href = '/dashboard';
      else if (role === 'staff') window.location.href = '/dashboard';
      else window.location.href = '/customer/dashboard';
    } catch {
      window.location.href = '/dashboard';
    }
  }

  return (
    <main className="mx-auto grid max-w-sm gap-4 p-6">
      <h1 className="text-[var(--font-size-2xl)] font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit">Continue</Button>
      </form>
    </main>
  );
}


