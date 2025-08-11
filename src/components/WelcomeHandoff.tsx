"use client";
import * as React from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export function WelcomeHandoff({ email }: { email: string | null }) {
  const supabase = React.useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = React.useState<null | { access_token?: string }>(null);
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const s = await supabase.auth.getSession();
      setSession(s.data.session ? { access_token: s.data.session.access_token } : null);
      setLoading(false);
    })();
  }, [supabase]);

  const persistSession = React.useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch('/api/session/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: token }) });
  }, [supabase]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError('Missing email from checkout session'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError(null);
    const res = await supabase.auth.signUp({ email, password });
    if (res.error) { setError(res.error.message); return; }
    await persistSession();
    window.location.href = '/onboarding';
  }

  React.useEffect(() => { if (session) { void persistSession(); } }, [session, persistSession]);

  if (loading) return null;

  if (session) {
    return (
      <div className="grid gap-3">
        <div className="text-[var(--color-text-muted)]">You are signed in.</div>
        <button
          onClick={async () => { await persistSession(); window.location.href = '/onboarding'; }}
          className="inline-block rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-[var(--color-primary-foreground)] text-center"
        >
          Start Onboarding
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={createAccount} className="grid gap-3 text-left">
      <div>
        <div className="text-[var(--color-text-muted)] text-sm mb-1">Email</div>
        <input className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2" value={email ?? ''} readOnly />
      </div>
      <div>
        <div className="text-[var(--color-text-muted)] text-sm mb-1">Create password</div>
        <input type="password" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <div className="text-[var(--color-text-muted)] text-sm mb-1">Confirm password</div>
        <input type="password" className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error ? <div className="text-[var(--color-error)] text-sm">{error}</div> : null}
      <button type="submit" className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-[var(--color-primary-foreground)]">Create account & continue</button>
      <div className="text-center text-sm">
        Already have an account? <a className="underline" href="/signin">Sign in</a>
      </div>
    </form>
  );
}


