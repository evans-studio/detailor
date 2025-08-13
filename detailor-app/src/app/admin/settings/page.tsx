"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Badge } from '@/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SettingsPage } from '@/components/settings/EnterpriseSettingsShell';
import { 
  SettingsSection, 
  SettingsField, 
  SettingsGrid, 
  SettingsActions,
  SettingsToggle,
  SettingsPreview
} from '@/components/settings/SettingsComponents';

interface TenantSettings {
  id: string;
  trading_name?: string;
  legal_name?: string;
  contact_email?: string;
  support_email?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  plan_id?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  business_type?: string;
  business_prefs?: {
    auto_confirm_bookings?: boolean;
    send_confirmation_emails?: boolean;
    send_reminder_emails?: boolean;
    require_customer_approval?: boolean;
    allow_online_payments?: boolean;
    service_radius_km?: number;
    operating_days?: string[];
  };
  created_at?: string;
  updated_at?: string;
}
export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  
  const { data: tenant, isLoading, error } = useQuery<TenantSettings>({
    queryKey: ['tenant'],
    queryFn: async (): Promise<TenantSettings> => {
      const res = await fetch('/api/settings/tenant');
      if (!res.ok) throw new Error('Failed to load settings');
      const json = await res.json();
      return json.data?.tenant || json.tenant || {
        id: '',
        business_prefs: {
          auto_confirm_bookings: false,
          send_confirmation_emails: true,
          send_reminder_emails: true,
          require_customer_approval: false,
          allow_online_payments: true,
          operating_days: ['1', '2', '3', '4', '5'],
        }
      };
    },
  });
  
  const [draft, setDraft] = React.useState<TenantSettings | null>(null);
  
  React.useEffect(() => { 
    if (tenant) {
      setDraft(tenant);
    }
  }, [tenant]);
  
  const updateDraft = (updates: Partial<TenantSettings>) => {
    setDraft(current => current ? { ...current, ...updates } : null);
    setHasChanges(true);
    setErrors({}); // Clear errors when user makes changes
  };
  
  const updateBusinessPrefs = (updates: Partial<TenantSettings['business_prefs']>) => {
    updateDraft({
      business_prefs: {
        ...draft?.business_prefs,
        ...updates
      }
    });
  };
  
  const updateAddress = (updates: Partial<TenantSettings['address']>) => {
    updateDraft({
      address: {
        ...draft?.address,
        ...updates
      }
    });
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!draft?.trading_name?.trim()) {
      newErrors.trading_name = 'Business name is required';
    }
    
    if (!draft?.contact_email?.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(draft.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }
    
    if (draft?.phone && !/^\+?[1-9]\d{1,14}$/.test(draft.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        throw new Error('Please fix the validation errors');
      }
      
      const response = await fetch('/api/settings/tenant', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(draft)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save settings');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tenant'] });
      setHasChanges(false);
      // Settings saved successfully (would show toast in production)
    },
    onError: (error) => {
      // Error saving settings (would show toast in production)
      console.error('Error saving settings:', error.message);
    }
  });
  
  const handleSave = async () => {
    await saveMutation.mutateAsync();
    // Refetch to ensure UI reflects persisted values
    await queryClient.invalidateQueries({ queryKey: ['tenant'] });
  };
  
  const handleReset = () => {
    setDraft(tenant || null);
    setHasChanges(false);
    setErrors({});
  };
  const actions = (
    <div className="flex items-center gap-2">
      <Badge variant={draft?.plan_id === 'pro' ? 'success' : 'warning'}>
        {draft?.plan_id === 'pro' ? 'Pro Plan' : 'Starter Plan'}
      </Badge>
      <Button 
        intent="secondary" 
        size="sm"
        onClick={() => window.open('/admin/billing', '_blank')}
      >
        Manage Billing
      </Button>
    </div>
  );
  
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin"]}>
        <SettingsPage
          title="General Settings"
          description="Configure your business information and basic preferences"
          section="general"
          loading={isLoading}
          error={error?.message}
          actions={actions}
        >
          {draft && (
            <div className="space-y-6">
              <SettingsGrid columns={2}>
                {/* Business Information */}
                <SettingsSection
                  title="Business Information"
                  description="Basic details about your business"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                >
                  <div className="space-y-4">
                    <SettingsField
                      label="Business Name"
                      description="The name customers will see"
                      required
                      error={errors.trading_name}
                    >
                      <Input
                        placeholder="e.g., Premium Auto Detailing"
                        value={draft.trading_name || ''}
                        onChange={(e) => updateDraft({ trading_name: e.target.value })}
                      />
                    </SettingsField>
                    
                    <SettingsField
                      label="Legal Name"
                      description="Official registered business name"
                    >
                      <Input
                        placeholder="e.g., Premium Auto Detailing LLC"
                        value={draft.legal_name || ''}
                        onChange={(e) => updateDraft({ legal_name: e.target.value })}
                      />
                    </SettingsField>
                    
                    <SettingsField
                      label="Business Type"
                      description="Type of mobile detailing business"
                    >
                      <Select
                        options={[
                          { label: 'Mobile Detailing Service', value: 'mobile_detailing' },
                          { label: 'Auto Detailing Shop', value: 'shop' },
                          { label: 'Fleet Services', value: 'fleet' },
                          { label: 'Multi-location Business', value: 'multi_location' },
                        ]}
                        value={draft.business_type || 'mobile_detailing'}
                        onValueChange={(v) => updateDraft({ business_type: v })}
                      />
                    </SettingsField>
                  </div>
                </SettingsSection>
                
                {/* Contact Information */}
                <SettingsSection
                  title="Contact Information"
                  description="How customers and staff can reach you"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  <div className="space-y-4">
                    <SettingsField
                      label="Primary Email"
                      description="Main contact email for your business"
                      required
                      error={errors.contact_email}
                    >
                      <Input
                        type="email"
                        placeholder="contact@yourbusiness.com"
                        value={draft.contact_email || ''}
                        onChange={(e) => updateDraft({ contact_email: e.target.value })}
                      />
                    </SettingsField>
                    
                    <SettingsField
                      label="Support Email"
                      description="Email for customer support inquiries"
                    >
                      <Input
                        type="email"
                        placeholder="support@yourbusiness.com"
                        value={draft.support_email || ''}
                        onChange={(e) => updateDraft({ support_email: e.target.value })}
                      />
                    </SettingsField>
                    
                    <SettingsField
                      label="Phone Number"
                      description="Primary business phone number"
                      error={errors.phone}
                    >
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={draft.phone || ''}
                        onChange={(e) => updateDraft({ phone: e.target.value })}
                      />
                    </SettingsField>
                    
                    <SettingsField
                      label="Website"
                      description="Your business website URL"
                    >
                      <Input
                        type="url"
                        placeholder="https://yourbusiness.com"
                        value={draft.website || ''}
                        onChange={(e) => updateDraft({ website: e.target.value })}
                      />
                    </SettingsField>
                  </div>
                </SettingsSection>
              </SettingsGrid>
              
              <SettingsGrid columns={2}>
                {/* Business Address */}
                <SettingsSection
                  title="Business Address"
                  description="Primary business location"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                >
                  <div className="space-y-4">
                    <SettingsField label="Street Address">
                      <Input
                        placeholder="123 Main Street"
                        value={draft.address?.street || ''}
                        onChange={(e) => updateAddress({ street: e.target.value })}
                      />
                    </SettingsField>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <SettingsField label="City">
                        <Input
                          placeholder="City"
                          value={draft.address?.city || ''}
                          onChange={(e) => updateAddress({ city: e.target.value })}
                        />
                      </SettingsField>
                      
                      <SettingsField label="State/Province">
                        <Input
                          placeholder="State"
                          value={draft.address?.state || ''}
                          onChange={(e) => updateAddress({ state: e.target.value })}
                        />
                      </SettingsField>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <SettingsField label="Postal Code">
                        <Input
                          placeholder="12345"
                          value={draft.address?.postal_code || ''}
                          onChange={(e) => updateAddress({ postal_code: e.target.value })}
                        />
                      </SettingsField>
                      
                      <SettingsField label="Country">
                        <Select
                          options={[
                            { label: 'United States', value: 'US' },
                            { label: 'Canada', value: 'CA' },
                            { label: 'United Kingdom', value: 'GB' },
                            { label: 'Australia', value: 'AU' },
                          ]}
                          value={draft.address?.country || 'US'}
                          onValueChange={(v) => updateAddress({ country: v })}
                        />
                      </SettingsField>
                    </div>
                  </div>
                </SettingsSection>
                
                {/* Regional Settings */}
                <SettingsSection
                  title="Regional Settings"
                  description="Localization and formatting preferences"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9a9 9 0 009-9m-9 9a9 9 0 01-9-9" />
                    </svg>
                  }
                >
                  <div className="space-y-4">
                    <SettingsField
                      label="Timezone"
                      description="Your business timezone"
                    >
                      <Select
                        options={[
                          { label: 'Eastern Time (ET)', value: 'America/New_York' },
                          { label: 'Central Time (CT)', value: 'America/Chicago' },
                          { label: 'Mountain Time (MT)', value: 'America/Denver' },
                          { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
                          { label: 'GMT', value: 'Europe/London' },
                        ]}
                        value={draft.timezone || 'America/New_York'}
                        onValueChange={(v) => updateDraft({ timezone: v })}
                      />
                    </SettingsField>
                    
                    <SettingsField
                      label="Currency"
                      description="Default currency for pricing"
                    >
                      <Select
                        options={[
                          { label: 'US Dollar ($)', value: 'USD' },
                          { label: 'Canadian Dollar (CAD)', value: 'CAD' },
                          { label: 'British Pound (£)', value: 'GBP' },
                          { label: 'Euro (€)', value: 'EUR' },
                          { label: 'Australian Dollar (AUD)', value: 'AUD' },
                        ]}
                        value={draft.currency || 'USD'}
                        onValueChange={(v) => updateDraft({ currency: v })}
                      />
                    </SettingsField>
                    
                    <SettingsField
                      label="Language"
                      description="Default language for the interface"
                    >
                      <Select
                        options={[
                          { label: 'English', value: 'en' },
                          { label: 'Spanish', value: 'es' },
                          { label: 'French', value: 'fr' },
                          { label: 'German', value: 'de' },
                        ]}
                        value={draft.language || 'en'}
                        onValueChange={(v) => updateDraft({ language: v })}
                      />
                    </SettingsField>
                  </div>
                </SettingsSection>
              </SettingsGrid>
              
              {/* Business Preferences */}
              <SettingsSection
                title="Business Preferences"
                description="Configure how your business operates"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                }
              >
                <div className="space-y-6">
                  <SettingsToggle
                    enabled={draft.business_prefs?.auto_confirm_bookings || false}
                    onChange={(enabled) => updateBusinessPrefs({ auto_confirm_bookings: enabled })}
                    label="Auto-confirm Bookings"
                    description="Automatically confirm new bookings without manual review"
                  />
                  
                  <SettingsToggle
                    enabled={draft.business_prefs?.send_confirmation_emails || true}
                    onChange={(enabled) => updateBusinessPrefs({ send_confirmation_emails: enabled })}
                    label="Send Confirmation Emails"
                    description="Email customers when bookings are confirmed"
                  />
                  
                  <SettingsToggle
                    enabled={draft.business_prefs?.send_reminder_emails || true}
                    onChange={(enabled) => updateBusinessPrefs({ send_reminder_emails: enabled })}
                    label="Send Reminder Emails"
                    description="Send reminder emails before appointments"
                  />
                  
                  <SettingsToggle
                    enabled={draft.business_prefs?.require_customer_approval || false}
                    onChange={(enabled) => updateBusinessPrefs({ require_customer_approval: enabled })}
                    label="Require Customer Approval"
                    description="Require customers to approve booking changes"
                    premium
                  />
                  
                  <SettingsToggle
                    enabled={draft.business_prefs?.allow_online_payments || true}
                    onChange={(enabled) => updateBusinessPrefs({ allow_online_payments: enabled })}
                    label="Allow Online Payments"
                    description="Enable customers to pay online during booking"
                  />
                </div>
              </SettingsSection>
              
              {/* Subscription Plan */}
              <SettingsSection
                title="Subscription Plan"
                description="Manage your Detailor subscription"
                badge={draft.plan_id === 'pro' ? 'Pro' : 'Starter'}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                }
              >
                <div className="space-y-4">
                  <SettingsPreview title="Current Plan">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                          {draft.plan_id === 'pro' ? 'Pro Plan' : 'Starter Plan'}
                        </h4>
                        <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                          {draft.plan_id === 'pro' 
                            ? 'Full access to all enterprise features'
                            : 'Basic features with limited functionality'
                          }
                        </p>
                      </div>
                      <Badge variant={draft.plan_id === 'pro' ? 'success' : 'warning'}>
                        {draft.plan_id === 'pro' ? 'Active' : 'Upgrade Available'}
                      </Badge>
                    </div>
                  </SettingsPreview>
                  
                  {draft.plan_id !== 'pro' && (
                    <div className="p-4 bg-gradient-to-r from-[var(--color-primary-50)] to-[var(--color-secondary-50)] rounded-[var(--radius-lg)] border border-[var(--color-primary-200)]">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-[var(--font-weight-semibold)] text-[var(--color-text)] mb-1">
                            Upgrade to Pro
                          </h4>
                          <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-3">
                            Unlock advanced features like team management, integrations, and premium support.
                          </p>
                          <Button intent="primary" size="sm">
                            Upgrade Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SettingsSection>
            </div>
          )}
          
          {/* Fixed Actions Bar */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-80">
            <SettingsActions
              onSave={handleSave}
              onReset={handleReset}
              isSaving={saveMutation.isPending}
              hasChanges={hasChanges}
              saveText="Save Settings"
            />
          </div>
        </SettingsPage>
      </RoleGuard>
    </DashboardShell>
  );
}


