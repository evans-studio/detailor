"use client";
import * as React from 'react';
import { Sheet } from '@/components/Sheet';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';

export function JobDetailDrawer({ open, onOpenChange, jobId, onUpdated }: { open: boolean; onOpenChange: (v: boolean) => void; jobId: string | null; onUpdated: () => void }) {
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setNotes(''); }, [jobId]);
  async function save() {
    if (!jobId) return;
    setSaving(true);
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) });
      onUpdated();
      onOpenChange(false);
    } finally { setSaving(false); }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="grid gap-3">
        <div className="text-[var(--font-size-lg)] font-semibold">Job Detail</div>
        <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end"><Button onClick={save} disabled={saving || !jobId}>{saving ? 'Saving…' : 'Save'}</Button></div>
      </div>
    </Sheet>
  );
}


