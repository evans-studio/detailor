"use client";
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavForRole, type UserRole } from '@/config/navConfig';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/ui/button';
import { NotificationsProvider } from '@/lib/notifications';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Badge } from '@/ui/badge';

// Enterprise icons (you can replace with lucide-react)
const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className }) => (
  <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className }) => (
  <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className }) => (
  <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a50.002 50.002 0 00-4.5-4.5L11 7H8a2 2 0 00-2 2v5a2 2 0 002 2h1a2 2 0 00-1 2 2 2 0 002 2v0a2 2 0 002-2z" />
  </svg>
);

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className }) => (
  <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

interface DashboardShellProps {
  role?: UserRole;
  tenantName?: string;
  brandColor?: string;
  children: React.ReactNode;
}

export function DashboardShell({ 
  role, 
  tenantName = 'Detailor', 
  brandColor,
  children 
}: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [resolvedRole, setResolvedRole] = React.useState<UserRole | null>(role ?? null);
  
  React.useEffect(() => {
    if (role) { 
      setResolvedRole(role); 
      return; 
    }
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

  // Apply brand theming if provided
  React.useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty('--brand-primary', brandColor);
    }
    return () => {
      if (brandColor) {
        document.documentElement.style.removeProperty('--brand-primary');
      }
    };
  }, [brandColor]);

  const items = getNavForRole(resolvedRole ?? 'admin');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Enterprise Header */}
      <EnterpriseHeader 
        tenantName={tenantName}
        onMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <EnterpriseSidebar 
          items={items}
          pathname={pathname}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        
        {/* Main Content Area */}
        <main className={`
          flex-1 overflow-auto bg-[var(--color-bg)]
          transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
          ${sidebarCollapsed ? 'ml-16' : 'ml-64'} 
          md:ml-0
        `}>
          <div className="p-6 pb-20 md:pb-6 max-w-[1600px] mx-auto">
            <NotificationsProvider>
              {resolvedRole ? children : <LoadingSkeleton rows={6} />}
            </NotificationsProvider>
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role={resolvedRole === 'customer' ? 'customer' : 'admin'} />
    </div>
  );
}

function EnterpriseHeader({ 
  tenantName, 
  onMobileMenu, 
  onSidebarToggle 
}: { 
  tenantName: string; 
  onMobileMenu: () => void;
  onSidebarToggle: () => void;
}) {
  return (
    <header className="
      h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)]
      flex items-center justify-between px-6
      shadow-[var(--shadow-sm)]
      sticky top-0 z-40
    ">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          intent="ghost"
          size="sm"
          onClick={onMobileMenu}
          className="md:hidden"
          aria-label="Toggle mobile menu"
        >
          <MenuIcon />
        </Button>
        
        {/* Desktop Sidebar Toggle */}
        <Button
          intent="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="hidden md:inline-flex"
          aria-label="Toggle sidebar"
        >
          <MenuIcon />
        </Button>
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="
            w-8 h-8 rounded-lg bg-gradient-to-br 
            from-[var(--brand-primary)] to-[var(--color-primary-600)]
            flex items-center justify-center text-white font-bold text-sm
          ">
            {tenantName.charAt(0)}
          </div>
          <h1 className="
            text-[var(--font-size-lg)] font-[var(--font-weight-semibold)]
            text-[var(--color-text)] tracking-[var(--letter-spacing-tight)]
          ">
            {tenantName}
          </h1>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="
          relative w-full
          bg-[var(--color-muted)] border border-[var(--color-border)]
          rounded-[var(--radius-lg)] transition-colors
          focus-within:bg-[var(--color-surface)] focus-within:border-[var(--color-primary)]
        ">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            className="
              w-full pl-10 pr-4 py-2 bg-transparent 
              text-[var(--font-size-sm)] text-[var(--color-text)]
              placeholder:text-[var(--color-text-muted)]
              focus:outline-none
            "
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button intent="ghost" size="sm" className="relative">
          <BellIcon />
          <Badge 
            className="
              absolute -top-1 -right-1 h-4 w-4 p-0 
              text-[var(--font-size-xs)] 
              bg-[var(--color-error)] text-white
            "
          >
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <Button intent="ghost" size="sm">
          <UserIcon />
        </Button>

        {/* Settings Link */}
        <Link href="/settings">
          <Button intent="ghost" size="sm">
            Settings
          </Button>
        </Link>
      </div>
    </header>
  );
}

function EnterpriseSidebar({ 
  items, 
  pathname, 
  collapsed, 
  mobileOpen, 
  onMobileClose 
}: {
  items: Array<{ path: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  pathname: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] z-50
        bg-[var(--color-surface)] border-r border-[var(--color-border)]
        transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
        shadow-[var(--shadow-lg)]
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:top-0 md:shadow-none
      `}>
        <nav className="p-4 space-y-2 h-full overflow-y-auto">
          {items.map((item) => {
            const active = pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onMobileClose()}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)]
                  text-[var(--font-size-sm)] font-[var(--font-weight-medium)]
                  transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]
                  ${active 
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)]' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-surface)] hover:text-[var(--color-text)]'
                  }
                  ${collapsed ? 'justify-center' : 'justify-start'}
                `}
                title={collapsed ? item.label : undefined}
              >
                {Icon && (
                  <Icon className={`
                    h-5 w-5 flex-shrink-0 transition-transform duration-[var(--duration-fast)]
                    ${active ? 'scale-110' : 'group-hover:scale-105'}
                  `} />
                )}
                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary-foreground)] opacity-75" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="border-t border-[var(--color-border)] p-4">
          {!collapsed && (
            <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] text-center">
              Powered by Detailor
            </div>
          )}
        </div>
      </aside>
    </>
  );
}


