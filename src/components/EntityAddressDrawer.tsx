"use client";
import * as React from 'react';
import { Sheet } from '@/components/Sheet';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

export function EntityAddressDrawer({
  open,
  onOpenChange,
  customerId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerId: string;
  onCreated: () => void;
}) {
  const [form, setForm] = React.useState({ label: '', address_line1: '', city: '', postcode: '' });
  async function submit() {
    await fetch(`/api/customers/${customerId}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    onOpenChange(false);
    setForm({ label: '', address_line1: '', city: '', postcode: '' });
    onCreated();
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="grid gap-3">
        <div className="text-[var(--font-size-lg)] font-semibold">Add Address</div>
        <Input placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Input placeholder="Address line 1" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
        <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input placeholder="Postcode" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
        <div className="flex justify-end"><Button onClick={submit}>Save</Button></div>
      </div>
    </Sheet>
  );
}


