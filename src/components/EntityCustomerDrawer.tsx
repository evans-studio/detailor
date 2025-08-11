"use client";
import * as React from 'react';
import { Sheet } from '@/components/Sheet';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function EntityCustomerDrawer({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({ name: '', email: '', phone: '' });
  const [error, setError] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to create customer');
    },
    onSuccess: async () => {
      onOpenChange(false);
      setForm({ name: '', email: '', phone: '' });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      onCreated();
    },
    onError: (e: unknown) => setError((e as Error).message),
  });
  async function submit() { await mutation.mutateAsync(); }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="grid gap-3">
        <div className="text-[var(--font-size-lg)] font-semibold">New Customer</div>
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        {error ? <div className="text-[var(--color-danger)] text-sm">{error}</div> : null}
        <div className="flex justify-end"><Button disabled={mutation.isPending} onClick={submit}>{mutation.isPending ? 'Saving…' : 'Save'}</Button></div>
      </div>
    </Sheet>
  );
}


