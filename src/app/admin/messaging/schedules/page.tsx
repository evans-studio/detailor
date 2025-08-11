"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function MessagingSchedulesPage() {
  const queryClient = useQueryClient();
  type Rules = {
    booking_reminder_hours_before?: number;
    invoice_payment_reminder_days_after?: number;
    post_service_followup_days_after?: number;
  } | null;
  const { data: rules } = useQuery<Rules>({
    queryKey: ['messaging-rules'],
    queryFn: async () => {
      const res = await fetch('/api/messaging/rules');
      const json = await res.json();
      return json.rules || {};
    },
  });
  const [draft, setDraft] = React.useState<NonNullable<Rules>>({});
  React.useEffect(() => { if (rules) setDraft(rules); }, [rules]);
  const save = useMutation({
    mutationFn: async () => {
      await fetch('/api/messaging/rules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['messaging-rules'] }); },
  });
  return (
    <DashboardShell tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Messaging Schedules</h1>
        {!rules ? (
          <div>Loading…</div>
        ) : (
          <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="font-medium">Reminders</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="grid gap-1">
                <div className="text-sm">Booking reminder (hours before)</div>
                <Input value={String(draft?.booking_reminder_hours_before ?? '')} onChange={(e) => setDraft({ ...draft, booking_reminder_hours_before: Number(e.target.value || 0) })} />
              </div>
              <div className="grid gap-1">
                <div className="text-sm">Invoice payment reminder (days after due)</div>
                <Input value={String(draft?.invoice_payment_reminder_days_after ?? '')} onChange={(e) => setDraft({ ...draft, invoice_payment_reminder_days_after: Number(e.target.value || 0) })} />
              </div>
              <div className="grid gap-1">
                <div className="text-sm">Post-service follow-up (days after)</div>
                <Input value={String(draft?.post_service_followup_days_after ?? '')} onChange={(e) => setDraft({ ...draft, post_service_followup_days_after: Number(e.target.value || 0) })} />
              </div>
            </div>
            <div className="flex justify-end"><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button></div>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


