"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

type DayConfig = { enabled: boolean; start: string; end: string; slot_minutes: number; capacity: number };
type BookingDefaults = { days: Record<number, DayConfig>; service_radius_km?: number };

export default function BookingDefaultsPage() {
  const defaultDay: DayConfig = { enabled: true, start: '09:00', end: '17:00', slot_minutes: 60, capacity: 2 };
  const [form, setForm] = React.useState<BookingDefaults>({
    days: {
      0: { ...defaultDay }, // Sunday
      1: { ...defaultDay }, // Monday
      2: { ...defaultDay },
      3: { ...defaultDay },
      4: { ...defaultDay },
      5: { ...defaultDay },
      6: { ...defaultDay }, // Saturday
    },
  });
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        // Load work patterns from admin API (System Bible)
        const res = await fetch('/api/admin/availability/work-patterns', { cache: 'no-store' });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setForm((f) => {
            const next = { ...f, days: { ...f.days } };
            for (const p of json.data as Array<{ weekday: number; start_time: string; end_time: string; slot_duration_min: number; capacity: number }>) {
              const d = p.weekday as number;
              next.days[d] = {
                enabled: (p.capacity ?? 0) > 0,
                start: (p.start_time || '09:00').slice(0,5),
                end: (p.end_time || '17:00').slice(0,5),
                slot_minutes: Number(p.slot_duration_min || 60),
                capacity: Number(p.capacity ?? 2),
              };
            }
            return next;
          });
        }
        // Load service radius from tenant business_prefs
        try {
          const t = await fetch('/api/settings/tenant', { cache: 'no-store' });
          const tj = await t.json();
          if (tj?.success) {
            const km = Number(tj?.data?.tenant?.business_prefs?.service_radius_km || 0);
            if (!Number.isNaN(km) && km > 0) setForm((f) => ({ ...f, service_radius_km: km }));
          }
        } catch {}
      } catch {}
    })();
  }, []);
  async function onSave() {
    setSaving(true);
    try {
      // Persist each weekday via upsert endpoint
      for (let d = 0; d <= 6; d++) {
        const cfg = form.days[d];
        const payload = {
          weekday: d,
          start_time: cfg.start || '09:00',
          end_time: cfg.end || '17:00',
          slot_duration_min: cfg.slot_minutes || 60,
          capacity: cfg.enabled ? (cfg.capacity || 1) : 0,
        };
        // POST upsert per weekday
        await fetch('/api/admin/availability/work-patterns', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
      }
      if (form.service_radius_km && form.service_radius_km > 0) {
        await fetch('/api/settings/tenant', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business_prefs: { service_radius_km: form.service_radius_km } }) });
      }
    } finally { setSaving(false); }
  }
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Working Hours</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-3">
          {[0,1,2,3,4,5,6].map((d) => (
            <div key={d} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
              <div className="md:col-span-1 font-medium">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]}</div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.days[d].enabled} onChange={(e) => setForm({ ...form, days: { ...form.days, [d]: { ...form.days[d], enabled: e.target.checked } } })} />
                <span className="text-[var(--color-text-muted)]">Enabled</span>
              </label>
              <Input placeholder="Start HH:MM" value={form.days[d].start} onChange={(e) => setForm({ ...form, days: { ...form.days, [d]: { ...form.days[d], start: e.target.value } } })} />
              <Input placeholder="End HH:MM" value={form.days[d].end} onChange={(e) => setForm({ ...form, days: { ...form.days, [d]: { ...form.days[d], end: e.target.value } } })} />
              <Input placeholder="Slot (min)" value={String(form.days[d].slot_minutes)} onChange={(e) => setForm({ ...form, days: { ...form.days, [d]: { ...form.days[d], slot_minutes: Number(e.target.value || 60) } } })} />
              <Input placeholder="Capacity" value={String(form.days[d].capacity)} onChange={(e) => setForm({ ...form, days: { ...form.days, [d]: { ...form.days[d], capacity: Number(e.target.value || 1) } } })} />
            </div>
          ))}
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 grid gap-2 mt-3">
          <div className="font-medium">Service Radius</div>
          <Input placeholder="Radius in km" value={String(form.service_radius_km || '')} onChange={(e) => setForm({ ...form, service_radius_km: Number(e.target.value || 0) })} />
          <div className="text-[var(--color-text-muted)] text-sm">Used to validate addresses for booking requests.</div>
        </div>
        <div className="flex justify-end mt-3"><Button onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div>
      </RoleGuard>
    </DashboardShell>
  );
}


