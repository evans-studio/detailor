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
import { SkipLink, ScreenReaderOnly, useFocusTrap } from '@/components/ui/AccessibilityUtils';
import { useAuth } from '@/lib/auth-context';

// Enterprise icons (you can replace with lucide-react)
const MenuIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Removed unused SearchIcon component

const BellIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a50.002 50.002 0 00-4.5-4.5L11 7H8a2 2 0 00-2 2v5a2 2 0 002 2h1a2 2 0 00-1 2 2 2 0 002 2v0a2 2 0 002-2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const { user, loading } = useAuth();
  
  // Use provided role or fall back to user role from context
  const resolvedRole = role || (user?.role as UserRole) || 'admin';

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

  const items = getNavForRole(resolvedRole);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Skip to main content link for keyboard navigation */}
      <SkipLink />
      
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
        
        {/* Main Content Area - rely on flex layout; no margin-left shifting */}
        <main 
          id="main-content"
          className={`
            flex-1 overflow-auto bg-[var(--color-bg)]
            transition-[padding,width] duration-300 ease-out
          `}
          role="main"
          aria-label="Main content"
        >
          <div className="p-4 sm:p-6 md:p-8 pb-20 sm:pb-24 md:pb-8 max-w-7xl mx-auto">
            <NotificationsProvider>
              {loading ? (
                <div role="status" aria-label="Loading content">
                  <LoadingSkeleton rows={6} />
                  <ScreenReaderOnly>Loading dashboard content, please wait...</ScreenReaderOnly>
                </div>
              ) : (
                children
              )}
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
    <header 
      className="
        h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)]
        flex items-center justify-between px-6
        shadow-sm
        sticky top-0 z-40
      "
      role="banner"
      aria-label="Main navigation header"
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button
          intent="ghost"
          size="sm"
          onClick={onMobileMenu}
          className="md:hidden"
          aria-label="Open mobile navigation menu"
          aria-expanded="false"
          aria-controls="mobile-navigation"
        >
          <MenuIcon />
          <ScreenReaderOnly>Menu</ScreenReaderOnly>
        </Button>
        
        {/* Desktop Sidebar Toggle */}
        <Button
          intent="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="hidden md:inline-flex"
          aria-label="Toggle navigation sidebar"
          aria-expanded="true"
          aria-controls="desktop-navigation"
        >
          <MenuIcon />
          <ScreenReaderOnly>Toggle Sidebar</ScreenReaderOnly>
        </Button>
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="
            w-10 h-10 rounded-xl bg-[var(--color-primary)]
            flex items-center justify-center text-[var(--color-primary-foreground)] font-bold text-sm
            shadow-md hover:shadow-lg transition-shadow duration-200
          ">
            {tenantName.charAt(0)}
          </div>
          <h1 className="
            text-lg font-semibold
            text-[var(--color-text)] tracking-tight
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
          rounded-xl transition-all duration-200
          focus-within:bg-[var(--color-surface)] focus-within:border-[var(--color-primary)] focus-within:shadow-md
        ">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="
              w-full pl-10 pr-4 py-2.5 bg-transparent 
              text-sm text-[var(--color-text)]
              placeholder:text-[var(--color-text-muted)]
              focus:outline-none
            "
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button intent="ghost" size="sm" className="relative hover:bg-[var(--color-hover-surface)]">
          <BellIcon />
          <Badge 
            className="
              absolute -top-1 -right-1 h-5 w-5 p-0 
              text-xs font-medium
              bg-[var(--color-error)] text-[var(--color-error-foreground)] border-2 border-[var(--color-surface)]
              flex items-center justify-center
            "
          >
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <Button intent="ghost" size="sm" className="hover:bg-[var(--color-hover-surface)]">
          <UserIcon />
        </Button>

        {/* Settings Link */}
        <Link href="/admin/settings">
          <Button intent="ghost" size="sm" className="hover:bg-[var(--color-hover-surface)] font-medium">
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
          className="fixed inset-0 bg-[var(--color-text)]/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Mobile-First Responsive Sidebar */}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] z-50
        bg-[var(--color-surface)] border-r border-[var(--color-border)]
        transition-all duration-300 ease-out
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        md:translate-x-0 md:relative md:top-0 md:shadow-sm
      `} aria-label="Sidebar navigation">
        <nav className="p-3 sm:p-4 space-y-1 h-full overflow-y-auto">
          {items.map((item) => {
            const active = pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onMobileClose()}
                className={`
                  group flex items-center gap-3 px-3 py-3 sm:py-3 rounded-xl
                  text-sm font-medium
                  transition-all duration-200 ease-out
                  min-h-[44px]
                  ${active 
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md transform scale-[1.02]' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover-surface)] hover:text-[var(--color-text)] active:bg-[var(--color-active-surface)]'
                  }
                  ${collapsed ? 'justify-center md:justify-center' : 'justify-start'}
                `}
                title={collapsed ? item.label : undefined}
              >
                {Icon && (
                  <Icon className={`
                    h-5 w-5 flex-shrink-0 transition-transform duration-200
                    ${active ? 'scale-110' : 'group-hover:scale-105'}
                  `} />
                )}
                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[var(--color-primary-foreground)]/80" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="border-t border-[var(--color-border)] p-4">
          {!collapsed && (
            <div className="text-xs text-[var(--color-text-muted)] text-center font-medium">
              Powered by Detailor
            </div>
          )}
        </div>
      </aside>
    </>
  );
}


