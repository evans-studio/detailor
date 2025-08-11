"use client";
import * as React from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

export default function OnboardingPage() {
  const [form, setForm] = React.useState({
    legal_name: '',
    trading_name: '',
    contact_email: '',
    admin_email: '',
    admin_full_name: '',
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);
  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed');
      setOk(true);
    } catch (e) { setError((e as Error).message); }
    finally { setSubmitting(false); }
  }
  if (ok) return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-lg w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <div className="text-[var(--font-size-xl)] font-semibold">Setup Complete</div>
        <div className="text-[var(--color-text-muted)] mb-4">You can invite your team and start taking bookings.</div>
        <a href="/dashboard" className="inline-block rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-[var(--color-primary-foreground)]">Go to Dashboard</a>
      </div>
    </main>
  );
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-xl w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="text-[var(--font-size-2xl)] font-semibold mb-4">Let’s set up your workspace</div>
        <div className="grid gap-3">
          <Input placeholder="Legal name" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
          <Input placeholder="Trading name (optional)" value={form.trading_name} onChange={(e) => setForm({ ...form, trading_name: e.target.value })} />
          <Input type="email" placeholder="Contact email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          <Input type="email" placeholder="Admin email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} />
          <Input placeholder="Admin full name" value={form.admin_full_name} onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })} />
          {error ? <div className="text-[var(--color-error)] text-sm">{error}</div> : null}
          <div className="flex justify-end"><Button onClick={submit} disabled={submitting}>{submitting ? 'Saving…' : 'Save & Continue'}</Button></div>
        </div>
      </div>
    </main>
  );
}


