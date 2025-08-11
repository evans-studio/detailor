"use client";
import * as React from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Select } from '@/ui/select';
import { useNotifications } from '@/lib/notifications';

type Step = 'business' | 'service' | 'availability' | 'branding' | 'complete';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = React.useState<Step>('business');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { notify } = useNotifications();
  const [hasService, setHasService] = React.useState<boolean | null>(null);
  const [hasAvailability, setHasAvailability] = React.useState<boolean | null>(null);

  // Business Info
  const [businessForm, setBusinessForm] = React.useState({
    legal_name: '',
    trading_name: '',
    contact_email: '',
    admin_email: '',
    admin_full_name: '',
    phone: '',
    address_line1: '',
    city: '',
    postcode: '',
    timezone: 'Europe/London',
    currency: 'GBP'
  });

  // Service Info
  const [serviceForm, setServiceForm] = React.useState({
    name: '',
    duration_hours: 2,
    base_price: 50,
    description: ''
  });

  // Availability Info
  const [availabilityForm, setAvailabilityForm] = React.useState({
    monday_start: '09:00',
    monday_end: '17:00',
    tuesday_start: '09:00',
    tuesday_end: '17:00',
    wednesday_start: '09:00',
    wednesday_end: '17:00',
    thursday_start: '09:00',
    thursday_end: '17:00',
    friday_start: '09:00',
    friday_end: '17:00',
    saturday_start: '09:00',
    saturday_end: '15:00',
    sunday_closed: true,
    capacity_per_slot: 1
  });

  // Branding Info
  const [brandingForm, setBrandingForm] = React.useState({
    primary_color: '#3B82F6',
    logo_text: ''
  });

  const handleSubmit = async (step: Step) => {
    setSubmitting(true);
    setError(null);
    
    try {
      switch (step) {
        case 'business':
          // Create tenant with business info
          const tenantRes = await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(businessForm)
          });
          const tenantData = await tenantRes.json();
          if (!tenantData.ok) throw new Error(tenantData.error);
          setCurrentStep('service');
          break;

        case 'service':
          // Create first service
          const serviceRes = await fetch('/api/admin/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: serviceForm.name,
              duration_minutes: serviceForm.duration_hours * 60,
              base_price_pence: serviceForm.base_price * 100,
              description: serviceForm.description,
              is_active: true
            })
          });
          const serviceData = await serviceRes.json();
          if (!serviceData.ok) throw new Error(serviceData.error);
          setHasService(true);
          setCurrentStep('availability');
          break;

        case 'availability':
          // Set up basic availability
          const availabilityRes = await fetch('/api/admin/availability/work-patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              monday_start: availabilityForm.monday_start,
              monday_end: availabilityForm.monday_end,
              tuesday_start: availabilityForm.tuesday_start,
              tuesday_end: availabilityForm.tuesday_end,
              wednesday_start: availabilityForm.wednesday_start,
              wednesday_end: availabilityForm.wednesday_end,
              thursday_start: availabilityForm.thursday_start,
              thursday_end: availabilityForm.thursday_end,
              friday_start: availabilityForm.friday_start,
              friday_end: availabilityForm.friday_end,
              saturday_start: availabilityForm.saturday_start,
              saturday_end: availabilityForm.saturday_end,
              sunday_closed: availabilityForm.sunday_closed,
              capacity_per_slot: availabilityForm.capacity_per_slot
            })
          });
          const availabilityData = await availabilityRes.json();
          if (!availabilityData.ok) throw new Error(availabilityData.error);
          setHasAvailability(true);
          setCurrentStep('branding');
          break;

        case 'branding':
          // Set up basic branding
          const brandingRes = await fetch('/api/admin/settings/branding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              primary_color: brandingForm.primary_color,
              business_name: brandingForm.logo_text || businessForm.trading_name || businessForm.legal_name
            })
          });
          // Don't fail if branding fails - it's not critical
          // Enforce completion prerequisites
          if (!hasService) {
            setCurrentStep('service');
            notify({ title: 'Add your first service to continue' });
            break;
          }
          if (!hasAvailability) {
            setCurrentStep('availability');
            notify({ title: 'Set your working hours to continue' });
            break;
          }
          setCurrentStep('complete');
          break;
      }
    } catch (e) {
      setError((e as Error).message);
      notify({ title: `Setup failed: ${(e as Error).message}` });
    } finally {
      setSubmitting(false);
    }
  };

  if (currentStep === 'complete') {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-lg w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-success)] flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-[var(--font-size-xl)] font-semibold text-[var(--color-text)] mb-2">Setup Complete!</div>
            <div className="text-[var(--color-text-muted)] mb-6">Your business is now ready to accept bookings. You can customize more settings later.</div>
          </div>
          <a 
            href="/dashboard" 
            className="inline-block rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 py-3 text-[var(--color-primary-foreground)] font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  const stepTitles = {
    business: 'Business Information',
    service: 'Your First Service',
    availability: 'Working Hours',
    branding: 'Branding (Optional)'
  };

  const stepNumbers = {
    business: 1,
    service: 2,
    availability: 3,
    branding: 4
  };

  return (
    <main className="min-h-screen bg-[var(--color-background)] py-8">
      <div className="max-w-2xl mx-auto px-6">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              Step {stepNumbers[currentStep]} of 4
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              {Math.round((stepNumbers[currentStep] / 4) * 100)}% Complete
            </div>
          </div>
          <div className="w-full bg-[var(--color-border)] rounded-full h-2">
            <div 
              className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stepNumbers[currentStep] / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <div className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)] mb-2">
            {stepTitles[currentStep]}
          </div>
          <div className="text-[var(--color-text-muted)] mb-6">
            {currentStep === 'business' && "Let's start with your business details"}
            {currentStep === 'service' && "Create your first service offering"}
            {currentStep === 'availability' && "Set your working hours"}
            {currentStep === 'branding' && "Customize your brand appearance"}
          </div>

          {renderStepContent()}
        </div>
      </div>
    </main>
  );

  function renderStepContent() {
    switch (currentStep) {
      case 'business':
        return (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Business Name *
                </label>
                <Input 
                  placeholder="Your business name" 
                  value={businessForm.legal_name} 
                  onChange={(e) => setBusinessForm({ ...businessForm, legal_name: e.target.value })} 
                  required
                />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Trading Name
                </label>
                <Input 
                  placeholder="Trading name (optional)" 
                  value={businessForm.trading_name} 
                  onChange={(e) => setBusinessForm({ ...businessForm, trading_name: e.target.value })} 
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Contact Email *
                </label>
                <Input 
                  type="email" 
                  placeholder="contact@yourbusiness.com" 
                  value={businessForm.contact_email} 
                  onChange={(e) => setBusinessForm({ ...businessForm, contact_email: e.target.value })} 
                  required
                />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Phone Number
                </label>
                <Input 
                  type="tel" 
                  placeholder="Your phone number" 
                  value={businessForm.phone} 
                  onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                Business Address
              </label>
              <div className="space-y-3">
                <Input 
                  placeholder="Street address" 
                  value={businessForm.address_line1} 
                  onChange={(e) => setBusinessForm({ ...businessForm, address_line1: e.target.value })} 
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="City" 
                    value={businessForm.city} 
                    onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })} 
                  />
                  <Input 
                    placeholder="Postcode" 
                    value={businessForm.postcode} 
                    onChange={(e) => setBusinessForm({ ...businessForm, postcode: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Admin Name *
                </label>
                <Input 
                  placeholder="Your full name" 
                  value={businessForm.admin_full_name} 
                  onChange={(e) => setBusinessForm({ ...businessForm, admin_full_name: e.target.value })} 
                  required
                />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Admin Email *
                </label>
                <Input 
                  type="email" 
                  placeholder="admin@yourbusiness.com" 
                  value={businessForm.admin_email} 
                  onChange={(e) => setBusinessForm({ ...businessForm, admin_email: e.target.value })} 
                  required
                />
              </div>
            </div>

            {error && <div className="text-[var(--color-error)] text-[var(--font-size-sm)]">{error}</div>}
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => handleSubmit('business')} 
                disabled={submitting || !businessForm.legal_name || !businessForm.contact_email || !businessForm.admin_email || !businessForm.admin_full_name}
              >
                {submitting ? 'Setting up...' : 'Continue'}
              </Button>
            </div>
          </div>
        );

      case 'service':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                Service Name *
              </label>
              <Input 
                placeholder="e.g., Premium Car Detail" 
                value={serviceForm.name} 
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} 
                required
              />
            </div>

            <div>
              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                Description
              </label>
              <Input 
                placeholder="Brief description of what's included" 
                value={serviceForm.description} 
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} 
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Duration (hours) *
                </label>
                <Select
                  options={[
                    { label: '1 hour', value: '1' },
                    { label: '1.5 hours', value: '1.5' },
                    { label: '2 hours', value: '2' },
                    { label: '2.5 hours', value: '2.5' },
                    { label: '3 hours', value: '3' },
                    { label: '4 hours', value: '4' }
                  ]}
                  value={serviceForm.duration_hours.toString()}
                  onValueChange={(v) => setServiceForm({ ...serviceForm, duration_hours: parseFloat(v) })}
                />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Base Price (£) *
                </label>
                <Input 
                  type="number" 
                  placeholder="50" 
                  value={serviceForm.base_price} 
                  onChange={(e) => setServiceForm({ ...serviceForm, base_price: parseFloat(e.target.value) || 0 })} 
                  required
                />
              </div>
            </div>

            {error && <div className="text-[var(--color-error)] text-[var(--font-size-sm)]">{error}</div>}
            
            <div className="flex justify-between pt-4">
              <Button intent="ghost" onClick={() => setCurrentStep('business')}>
                Back
              </Button>
              <Button 
                onClick={() => handleSubmit('service')} 
                disabled={submitting || !serviceForm.name || serviceForm.base_price <= 0}
              >
                {submitting ? 'Creating service...' : 'Continue'}
              </Button>
            </div>
          </div>
        );

      case 'availability':
        const days = [
          { key: 'monday', label: 'Monday' },
          { key: 'tuesday', label: 'Tuesday' },
          { key: 'wednesday', label: 'Wednesday' },
          { key: 'thursday', label: 'Thursday' },
          { key: 'friday', label: 'Friday' },
          { key: 'saturday', label: 'Saturday' }
        ];

        return (
          <div className="space-y-4">
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-4">
              Set your working hours for each day. You can adjust these later.
            </div>

            {days.map((day) => (
              <div key={day.key} className="flex items-center gap-4">
                <div className="w-20 text-[var(--font-size-sm)] font-medium text-[var(--color-text)]">
                  {day.label}
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="time" 
                    value={availabilityForm[`${day.key}_start` as keyof typeof availabilityForm] as string} 
                    onChange={(e) => setAvailabilityForm({ 
                      ...availabilityForm, 
                      [`${day.key}_start`]: e.target.value 
                    })} 
                    className="w-32"
                  />
                  <span className="text-[var(--color-text-muted)]">to</span>
                  <Input 
                    type="time" 
                    value={availabilityForm[`${day.key}_end` as keyof typeof availabilityForm] as string} 
                    onChange={(e) => setAvailabilityForm({ 
                      ...availabilityForm, 
                      [`${day.key}_end`]: e.target.value 
                    })} 
                    className="w-32"
                  />
                </div>
              </div>
            ))}

            <div className="border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center gap-4">
                <div className="w-20 text-[var(--font-size-sm)] font-medium text-[var(--color-text)]">
                  Sunday
                </div>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={availabilityForm.sunday_closed} 
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, sunday_closed: e.target.checked })} 
                  />
                  <span className="text-[var(--font-size-sm)] text-[var(--color-text)]">Closed</span>
                </label>
              </div>
            </div>

            {error && <div className="text-[var(--color-error)] text-[var(--font-size-sm)]">{error}</div>}
            
            <div className="flex justify-between pt-4">
              <Button intent="ghost" onClick={() => setCurrentStep('service')}>
                Back
              </Button>
              <Button 
                onClick={() => handleSubmit('availability')} 
                disabled={submitting}
              >
                {submitting ? 'Setting availability...' : 'Continue'}
              </Button>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-4">
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-4">
              Customize your brand appearance. This is optional and can be changed later.
            </div>

            <div>
              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                Business Name for Branding
              </label>
              <Input 
                placeholder={businessForm.trading_name || businessForm.legal_name}
                value={brandingForm.logo_text} 
                onChange={(e) => setBrandingForm({ ...brandingForm, logo_text: e.target.value })} 
              />
              <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
                Leave blank to use your business name
              </div>
            </div>

            <div>
              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={brandingForm.primary_color} 
                  onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })} 
                  className="w-12 h-10 rounded-[var(--radius-md)] border border-[var(--color-border)]"
                />
                <Input 
                  value={brandingForm.primary_color} 
                  onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })} 
                  className="flex-1"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            {error && <div className="text-[var(--color-error)] text-[var(--font-size-sm)]">{error}</div>}
            
            <div className="flex justify-between pt-4">
              <Button intent="ghost" onClick={() => setCurrentStep('availability')}>
                Back
              </Button>
              <div className="flex gap-2">
              {/* Remove skip to enforce completion */}
                <Button 
                  onClick={() => handleSubmit('branding')} 
                  disabled={submitting}
                >
                  {submitting ? 'Finishing setup...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          </div>
        );
    }
  }
}


