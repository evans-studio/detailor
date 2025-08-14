"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { useRealtimeAdminUpdates } from '@/lib/realtime';

const EVENTS = [
  { key: 'user.created', label: 'Account: User Created' },
  { key: 'booking.created', label: 'Booking: Created' },
  { key: 'booking.completed', label: 'Booking: Completed' },
  { key: 'invoice.created', label: 'Payments: Invoice Issued' },
];

export default function MessagingTriggersPage() {
  useRealtimeAdminUpdates('');
  const qc = useQueryClient();
  const { data: rules = {}, isLoading } = useQuery({
    queryKey: ['messaging-rules'],
    queryFn: async () => {
      const res = await fetch('/api/messaging/rules');
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to load rules');
      return json.data?.rules || {};
    }
  });
  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/messaging/rules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to save rules');
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['messaging-rules'] }); }
  });
  return (
    <DashboardShell tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Messaging Triggers</h1>
        <div className="grid gap-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="font-medium mb-2">Automation Windows</div>
            {isLoading ? <div>Loading…</div> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-1">Booking reminder (hours before)</div>
                  <Input defaultValue={String(rules.booking_reminder_hours_before ?? 24)} onBlur={(e) => save.mutate({ booking_reminder_hours_before: Number(e.target.value || 0) })} />
                </div>
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-1">Invoice payment reminder (days after)</div>
                  <Input defaultValue={String(rules.invoice_payment_reminder_days_after ?? 3)} onBlur={(e) => save.mutate({ invoice_payment_reminder_days_after: Number(e.target.value || 0) })} />
                </div>
                <div>
                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-1">Post-service follow-up (days after)</div>
                  <Input defaultValue={String(rules.post_service_followup_days_after ?? 2)} onBlur={(e) => save.mutate({ post_service_followup_days_after: Number(e.target.value || 0) })} />
                </div>
              </div>
            )}
          </div>
          <div>
            <Button onClick={async () => { await fetch('/api/messaging/run', { method: 'POST' }); }}>Run Now</Button>
            <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] mt-1">Schedules can be hooked up via CRON on the host.</div>
          </div>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


