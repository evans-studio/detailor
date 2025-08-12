"use client";
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavForRole, type UserRole } from '@/config/navConfig';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { IconButton } from '@/ui/icon-button';
import { NotificationsProvider } from '@/lib/notifications';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export function DashboardShell({ role, tenantName = 'Detailor', children }: { role?: UserRole; tenantName?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false); // mobile drawer
  const [resolvedRole, setResolvedRole] = React.useState<UserRole | null>(role ?? null);
  React.useEffect(() => {
    if (role) { setResolvedRole(role); return; }
    (async () => {
      try {
        const res = await fetch('/api/profiles/me');
        const json = await res.json();
        const r = (json?.profile?.role as UserRole | undefined) ?? 'admin';
        setResolvedRole(r);
      } catch {
        setResolvedRole('admin');
      }
    })();
  }, [role]);
  const items = getNavForRole(resolvedRole ?? 'admin');
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header onMenu={() => setOpen((o) => !o)} tenantName={tenantName} />
      <div className="grid grid-cols-[240px_1fr] md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        <aside className={`border-r border-[var(--color-border)] bg-[var(--color-surface)] p-3 ${open ? 'block' : 'hidden'} md:block`}> 
          <nav className="grid gap-1">
            {items.map((i) => {
              const active = pathname.startsWith(i.path);
              const Icon = i.icon;
              return (
                <Link key={i.path} href={i.path} className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 ${active ? 'bg-[var(--color-hover-surface)]' : ''}`}>
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span>{i.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="p-4 pb-20 md:pb-4">
          <NotificationsProvider>
            {resolvedRole ? children : <LoadingSkeleton rows={6} />}
          </NotificationsProvider>
        </main>
      </div>
      <MobileBottomNav role={resolvedRole === 'customer' ? 'customer' : 'admin'} />
    </div>
  );
}

function Header({ onMenu, tenantName }: { onMenu: () => void; tenantName: string }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <div className="flex items-center gap-2">
        <IconButton intent="ghost" onClick={onMenu} aria-label="Menu">☰</IconButton>
        <div className="font-semibold">{tenantName}</div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/settings">Settings</Link>
      </div>
    </header>
  );
}


