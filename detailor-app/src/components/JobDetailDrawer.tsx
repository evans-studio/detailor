"use client";
import * as React from 'react';
import { Sheet } from '@/components/Sheet';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { EvidenceUpload } from '@/components/EvidenceUpload';
import { enqueueRequest, flushQueue } from '@/lib/offline-queue';

export function JobDetailDrawer({ open, onOpenChange, jobId, onUpdated }: { open: boolean; onOpenChange: (v: boolean) => void; jobId: string | null; onUpdated: () => void }) {
  const [notes, setNotes] = React.useState('');
  const [checklist, setChecklist] = React.useState<Array<{ label: string; done: boolean }>>([]);
  const [saving, setSaving] = React.useState(false);
  const [materialName, setMaterialName] = React.useState('');
  const [materialQty, setMaterialQty] = React.useState<number>(1);
  const [materialCost, setMaterialCost] = React.useState<number>(0);
  const [materials, setMaterials] = React.useState<Array<{ name: string; quantity: number; unit_cost: number }>>([]);
  const [signature, setSignature] = React.useState<string | null>(null);
  const [qcPassed, setQcPassed] = React.useState<boolean>(false);
  const [assignee, setAssignee] = React.useState<string>('');
  const [staffOptions, setStaffOptions] = React.useState<Array<{ id: string; name: string }>>([]);
  React.useEffect(() => {
    (async () => {
      if (!jobId) return;
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const json = await res.json();
        setNotes(json?.job?.notes || '');
        const cl = (json?.job?.checklist || []) as Array<{ label: string; done: boolean }>;
        setChecklist(Array.isArray(cl) ? cl : []);
        setQcPassed(Boolean(json?.job?.qc_passed));
        setAssignee(json?.job?.staff_profile_id || '');
      } catch {}
    })();
  }, [jobId]);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profiles?role=staff');
        const json = await res.json();
        const list = (json.data?.profiles || json.profiles || []).map((p: any) => ({ id: p.id, name: p.full_name || p.email || 'Staff' }));
        setStaffOptions(list);
      } catch {}
    })();
  }, []);
  async function save() {
    if (!jobId) return;
    setSaving(true);
    try {
      const body = { notes, checklist, materials, signature_data_url: signature, qc_passed: qcPassed, staff_profile_id: assignee } as any;
      const doFetch = async () => fetch(`/api/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      try {
        const res = await doFetch();
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        enqueueRequest({ url: `/api/jobs/${jobId}`, method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
      }
      void flushQueue();
      onUpdated();
      onOpenChange(false);
    } finally { setSaving(false); }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="grid gap-3">
        <div className="text-[var(--font-size-lg)] font-semibold">Job Detail</div>
        <div className="grid gap-2">
          <div className="font-medium">Dispatch</div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">Assignee</span>
            <select className="border rounded px-2 py-1" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="font-medium">Checklist</div>
          {checklist.length === 0 ? <div className="text-[var(--color-text-muted)]">No checklist.</div> : (
            <div className="grid gap-1">
              {checklist.map((item, idx) => (
                <label key={idx} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={item.done} onChange={(e) => {
                    const next = [...checklist];
                    next[idx] = { ...next[idx], done: e.target.checked };
                    setChecklist(next);
                  }} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <EvidenceUpload jobId={jobId} />
        <div className="flex items-center gap-2">
          <input id="qc" type="checkbox" checked={qcPassed} onChange={(e) => setQcPassed(e.target.checked)} />
          <label htmlFor="qc">QC Passed</label>
        </div>
        <div className="grid gap-2">
          <div className="font-medium">Materials Used</div>
          <div className="flex gap-2 items-center">
            <Input placeholder="Name" value={materialName} onChange={(e) => setMaterialName(e.target.value)} />
            <Input type="number" placeholder="Qty" value={materialQty} onChange={(e) => setMaterialQty(Number(e.target.value))} />
            <Input type="number" placeholder="Unit Cost" value={materialCost} onChange={(e) => setMaterialCost(Number(e.target.value))} />
            <Button onClick={() => {
              if (!materialName) return;
              setMaterials((m) => [...m, { name: materialName, quantity: materialQty || 1, unit_cost: materialCost || 0 }]);
              setMaterialName(''); setMaterialQty(1); setMaterialCost(0);
            }}>Add</Button>
          </div>
          {materials.length > 0 && (
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              {materials.map((m, i) => (<div key={i}>{m.name} × {m.quantity} @ £{m.unit_cost}</div>))}
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <div className="font-medium">Customer Signature</div>
          <canvas id="sigpad" width={320} height={120} className="border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-white" />
          <div className="flex gap-2">
            <Button onClick={() => {
              const el = document.getElementById('sigpad') as HTMLCanvasElement | null;
              if (!el) return;
              const url = el.toDataURL('image/png');
              setSignature(url);
            }}>Capture</Button>
            <Button intent="ghost" onClick={() => setSignature(null)}>Clear</Button>
          </div>
          {signature && <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">Signature captured</div>}
        </div>
        <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end"><Button onClick={save} disabled={saving || !jobId}>{saving ? 'Saving…' : 'Save'}</Button></div>
      </div>
    </Sheet>
  );
}


