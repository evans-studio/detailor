"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Button } from '@/ui/button';

export default function BulkMessagingPage() {
  const [templateKey, setTemplateKey] = React.useState('booking.reminder');
  const [segment, setSegment] = React.useState<'all'|'active'|'inactive'>('all');
  const [limit, setLimit] = React.useState<number | ''>('');
  const [result, setResult] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSend() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/messaging/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template_key: templateKey, segment, limit: typeof limit === 'number' ? limit : undefined }) });
      const json = await res.json();
      if (json?.ok) setResult(`Sent ${json.sent}${json.demo ? ' (demo)' : ''}`);
      else setResult(json?.error || 'Failed');
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Bulk Messaging</h1>
        <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="grid gap-1">
            <div className="text-sm">Template Key</div>
            <Input placeholder="template.key" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <div className="text-sm">Segment</div>
            <Select options={[{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} value={segment} onValueChange={(v) => setSegment(v as 'all'|'active'|'inactive')} />
          </div>
          <div className="grid gap-1">
            <div className="text-sm">Limit (optional)</div>
            <Input placeholder="e.g. 100" value={String(limit)} onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : '')} />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSend} disabled={loading}>{loading ? 'Sending…' : 'Send'}</Button>
            {result ? <div className="text-[var(--color-text-muted)]">{result}</div> : null}
          </div>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


