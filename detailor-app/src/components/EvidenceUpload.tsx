"use client";
import * as React from 'react';

export function EvidenceUpload({ jobId }: { jobId: string | null }) {
  const [items, setItems] = React.useState<Array<{ name: string; url: string }>>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [kind, setKind] = React.useState<'before'|'after'|'other'>('other');
  async function load() {
    if (!jobId) return;
    const res = await fetch(`/api/jobs/${jobId}/evidence`);
    const json = await res.json();
    setItems(json.data?.items || json.items || []);
  }
  React.useEffect(() => { setItems([]); setError(null); load(); }, [jobId]);
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!jobId || !e.target.files?.length) return;
    const form = new FormData();
    Array.from(e.target.files).forEach((f) => form.append('files', f));
    form.append('kind', kind);
    const res = await fetch(`/api/jobs/${jobId}/evidence`, { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok || !json.success) { setError(json?.error?.message || 'Upload failed'); return; }
    setError(null);
    load();
  }
  return (
    <div className="grid gap-2">
      <div className="font-medium">Evidence</div>
      <div className="flex items-center gap-2">
        <label className="text-[var(--font-size-sm)]">Tag:</label>
        <select className="border rounded px-2 py-1" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="before">Before</option>
          <option value="after">After</option>
          <option value="other">Other</option>
        </select>
        <input type="file" multiple accept="image/*" onChange={onUpload} />
      </div>
      {error ? <div className="text-[var(--color-error)] text-sm">{error}</div> : null}
      <EvidenceGrid items={items} />
    </div>
  );
}

function EvidenceGrid({ items }: { items: Array<{ name: string; url: string; kind?: string }> }) {
  const byKind: Record<string, Array<{ name: string; url: string }>> = { before: [], after: [], other: [] };
  for (const it of items) {
    const k = (it as any).kind || 'other';
    byKind[k] = byKind[k] || [];
    byKind[k].push({ name: it.name, url: it.url });
  }
  return (
    <div className="grid gap-3">
      {(['before','after','other'] as const).map((k) => (
        <div key={k}>
          <div className="text-[var(--font-size-sm)] font-medium mb-1 capitalize">{k}</div>
          <div className="grid grid-cols-3 gap-2">
            {(byKind[k] || []).map((it) => (
              <a key={`${k}-${it.name}`} href={it.url} target="_blank" rel="noreferrer" className="block rounded-[var(--radius-sm)] border border-[var(--color-border)] p-1 text-center text-[var(--font-size-xs)]">
                {it.name}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


