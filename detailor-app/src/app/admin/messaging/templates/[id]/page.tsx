"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Sheet } from '@/components/Sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Template = { id: string; key: string; subject?: string; body_html?: string; body_text?: string; channel: string; active: boolean };

export default function TemplateEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { data: tpl, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: async (): Promise<Template | null> => {
      const res = await fetch(`/api/messaging/templates/${id}`);
      const json = await res.json();
      return json.template || null;
    },
  });
  const [draft, setDraft] = React.useState<Template | null>(null);
  React.useEffect(() => { setDraft(tpl || null); }, [tpl]);
  const [testOpen, setTestOpen] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState('');
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      await fetch(`/api/messaging/templates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: draft.subject, body_html: draft.body_html, body_text: draft.body_text, active: draft.active }) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['template', id] });
    },
  });
  async function onSave() { await saveMutation.mutateAsync(); }
  return (
    <DashboardShell tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        {isLoading || !draft ? <div>Loading…</div> : (
          <div className="grid gap-3">
            <h1 className="text-[var(--font-size-2xl)] font-semibold">Edit Template: {draft.key}</h1>
            <Input placeholder="Subject" value={draft.subject || ''} onChange={(e) => setDraft({ ...draft, subject: e.target.value } as Template)} />
            <div className="grid gap-1">
              <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">Body (HTML)</div>
              <textarea className="min-h-[180px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2" value={draft.body_html || ''} onChange={(e) => setDraft({ ...draft, body_html: e.target.value } as Template)} />
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="font-medium mb-2">Preview</div>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: draft.body_html || '' }} />
            </div>
            <div className="flex justify-end gap-2">
              <Button intent="ghost" onClick={() => setTestOpen(true)}>Test Send</Button>
              <Button onClick={onSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
            <Sheet open={testOpen} onOpenChange={setTestOpen}>
              <div className="grid gap-3">
                <div className="text-[var(--font-size-lg)] font-semibold">Test Send</div>
                <Input type="email" placeholder="Recipient email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                <div className="text-[var(--color-text-muted)] text-sm">Disabled in demo tenants.</div>
                <div className="flex justify-end"><Button onClick={async () => { await fetch('/api/messaging/test-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: testEmail, template_id: id }) }); setTestOpen(false); }} disabled={!testEmail}>Send</Button></div>
              </div>
            </Sheet>
          </div>
        )}
      </RoleGuard>
    </DashboardShell>
  );
}


