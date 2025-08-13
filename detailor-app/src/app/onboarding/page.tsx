"use client";
import * as React from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Select } from '@/ui/select';
import { useNotifications } from '@/lib/notifications';
import { z } from 'zod';

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

  // Service Info (System Bible compliant types)
  const [serviceForm, setServiceForm] = React.useState({
    name: '',
    description: '',
    category: '',
    base_price: 50, // pounds
    base_duration_min: 60, // minutes
  });

  const serviceSchema = z.object({
    name: z.string().min(1, 'Service name required'),
    description: z.string().optional(),
    category: z.string().optional(),
    base_price: z.coerce.number().min(0, 'Price cannot be negative').multipleOf(0.01, 'Price must be a valid amount'),
    base_duration_min: z.coerce.number().int('Duration must be whole minutes').min(15, 'Minimum is 15 minutes').multipleOf(15, 'Use 15-minute increments'),
  });

  // Availability Info - Updated to match API structure
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
    slot_duration_min: 60, // Added missing required field
    capacity: 1 // Renamed from capacity_per_slot to match API
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
          // Validate and create first service (System Bible compliant)
          const validated = serviceSchema.parse(serviceForm);
          
          // First check if services already exist to avoid duplicates during repeated onboarding attempts
          try {
            const existingServicesRes = await fetch('/api/admin/services');
            const existingServicesData = await existingServicesRes.json();
            
            if (existingServicesData.ok && existingServicesData.services?.length > 0) {
              // Services already exist, skip creation and move to next step
              setHasService(true);
              setCurrentStep('availability');
              notify({ title: 'Services already configured, continuing setup...' });
              break;
            }
          } catch (e) {
            // If checking existing services fails, continue with creation attempt
            console.warn('Could not check existing services:', e);
          }
          
          const serviceRes = await fetch('/api/admin/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: validated.name,
              description: validated.description,
              category: validated.category,
              base_price: validated.base_price,
              base_duration_min: validated.base_duration_min,
              visible: true,
            }),
          });
          const serviceData = await serviceRes.json();
          if (!serviceData.ok) {
            // Handle specific duplicate key constraint error with actionable message
            if (serviceData.error?.includes('duplicate key value') || 
                serviceData.error?.includes('already exists') ||
                serviceData.error?.includes('services_tenant_id_name_key')) {
              throw new Error(`A service named "${validated.name}" already exists. Please try a different name or continue to the next step if you already have services configured.`);
            }
            throw new Error(serviceData.error);
          }
          setHasService(true);
          setCurrentStep('availability');
          break;

        case 'availability':
          // Validate required fields first
          if (!availabilityForm.slot_duration_min || availabilityForm.slot_duration_min < 15) {
            throw new Error('Please select an appointment duration of at least 15 minutes');
          }
          
          if (!availabilityForm.capacity || availabilityForm.capacity < 1) {
            throw new Error('Please set booking capacity to at least 1');
          }
          
          // Set up basic availability - Convert form data to API structure
          const workPatterns = [
            { weekday: 1, start_time: availabilityForm.monday_start, end_time: availabilityForm.monday_end, slot_duration_min: availabilityForm.slot_duration_min, capacity: availabilityForm.capacity },
            { weekday: 2, start_time: availabilityForm.tuesday_start, end_time: availabilityForm.tuesday_end, slot_duration_min: availabilityForm.slot_duration_min, capacity: availabilityForm.capacity },
            { weekday: 3, start_time: availabilityForm.wednesday_start, end_time: availabilityForm.wednesday_end, slot_duration_min: availabilityForm.slot_duration_min, capacity: availabilityForm.capacity },
            { weekday: 4, start_time: availabilityForm.thursday_start, end_time: availabilityForm.thursday_end, slot_duration_min: availabilityForm.slot_duration_min, capacity: availabilityForm.capacity },
            { weekday: 5, start_time: availabilityForm.friday_start, end_time: availabilityForm.friday_end, slot_duration_min: availabilityForm.slot_duration_min, capacity: availabilityForm.capacity },
            { weekday: 6, start_time: availabilityForm.saturday_start, end_time: availabilityForm.saturday_end, slot_duration_min: availabilityForm.slot_duration_min, capacity: availabilityForm.capacity }
          ];
          
          // Validate that at least one day has valid working hours
          const validPatterns = workPatterns.filter(p => 
            p.start_time && 
            p.end_time && 
            p.start_time < p.end_time &&
            p.start_time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) &&
            p.end_time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          );
          
          if (validPatterns.length === 0) {
            throw new Error('Please set at least one working day with valid hours (start time must be before end time)');
          }
          
          // Send each work pattern individually (API expects individual objects)
          let allPatternsCreated = true;
          let lastError = null;
          let patternsCreatedCount = 0;
          
          for (const pattern of validPatterns) {
            try {
              const patternRes = await fetch('/api/admin/availability/work-patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pattern)
              });
              const patternData = await patternRes.json();
              if (!patternData.ok) {
                lastError = patternData.error;
                allPatternsCreated = false;
                break;
              }
              patternsCreatedCount++;
            } catch (e) {
              lastError = (e as Error).message;
              allPatternsCreated = false;
              break;
            }
          }
          
          if (!allPatternsCreated && lastError) {
            throw new Error(`Failed to set working hours: ${lastError}`);
          }
          
          if (patternsCreatedCount === 0) {
            throw new Error('No working hours were saved. Please check your time settings and try again.');
          }
          
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
                  Price (£)
                  <span className="ml-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">Enter amount without currency symbol</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={serviceForm.base_price}
                  onChange={(e) => setServiceForm({ ...serviceForm, base_price: e.target.value === '' ? 0 : Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                  Duration (minutes)
                  <span className="ml-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">In 15-minute increments (60, 75, 90, ...)</span>
                </label>
                <Input
                  type="number"
                  step="15"
                  min="15"
                  placeholder="60"
                  value={serviceForm.base_duration_min}
                  onChange={(e) => setServiceForm({ ...serviceForm, base_duration_min: e.target.value === '' ? 15 : Math.max(0, Number(e.target.value)) })}
                  required
                />
              </div>
            </div>

            {error && <div className="text-[var(--color-error)] text-[var(--font-size-sm)]">{error}</div>}
            
            <div className="flex justify-between pt-4">
              <Button intent="ghost" onClick={() => setCurrentStep('business')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  intent="ghost"
                  onClick={() => {
                    setHasService(true);
                    setCurrentStep('availability');
                    notify({ title: 'Service step skipped - you can add services later from the admin panel' });
                  }}
                  disabled={submitting}
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={() => handleSubmit('service')}
                  disabled={
                    submitting ||
                    !serviceForm.name ||
                    serviceForm.base_price < 0 ||
                    serviceForm.base_duration_min < 15 ||
                    serviceForm.base_duration_min % 15 !== 0
                  }
                >
                  {submitting ? 'Creating service...' : 'Continue'}
                </Button>
              </div>
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

            {/* Booking Settings */}
            <div className="border-t border-[var(--color-border)] pt-4 space-y-4">
              <div className="text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-3">
                Booking Settings
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                    Appointment Duration (minutes) *
                  </label>
                  <Select
                    options={[
                      { label: '15 minutes', value: '15' },
                      { label: '30 minutes', value: '30' },
                      { label: '45 minutes', value: '45' },
                      { label: '1 hour', value: '60' },
                      { label: '1 hour 30 min', value: '90' },
                      { label: '2 hours', value: '120' }
                    ]}
                    value={availabilityForm.slot_duration_min.toString()}
                    onValueChange={(value) => setAvailabilityForm({ ...availabilityForm, slot_duration_min: Number(value) })}
                  />
                  <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
                    How long each appointment slot should be
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text)] mb-1">
                    Concurrent Bookings *
                  </label>
                  <Select
                    options={[
                      { label: '1 booking at a time', value: '1' },
                      { label: '2 bookings at once', value: '2' },
                      { label: '3 bookings at once', value: '3' },
                      { label: '4 bookings at once', value: '4' },
                      { label: '5 bookings at once', value: '5' }
                    ]}
                    value={availabilityForm.capacity.toString()}
                    onValueChange={(value) => setAvailabilityForm({ ...availabilityForm, capacity: Number(value) })}
                  />
                  <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
                    How many jobs you can handle simultaneously
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="text-[var(--color-error)] text-[var(--font-size-sm)]">{error}</div>}
            
            <div className="flex justify-between pt-4">
              <Button intent="ghost" onClick={() => setCurrentStep('service')}>
                Back
              </Button>
              <Button 
                onClick={() => handleSubmit('availability')} 
                disabled={
                  submitting || 
                  !availabilityForm.slot_duration_min || 
                  !availabilityForm.capacity ||
                  availabilityForm.slot_duration_min < 15 ||
                  availabilityForm.capacity < 1
                }
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


