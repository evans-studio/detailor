"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Msg = { id: string; subject?: string; body?: string; created_at: string; from_role?: string };

export default function CustomerMessagesPage() {
  const qc = useQueryClient();
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', { scope: 'customer' }],
    queryFn: async (): Promise<Msg[]> => {
      const res = await fetch('/api/messages');
      const json = await res.json();
      return json.messages || [];
    },
  });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState('');
  const send = useMutation({
    mutationFn: async () => {
      if (!openId || !reply) return;
      await fetch('/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: reply, thread_id: openId }) });
    },
    onSuccess: async () => {
      setReply('');
      await qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
  const current = messages.find((m) => m.id === openId) || null;
  return (
    <DashboardShell role="customer" tenantName="DetailFlow">
      <div className="grid gap-4">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">Messages</h1>
        {messages.length === 0 ? (
          <div className="text-[var(--color-text-muted)]">No messages yet.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 border rounded-[var(--radius-md)] overflow-hidden">
              {messages.map((m) => (
                <button key={m.id} onClick={() => setOpenId(m.id)} className={`w-full text-left px-3 py-2 border-b last:border-b-0 ${openId === m.id ? 'bg-[var(--color-hover-surface)]' : ''}`}>
                  <div className="font-medium truncate">{m.subject || 'Message'}</div>
                  <div className="text-[var(--color-text-muted)] text-sm">{new Date(m.created_at).toLocaleString()}</div>
                </button>
              ))}
            </div>
            <div className="md:col-span-2 border rounded-[var(--radius-md)] p-4 min-h-[220px]">
              {!current ? <div className="text-[var(--color-text-muted)]">Select a message to view</div> : (
                <div className="grid gap-3">
                  <div className="font-semibold">{current.subject || 'Message'}</div>
                  <div className="whitespace-pre-wrap">{current.body || ''}</div>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-end mt-3">
                    <textarea className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2" placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
                    <button className="rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-3 py-2" onClick={() => send.mutate()} disabled={send.isPending || !reply}>Send</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}


