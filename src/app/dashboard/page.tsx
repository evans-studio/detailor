"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function DashboardPage() {
  // TODO: derive role from session; for now assume admin
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <div>Welcome to the dashboard shell.</div>
    </DashboardShell>
  );
}


