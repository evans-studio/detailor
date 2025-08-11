"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

type BookingDefaults = { work_hours?: { start?: string; end?: string }; slot_minutes?: number };

export default function BookingDefaultsPage() {
  const [form, setForm] = React.useState<BookingDefaults>({ work_hours: { start: '09:00', end: '17:00' }, slot_minutes: 60 });
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/booking-defaults');
        const json = await res.json();
        const first = (json.patterns || [])[0];
        if (first) setForm({ work_hours: { start: first.start_time?.slice(0,5) || '09:00', end: first.end_time?.slice(0,5) || '17:00' }, slot_minutes: first.slot_duration_min || 60 });
      } catch {}
    })();
  }, []);
  async function onSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/booking-defaults', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: form.work_hours?.start || '09:00', end: form.work_hours?.end || '17:00', slot_minutes: form.slot_minutes || 60, capacity: 2, weekdays: [1,2,3,4,5] }) });
    } finally { setSaving(false); }
  }
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Booking Defaults</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2">
          <div className="font-medium">Working Hours</div>
          <Input placeholder="Start (HH:MM)" value={form.work_hours?.start || ''} onChange={(e) => setForm({ ...form, work_hours: { ...(form.work_hours||{}), start: e.target.value } })} />
          <Input placeholder="End (HH:MM)" value={form.work_hours?.end || ''} onChange={(e) => setForm({ ...form, work_hours: { ...(form.work_hours||{}), end: e.target.value } })} />
          <Input placeholder="Slot minutes" value={String(form.slot_minutes || 60)} onChange={(e) => setForm({ ...form, slot_minutes: Number(e.target.value || 60) })} />
        </div>
        <div className="flex justify-end mt-3"><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
      </RoleGuard>
    </DashboardShell>
  );
}


