"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';

type Profile = { id: string; full_name?: string; email?: string; role: 'admin'|'staff'|'customer'; created_at?: string };

export default function StaffManagementPage() {
  const qc = useQueryClient();
  const { data: staff = [] } = useQuery<Profile[]>({
    queryKey: ['profiles', { scope: 'staff' }],
    queryFn: async () => {
      const res = await fetch('/api/profiles?role=staff', { cache: 'no-store' });
      const json = await res.json();
      return json.data?.profiles || json.profiles || [];
    },
  });
  const { data: admins = [] } = useQuery<Profile[]>({
    queryKey: ['profiles', { scope: 'admin' }],
    queryFn: async () => {
      const res = await fetch('/api/profiles?role=admin', { cache: 'no-store' });
      const json = await res.json();
      return json.data?.profiles || json.profiles || [];
    },
  });

  const invite = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'staff'|'admin'|'customer' }) => {
      const res = await fetch('/api/invites/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Invite failed');
      return json.data?.invite || json.invite;
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Profile['role'] }) => {
      const res = await fetch('/api/profiles', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) });
      if (!res.ok) throw new Error('update failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'staff'|'admin'|'customer'>('staff');

  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)]">Team Management</h1>
            <div className="text-[var(--color-text-muted)]">Invite staff, assign roles, and manage your team</div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invite User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-center">
                <Input placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Select options={[{label:'Staff',value:'staff'},{label:'Admin',value:'admin'},{label:'Customer',value:'customer'}]} value={role} onValueChange={(v) => setRole(v as any)} />
                <Button onClick={() => invite.mutate({ email, role })} disabled={!email}>Send Invite</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {admins.length === 0 ? <div className="text-[var(--color-text-muted)]">No admins</div> : admins.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-[var(--color-border)] py-2">
                      <div className="text-[var(--color-text)]">{p.full_name || p.email}</div>
                      <div className="text-[var(--color-text-muted)] text-sm">{new Date(p.created_at || Date.now()).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {staff.length === 0 ? <div className="text-[var(--color-text-muted)]">No staff</div> : staff.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-[var(--color-border)] py-2">
                      <div className="text-[var(--color-text)]">{p.full_name || p.email}</div>
                      <div className="flex items-center gap-2">
                        <Select options={[{label:'Staff',value:'staff'},{label:'Admin',value:'admin'},{label:'Customer',value:'customer'}]} value={p.role} onValueChange={(v) => updateRole.mutate({ id: p.id, role: v as any })} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


