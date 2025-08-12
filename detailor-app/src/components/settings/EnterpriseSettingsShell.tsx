"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  premium?: boolean;
  comingSoon?: boolean;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    title: 'General Settings',
    description: 'Business information, contact details, and basic configuration',
    href: '/admin/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'booking',
    title: 'Booking & Scheduling',
    description: 'Working hours, availability, booking rules and automation',
    href: '/admin/settings/booking',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'services',
    title: 'Services & Pricing',
    description: 'Service catalog, pricing tiers, and package management',
    href: '/admin/settings/services',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'payments',
    title: 'Payment Processing',
    description: 'Payment methods, billing settings, and financial configuration',
    href: '/admin/settings/payments',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'branding',
    title: 'Branding & Templates',
    description: 'Brand identity, colors, logos, and customer-facing templates',
    href: '/admin/settings/branding',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    badge: 'Enhanced',
  },
  {
    id: 'notifications',
    title: 'Notifications & Alerts',
    description: 'Email templates, SMS settings, and automated communications',
    href: '/admin/settings/notifications',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM21 12a9 9 0 11-18 0 9 9 0 0118 0zM10 10l3-3m0 0l3 3m-3-3v12" />
      </svg>
    ),
  },
  {
    id: 'integrations',
    title: 'Integrations & API',
    description: 'Third-party connections, webhooks, and API management',
    href: '/admin/settings/integrations',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
      </svg>
    ),
    premium: true,
  },
  {
    id: 'team',
    title: 'Team & Permissions',
    description: 'Staff accounts, roles, permissions, and access control',
    href: '/admin/settings/team',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    description: 'Security settings, audit logs, data protection, and compliance',
    href: '/admin/settings/security',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    premium: true,
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    description: 'Business intelligence, custom reports, and data export settings',
    href: '/admin/settings/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'automation',
    title: 'Workflow Automation',
    description: 'Automated workflows, triggers, and business process automation',
    href: '/admin/settings/automation',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    premium: true,
    comingSoon: true,
  },
];

interface EnterpriseSettingsShellProps {
  children: React.ReactNode;
  currentSection?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function EnterpriseSettingsShell({
  children,
  currentSection,
  title,
  description,
  actions
}: EnterpriseSettingsShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Determine current section from pathname if not provided
  const activeSection = currentSection || settingsSections.find(section => 
    pathname === section.href || pathname.startsWith(section.href + '/')
  )?.id || 'general';

  const currentSectionData = settingsSections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-[var(--color-surface)] border-r border-[var(--color-border)]
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <div>
                <h1 className="text-[var(--font-size-xl)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                  Settings
                </h1>
                <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mt-1">
                  Enterprise Configuration
                </p>
              </div>
              <Button
                intent="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {settingsSections.map((section) => (
                <Link key={section.id} href={section.href}>
                  <div className={`
                    group flex items-center gap-3 px-3 py-3 rounded-[var(--radius-lg)] transition-all
                    ${activeSection === section.id 
                      ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]' 
                      : 'text-[var(--color-text)] hover:bg-[var(--color-hover-surface)]'
                    }
                  `}>
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)]
                      ${activeSection === section.id 
                        ? 'text-white' 
                        : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'
                      }
                    `}>
                      {section.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`
                          font-[var(--font-weight-medium)] text-[var(--font-size-sm)] truncate
                          ${activeSection === section.id ? 'text-white' : ''}
                        `}>
                          {section.title}
                        </div>
                        
                        {section.badge && (
                          <Badge
                            variant={activeSection === section.id ? 'outline' : 'primary'}
                            size="sm"
                            className={activeSection === section.id ? 'border-white/30 text-white' : ''}
                          >
                            {section.badge}
                          </Badge>
                        )}
                        
                        {section.premium && (
                          <Badge variant="warning" size="sm">
                            Pro
                          </Badge>
                        )}
                        
                        {section.comingSoon && (
                          <Badge variant="outline" size="sm">
                            Soon
                          </Badge>
                        )}
                      </div>
                      
                      <div className={`
                        text-[var(--font-size-xs)] mt-1 line-clamp-2
                        ${activeSection === section.id 
                          ? 'text-white/80' 
                          : 'text-[var(--color-text-muted)]'
                        }
                      `}>
                        {section.description}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-[var(--color-border)]">
              <Card className="bg-gradient-to-r from-[var(--color-primary-50)] to-[var(--color-secondary-50)]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                        Enterprise Support
                      </h4>
                      <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
                        Need help configuring your settings? Our team is here to help.
                      </p>
                      <Button intent="ghost" size="sm" className="mt-2">
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-6 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              <Button
                intent="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              
              <div>
                <h1 className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text)]">
                  {title || currentSectionData?.title || 'Settings'}
                </h1>
                {(description || currentSectionData?.description) && (
                  <p className="text-[var(--color-text-muted)] mt-1">
                    {description || currentSectionData?.description}
                  </p>
                )}
              </div>
            </div>
            
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

// Settings Page Layout Wrapper
interface SettingsPageProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  section?: string;
  loading?: boolean;
  error?: string;
}

export function SettingsPage({
  title,
  description,
  actions,
  children,
  section,
  loading = false,
  error
}: SettingsPageProps) {
  if (loading) {
    return (
      <EnterpriseSettingsShell currentSection={section} title={title} description={description} actions={actions}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--color-text-muted)]">Loading settings...</p>
          </div>
        </div>
      </EnterpriseSettingsShell>
    );
  }

  if (error) {
    return (
      <EnterpriseSettingsShell currentSection={section} title={title} description={description} actions={actions}>
        <Card className="border-[var(--color-error)] bg-[var(--color-error-50)]">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-error)] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text)] mb-2">
              Error Loading Settings
            </h3>
            <p className="text-[var(--color-text-muted)] mb-4">{error}</p>
            <Button intent="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </EnterpriseSettingsShell>
    );
  }

  return (
    <EnterpriseSettingsShell currentSection={section} title={title} description={description} actions={actions}>
      {children}
    </EnterpriseSettingsShell>
  );
}