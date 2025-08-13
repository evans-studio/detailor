"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

type Item = { id: string; name: string; sku?: string; unit?: string; stock: number; reorder_level: number };

export default function InventoryPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ['inventory'],
    queryFn: async () => { const r = await fetch('/api/inventory', { cache: 'no-store' }); const j = await r.json(); return j.data?.items || j.items || []; }
  });
  const create = useMutation({
    mutationFn: async (body: Partial<Item>) => { await fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Item> }) => { await fetch(`/api/inventory/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(patch) }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
  const [name, setName] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [reorder, setReorder] = React.useState(0);

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)]">Inventory</h1>
            <div className="text-[var(--color-text-muted)]">Track stock and get reorder alerts</div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-center">
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
                <Input type="number" placeholder="Reorder Level" value={reorder} onChange={(e) => setReorder(Number(e.target.value||0))} />
                <Button onClick={() => { if (!name) return; create.mutate({ name, sku, reorder_level: reorder }); setName(''); setSku(''); setReorder(0); }}>Add</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? <div className="text-[var(--color-text-muted)]">No items</div> : (
                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between border-b border-[var(--color-border)] py-2">
                      <div className="flex-1">
                        <div className="font-medium">{it.name} {it.sku ? `• ${it.sku}` : ''}</div>
                        <div className="text-[var(--color-text-muted)] text-sm">Stock: {it.stock} {it.unit || 'unit'}{it.stock < (it.reorder_level||0) ? ' • Reorder' : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" className="w-24" value={it.stock} onChange={(e) => update.mutate({ id: it.id, patch: { stock: Number(e.target.value||0) } })} />
                        <Input type="number" className="w-28" value={it.reorder_level} onChange={(e) => update.mutate({ id: it.id, patch: { reorder_level: Number(e.target.value||0) } })} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


