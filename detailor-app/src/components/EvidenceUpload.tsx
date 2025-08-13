"use client";
import * as React from 'react';

export function EvidenceUpload({ jobId }: { jobId: string | null }) {
  const [items, setItems] = React.useState<Array<{ name: string; url: string }>>([]);
  const [error, setError] = React.useState<string | null>(null);
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
    const res = await fetch(`/api/jobs/${jobId}/evidence`, { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok || !json.success) { setError(json?.error?.message || 'Upload failed'); return; }
    setError(null);
    load();
  }
  return (
    <div className="grid gap-2">
      <div className="font-medium">Evidence</div>
      <input type="file" multiple accept="image/*" onChange={onUpload} />
      {error ? <div className="text-[var(--color-error)] text-sm">{error}</div> : null}
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <a key={it.name} href={it.url} target="_blank" rel="noreferrer" className="block rounded-[var(--radius-sm)] border border-[var(--color-border)] p-1 text-center text-[var(--font-size-xs)]">
            {it.name}
          </a>
        ))}
      </div>
    </div>
  );
}


