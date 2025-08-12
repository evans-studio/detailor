"use client";
import * as React from 'react';
import { Sheet } from '@/components/Sheet';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { EvidenceUpload } from '@/components/EvidenceUpload';

export function JobDetailDrawer({ open, onOpenChange, jobId, onUpdated }: { open: boolean; onOpenChange: (v: boolean) => void; jobId: string | null; onUpdated: () => void }) {
  const [notes, setNotes] = React.useState('');
  const [checklist, setChecklist] = React.useState<Array<{ label: string; done: boolean }>>([]);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      if (!jobId) return;
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const json = await res.json();
        setNotes(json?.job?.notes || '');
        const cl = (json?.job?.checklist || []) as Array<{ label: string; done: boolean }>;
        setChecklist(Array.isArray(cl) ? cl : []);
      } catch {}
    })();
  }, [jobId]);
  async function save() {
    if (!jobId) return;
    setSaving(true);
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes, checklist }) });
      onUpdated();
      onOpenChange(false);
    } finally { setSaving(false); }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="grid gap-3">
        <div className="text-[var(--font-size-lg)] font-semibold">Job Detail</div>
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
        <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end"><Button onClick={save} disabled={saving || !jobId}>{saving ? 'Saving…' : 'Save'}</Button></div>
      </div>
    </Sheet>
  );
}


