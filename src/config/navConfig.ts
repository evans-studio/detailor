import { Home, Calendar, FileText, Users, Settings, CreditCard, MessageCircle } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export type UserRole = 'admin' | 'customer' | 'super_admin';

export type NavItem = {
  label: string;
  path: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  roles: UserRole[];
  section?: string;
  external?: boolean;
};

export const navItems: NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: Home, roles: ['admin', 'customer', 'super_admin'] },
  { label: 'Bookings', path: '/bookings', icon: Calendar, roles: ['admin', 'super_admin'], section: 'Operations' },
  { label: 'My Bookings', path: '/bookings/me', icon: Calendar, roles: ['customer'], section: 'Operations' },
  { label: 'Quotes', path: '/quotes', icon: FileText, roles: ['admin', 'super_admin'], section: 'Operations' },
  { label: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'super_admin'], section: 'CRM' },
  { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['admin', 'super_admin'], section: 'Finance' },
  { label: 'Messages', path: '/messages', icon: MessageCircle, roles: ['admin', 'customer', 'super_admin'], section: 'Comms' },
  { label: 'Customer Home', path: '/customer/dashboard', icon: Home, roles: ['customer'] },
  { label: 'My Account', path: '/customer/account', icon: Settings, roles: ['customer'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'super_admin'] },
];

export function getNavForRole(role: UserRole) {
  return navItems.filter((i) => i.roles.includes(role));
}


