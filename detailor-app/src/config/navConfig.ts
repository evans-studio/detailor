import { Home, Calendar, FileText, Users, Settings, CreditCard, MessageCircle } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export type UserRole = 'admin' | 'staff' | 'customer' | 'super_admin';

export type NavItem = {
  label: string;
  path: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  roles: UserRole[];
  section?: string;
  external?: boolean;
};

export const navItems: NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: Home, roles: ['admin', 'staff', 'customer', 'super_admin'] },
  { label: 'Bookings', path: '/bookings', icon: Calendar, roles: ['admin', 'staff', 'super_admin'], section: 'Operations' },
  { label: 'My Bookings', path: '/bookings/me', icon: Calendar, roles: ['customer'], section: 'Operations' },
  { label: 'Quotes', path: '/admin/quotes', icon: FileText, roles: ['admin', 'staff', 'super_admin'], section: 'Operations' },
  { label: 'Customers', path: '/admin/customers', icon: Users, roles: ['admin', 'staff', 'super_admin'], section: 'CRM' },
  { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['admin', 'staff', 'super_admin'], section: 'Finance' },
  { label: 'Messages', path: '/admin/messages', icon: MessageCircle, roles: ['admin', 'staff', 'super_admin'], section: 'Comms' },
  { label: 'Customer Home', path: '/customer/dashboard', icon: Home, roles: ['customer'] },
  { label: 'My Account', path: '/customer/account', icon: Settings, roles: ['customer'] },
  { label: 'Settings', path: '/admin/settings', icon: Settings, roles: ['admin', 'super_admin'] },
];

export function getNavForRole(role: UserRole) {
  return navItems.filter((i) => i.roles.includes(role));
}


