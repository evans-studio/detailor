"use client";
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import Link from 'next/link';
import { Sheet } from '@/components/Sheet';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
type Template = { id: string; key: string; channel: 'email'|'sms'|'whatsapp'; active: boolean; updated_at: string };

export default function TemplatesListPage() {
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading: loading } = useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<Template[]> => {
      const res = await fetch('/api/messaging/templates');
      const json = await res.json();
      return json.templates || [];
    },
  });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [key, setKey] = React.useState('');
  const createMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/messaging/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, channel: 'email', active: false }) });
    },
    onSuccess: async () => {
      setCreateOpen(false); setKey('');
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
  async function onCreate() { await createMutation.mutateAsync(); }
  return (
    <DashboardShell tenantName="DetailFlow">
      <RoleGuard allowed={["admin"]}>
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-3">Templates</h1>
        <SmsCreditsBanner />
        <div className="flex justify-end mb-2"><Button onClick={() => setCreateOpen(true)}>New Template</Button></div>
        {loading ? <div>Loading…</div> : rows.length === 0 ? (
          <div className="text-[var(--color-text-muted)]">No templates yet.</div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--color-hover-surface)]"><tr><th className="px-3 py-2">Key</th><th>Channel</th><th>Status</th><th>Updated</th><th></th></tr></thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-t border-[var(--color-border)]"><td className="px-3 py-2">{t.key}</td><td>{t.channel}</td><td>{t.active ? 'Active' : 'Draft'}</td><td>{new Date(t.updated_at).toLocaleString()}</td><td className="px-3 py-2"><Link className="underline" href={`/admin/messaging/templates/${t.id}`}>Edit</Link></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <div className="grid gap-3">
            <div className="text-[var(--font-size-lg)] font-semibold">New Template</div>
            <Input placeholder="Key (e.g., booking.confirmation)" value={key} onChange={(e) => setKey(e.target.value)} />
            <div className="flex justify-end"><Button onClick={onCreate} disabled={!key}>Create</Button></div>
          </div>
        </Sheet>
      </RoleGuard>
    </DashboardShell>
  );
}

function SmsCreditsBanner() {
  const [credits, setCredits] = React.useState<number | null>(null);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tenant/me');
        const json = await res.json();
        const ff = (json?.tenant?.feature_flags as Record<string, unknown>) || {};
        setCredits(Number(ff.sms_credits || 0));
      } catch { setCredits(null); }
    })();
  }, []);
  return (
    <div className="mb-3 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="text-sm">
        <div className="font-medium">SMS Credits</div>
        <div className="text-[var(--color-text-muted)]">Current balance: {credits === null ? '—' : credits}</div>
      </div>
      <div className="flex gap-2">
        <a className="btn-ghost underline" href="#" onClick={async (e) => { e.preventDefault(); await startSmsPurchase('price_1RvGJrQJVipO0E7TTLe0cv4X','sms100'); }}>Buy 100 (£4)</a>
        <a className="btn-ghost underline" href="#" onClick={async (e) => { e.preventDefault(); await startSmsPurchase('price_1RvGKqQJVipO0E7TWgsghOCn','sms500'); }}>Buy 500 (£18)</a>
        <a className="btn-ghost underline" href="#" onClick={async (e) => { e.preventDefault(); await startSmsPurchase('price_1RvGLVQJVipO0E7TzeqjIDi4','sms1000'); }}>Buy 1000 (£32)</a>
      </div>
    </div>
  );
}

async function startSmsPurchase(priceId: string, sku: string) {
  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'stripe', amount: 1, currency: 'GBP', price_id: priceId, addon_sku: sku }),
  });
  const json = await res.json();
  if (json?.url) window.location.href = json.url as string;
}


