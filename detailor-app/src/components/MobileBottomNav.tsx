"use client";
import * as React from 'react';
import Link from 'next/link';

export function MobileBottomNav({ role = 'customer' }: { role?: 'customer' | 'admin' | 'staff' }) {
  const items = role === 'customer'
    ? [
        { label: 'Home', href: '/customer/dashboard' },
        { label: 'Bookings', href: '/bookings/me' },
        { label: 'Account', href: '/customer/account' },
      ]
    : [
        { label: 'Today', href: '/dashboard' },
        { label: 'Customers', href: '/admin/customers' },
        { label: 'Settings', href: '/settings' },
      ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-2 md:hidden">
      <div className="grid grid-cols-3 gap-1">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="text-center rounded-[var(--radius-sm)] px-2 py-2 hover:bg-[var(--color-hover-surface)]">
            {it.label}
          </Link>
        ))}
      </div>
      <div className="h-[16px]" />
    </nav>
  );
}


