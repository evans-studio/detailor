"use client";
import * as React from 'react';
import { Sheet } from '@/components/Sheet';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Button } from '@/ui/button';

export function EntityVehicleDrawer({
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
  const [form, setForm] = React.useState({ make: '', model: '', year: '', colour: '', size_tier: 'M' });
  async function submit() {
    await fetch(`/api/customers/${customerId}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    onOpenChange(false);
    setForm({ make: '', model: '', year: '', colour: '', size_tier: 'M' });
    onCreated();
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="grid gap-3">
        <div className="text-[var(--font-size-lg)] font-semibold">Add Vehicle</div>
        <Input placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
        <Input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <Input placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
        <Input placeholder="Colour" value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
        <Select options={[{ label: 'S', value: 'S' }, { label: 'M', value: 'M' }, { label: 'L', value: 'L' }, { label: 'XL', value: 'XL' }]} value={form.size_tier} onValueChange={(v) => setForm({ ...form, size_tier: v })} />
        <div className="flex justify-end"><Button onClick={submit}>Save</Button></div>
      </div>
    </Sheet>
  );
}


