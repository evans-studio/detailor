"use client";
import * as React from 'react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Combobox } from '@/ui/combobox';
import { getQuote, getSlots, createBooking } from '@/lib/bookingApi';
import { api } from '@/lib/api';
import { useNotifications } from '@/lib/notifications';
import { 
  EnterpriseBookingFlow,
  type BookingStep,
  type ServiceOption,
  type AddonOption,
  type BookingData
} from '@/components/booking/EnterpriseBookingFlow';

type Step = 'vehicle' | 'service' | 'schedule' | 'customer' | 'review' | 'payment';
type CustomerInfo = { name: string; email: string; phone: string; };

export default function NewBookingPage() {
  // Enterprise Booking Flow State
  const [currentStep, setCurrentStep] = React.useState<BookingStep>('services');
  const [bookingData, setBookingData] = React.useState<Partial<BookingData>>({
    addons: [],
    pricing: { subtotal: 0, tax: 0, total: 0 }
  });
  const [enterpriseServices, setEnterpriseServices] = React.useState<ServiceOption[]>([]);
  const [enterpriseAddons, setEnterpriseAddons] = React.useState<AddonOption[]>([]);
  const [loadingAddons, setLoadingAddons] = React.useState(false);
  const [pricing, setPricing] = React.useState<{ subtotal: number; tax: number; total: number } | null>(null);
  const [businessName, setBusinessName] = React.useState('Detailor');
  const [brandColor, setBrandColor] = React.useState('#1a365d');
  
  // Legacy state for compatibility
  const [step, setStep] = React.useState<Step>('vehicle');
  const [vehicle, setVehicle] = React.useState({ make: '', model: '', year: '', colour: '', size: 'M', vehicle_id: '' });
  const [service, setService] = React.useState<{ service_id: string; addons: string[] }>({ service_id: '', addons: [] });
  const [services, setServices] = React.useState<Array<{ id: string; name: string; base_price?: number }>>([]);
  const [location, setLocation] = React.useState({ address_id: '', start: '', end: '' });
  const [quote, setQuote] = React.useState<{ price_breakdown?: { total?: number; distanceSurcharge?: number } } | null>(null);
  const [customerId, setCustomerId] = React.useState<string>('');
  const [customerInfo, setCustomerInfo] = React.useState<CustomerInfo>({ name: '', email: '', phone: '' });
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [vehicles, setVehicles] = React.useState<Array<{ id: string; make: string; model: string; size_tier?: string }>>([]);
  const [addresses, setAddresses] = React.useState<Array<{ id: string; label?: string; address_line1: string; postcode?: string }>>([]);
  const [useEnterpriseFlow, setUseEnterpriseFlow] = React.useState(true);
  const { notify } = useNotifications();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(true);
  const stepHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const [srAnnouncement, setSrAnnouncement] = React.useState('');
  const [showAddVehicle, setShowAddVehicle] = React.useState(false);
  const [newVehicle, setNewVehicle] = React.useState({ make: '', model: '', year: '', colour: '', size: 'M' as 'S' | 'M' | 'L' | 'XL' });
  const [emailConfirm, setEmailConfirm] = React.useState('');
  const [consentMarketing, setConsentMarketing] = React.useState(false);
  const [paymentOption, setPaymentOption] = React.useState<'full' | 'deposit'>('full');

  // Load persisted form state
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('bookingFormState');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.vehicle) setVehicle(saved.vehicle);
        if (saved.service) setService(saved.service);
        if (saved.location) setLocation(saved.location);
        if (saved.step) setStep(saved.step as Step);
      }
    } catch {}
  }, []);
  React.useEffect(() => {
    const toSave = JSON.stringify({ vehicle, service, location, step });
    localStorage.setItem('bookingFormState', toSave);
  }, [vehicle, service, location, step]);

  // Focus management on step change
  React.useEffect(() => {
    try { stepHeadingRef.current?.focus(); } catch {}
    try { setSrAnnouncement(`Moved to ${step} step`); } catch {}
  }, [step]);

  // Unsaved changes warning
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const midFlow = ['vehicle','service','customer','schedule','review'].includes(step);
      if (midFlow && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [step, isSubmitting]);

  async function refreshQuote() {
    if (!service.service_id || !customerId) return;
    try {
      if (isAuthenticated) {
        const q = await getQuote({ customer_id: customerId, service_id: service.service_id, addon_ids: service.addons, vehicle_size_tier: vehicle.size });
        setQuote(q.quote);
      } else {
        // Use guest quote API
        const res = await fetch('/api/guest/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: customerId,
            service_id: service.service_id,
            addon_ids: service.addons,
            vehicle_size_tier: vehicle.size
          })
        });
         const data = await res.json();
         if (res.ok && (data.success ?? true)) setQuote(data.data?.quote || data.quote);
         else notify({ title: 'Failed to fetch quote', description: data?.error?.message || 'Please try again.' });
      }
    } catch (error) {
      console.error('Failed to get quote:', error);
      notify({ title: 'Quote error', description: 'Unable to calculate quote. Check inputs and try again.' });
    }
  }

  React.useEffect(() => {
    void refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, vehicle.size]);

  // Transform services data for enterprise flow
  const transformServicesForEnterprise = (services: Array<{ id: string; name: string; base_price?: number; duration?: number }>) => {
    return services.map(service => ({
      id: service.id,
      name: service.name,
      description: `Professional ${service.name.toLowerCase()} service`,
      duration: service.duration || 120,
      base_price: service.base_price || 50,
      features: [
        'Professional grade products',
        'Experienced technicians',
        'Satisfaction guaranteed',
        'Fully insured service'
      ],
      popular: service.name.toLowerCase().includes('wash'),
      premium: service.name.toLowerCase().includes('detail')
    })) as ServiceOption[];
  };

  // Load add-ons when a service is selected (enterprise flow)
  React.useEffect(() => {
    const svcId = bookingData.service_id || service.service_id;
    (async () => {
      if (!svcId) return;
      try {
        setLoadingAddons(true);
        const tenantId = localStorage.getItem('guestTenantId') || '';
        const url = tenantId ? `/api/add-ons?tenant_id=${tenantId}&service_id=${svcId}` : `/api/add-ons?service_id=${svcId}`;
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        const rows = json.data?.add_ons || json.add_ons || [];
        const mapped: AddonOption[] = rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          price: Number(r.price_delta || 0),
          category: (r.category || 'special') as AddonOption['category'],
        }));
        setEnterpriseAddons(mapped);
        // Recalculate pricing when addons list changes if we have selections
        const selectedAddons = (bookingData.addons || service.addons || []) as string[];
        if (selectedAddons.length || svcId) {
          try {
            const quote = await getQuote({
              customer_id: customerId || '00000000-0000-0000-0000-000000000000',
              service_id: svcId,
              addon_ids: selectedAddons,
              vehicle_size_tier: vehicle.size,
            });
            setPricing(quote.price_breakdown || quote);
            setBookingData(prev => ({ ...prev, pricing: quote.price_breakdown || quote }));
          } catch {}
        }
      } catch (e) {
        notify({ title: 'Failed to load add-ons', description: 'Please try again.' });
      } finally {
        setLoadingAddons(false);
      }
    })();
  }, [bookingData.service_id, service.service_id]);

  const sampleAddons: AddonOption[] = [
    {
      id: 'interior-protection',
      name: 'Interior Protection',
      description: 'Fabric and leather protection treatment',
      price: 25,
      category: 'protection'
    },
    {
      id: 'wax-protection',
      name: 'Premium Wax',
      description: 'Long-lasting paint protection',
      price: 35,
      category: 'exterior'
    },
    {
      id: 'carpet-shampoo',
      name: 'Carpet Deep Clean',
      description: 'Professional carpet and upholstery cleaning',
      price: 20,
      category: 'interior'
    },
    {
      id: 'headlight-restoration',
      name: 'Headlight Restoration',
      description: 'Restore clarity to foggy headlights',
      price: 30,
      category: 'exterior'
    }
  ];

  // Check authentication status and load data accordingly
  React.useEffect(() => {
    (async () => {
      try {
        // Try to load customer data if authenticated
         const listRes = await fetch('/api/customers', { cache: 'no-store' });
         const listJson = await listRes.json();
         const me = (listJson.data || listJson.customers || [])[0];
        if (me?.id) {
          setIsAuthenticated(true);
          setCustomerId(me.id);
          
          // Load services for authenticated users
           const sRes = await fetch(`/api/services?tenant_id=${encodeURIComponent(me.tenant_id || '')}`, { cache: 'no-store' });
           const sJson = await sRes.json();
           const svc = sJson.data?.services || sJson.services || [];
           setServices(svc);
           setEnterpriseServices(transformServicesForEnterprise(svc));
          setEnterpriseAddons([]);
          
           const vsRes = await fetch(`/api/customers/${me.id}/vehicles`, { cache: 'no-store' });
           const vsJson = await vsRes.json();
           setVehicles(vsJson.data || vsJson.vehicles || []);
           const asRes = await fetch(`/api/customers/${me.id}/addresses`, { cache: 'no-store' });
           const asJson = await asRes.json();
           setAddresses(asJson.data || asJson.addresses || []);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Not authenticated - guest user
        setIsAuthenticated(false);
        
        // Get tenant info and load services for guest users
        try {
           const tenantRes = await fetch('/api/guest/tenant');
           const tenantJson = await tenantRes.json();
           const tenantData = tenantJson.data || tenantJson.tenant;
            if (tenantData) {
             const tenantId = tenantData.id;
              const sRes = await fetch(`/api/services?tenant_id=${tenantId}`);
               const s = await sRes.json();
               const svc = s.data?.services || s.services || [];
              setServices(svc);
             setEnterpriseServices(transformServicesForEnterprise(svc));
            setEnterpriseAddons([]);
            
            // Try to get business name and branding
             setBusinessName(tenantData.trading_name || tenantData.legal_name || 'Detailor');
             if (tenantData.brand_settings?.primary_color) {
               setBrandColor(tenantData.brand_settings.primary_color);
            }
            
            // Store tenant ID for later use
            localStorage.setItem('guestTenantId', tenantId);
          }
        } catch (e) {
          console.error('Failed to load guest data:', e);
          notify({ title: 'Failed to load booking options', description: 'Please refresh the page.' });
        }
      }
      setLoadingData(false);
    })();
  }, []);

  // Enterprise booking flow handlers
  const handleStepChange = (step: BookingStep) => {
    setCurrentStep(step);
  };

  const handleDataChange = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
    // When service or addons change, request updated quote
    const nextServiceId = (data as any).service_id ?? bookingData.service_id;
    const nextAddons = (data as any).addons ?? bookingData.addons ?? [];
    if (nextServiceId) {
      (async () => {
        try {
          const quote = await getQuote({
            customer_id: customerId || '00000000-0000-0000-0000-000000000000',
            service_id: nextServiceId as string,
            addon_ids: nextAddons as string[],
            vehicle_size_tier: vehicle.size,
          });
          setPricing(quote.price_breakdown || quote);
          setBookingData(prev => ({ ...prev, pricing: quote.price_breakdown || quote }));
        } catch {}
      })();
    }
  };

  const handleBookingComplete = () => {
    // Handle booking completion
    notify({ title: 'Booking completed successfully!' });
  };

  // Render enterprise flow or legacy flow based on feature flag
  if (useEnterpriseFlow && enterpriseServices.length > 0) {
    return (
      <EnterpriseBookingFlow
        currentStep={currentStep}
        onStepChange={handleStepChange}
        services={enterpriseServices}
        addons={enterpriseAddons}
        bookingData={bookingData}
        onDataChange={handleDataChange}
        businessName={businessName}
        brandColor={brandColor}
        onComplete={handleBookingComplete}
      />
    );
  }

  // Legacy booking flow for fallback
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="sr-only" aria-live="polite">{srAnnouncement}</div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)]">Book a Service</h1>
          <div className="text-[var(--color-text-muted)]">
            Step: {step}
            <Button 
              size="sm" 
              intent="ghost" 
              className="ml-4"
              onClick={() => setUseEnterpriseFlow(true)}
            >
              Try New Experience
            </Button>
          </div>
        </div>

        {loadingData && (
          <div className="space-y-3 animate-pulse" role="status" aria-live="polite">
            <div className="h-6 bg-[var(--color-active-surface)] rounded w-1/3" />
            <div className="h-4 bg-[var(--color-active-surface)] rounded w-1/2" />
            <div className="h-4 bg-[var(--color-active-surface)] rounded w-1/4" />
          </div>
        )}

      {step === 'vehicle' && (
        <div className="grid gap-3 max-w-lg">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="sr-only">Vehicle step</h2>
          <div className="grid gap-1">
            <div className="text-[var(--font-size-sm)]">Vehicle</div>
            {vehicles.length > 0 ? (
              <>
                <Select
                  options={vehicles.map((v) => ({ label: `${v.make} ${v.model}`, value: v.id }))}
                  value={vehicle.vehicle_id || vehicles[0]?.id || ''}
                  onValueChange={(v) => {
                    const found = vehicles.find((x) => x.id === v);
                    setVehicle({ make: found?.make || '', model: found?.model || '', year: '', colour: '', size: (found?.size_tier as string) || 'M', vehicle_id: v });
                  }}
                />
                <div>
                  <Button intent="ghost" size="sm" onClick={() => setShowAddVehicle((s) => !s)}>
                    {showAddVehicle ? 'Cancel' : 'Add new vehicle'}
                  </Button>
                </div>
                {showAddVehicle && (
                  <div className="grid gap-2 border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Make" value={newVehicle.make} onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })} />
                      <Input placeholder="Model" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} />
                      <Input placeholder="Year" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} />
                      <Input placeholder="Colour" value={newVehicle.colour} onChange={(e) => setNewVehicle({ ...newVehicle, colour: e.target.value })} />
                      <Select options={[{label:'S',value:'S'},{label:'M',value:'M'},{label:'L',value:'L'},{label:'XL',value:'XL'}]} value={newVehicle.size} onValueChange={(v) => setNewVehicle({ ...newVehicle, size: v as any })} />
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={async () => {
                        try {
                          if (!customerId) { notify({ title: 'Missing customer' }); return; }
                          const res = await fetch(`/api/customers/${customerId}/vehicles`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ make: newVehicle.make, model: newVehicle.model, year: newVehicle.year ? Number(newVehicle.year) : undefined, colour: newVehicle.colour, size_tier: newVehicle.size }) });
                          const json = await res.json();
                          if (!res.ok || json?.success === false) throw new Error(json?.error?.message || 'Failed');
                          const veh = json.data?.vehicle || json.vehicle || json;
                          setVehicles((prev) => [...prev, veh]);
                          setVehicle({ make: veh.make, model: veh.model, year: String(veh.year || ''), colour: veh.colour || '', size: veh.size_tier || 'M', vehicle_id: veh.id });
                          setShowAddVehicle(false);
                          setSrAnnouncement('Vehicle added');
                        } catch (e) { notify({ title: 'Failed to add vehicle' }); }
                      }}>Save vehicle</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Input placeholder="Make" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} />
                <Input placeholder="Model" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
                <Input placeholder="Year" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} />
                <Input placeholder="Colour" value={vehicle.colour} onChange={(e) => setVehicle({ ...vehicle, colour: e.target.value })} />
                <Select options={[{ label: 'S', value: 'S' }, { label: 'M', value: 'M' }, { label: 'L', value: 'L' }, { label: 'XL', value: 'XL' }]} value={vehicle.size} onValueChange={(v) => setVehicle({ ...vehicle, size: v })} />
              </>
            )}
          </div>
          <div className="flex justify-end gap-2"><Button onClick={() => setStep('service')}>Next</Button></div>
        </div>
      )}

      {step === 'service' && (
        <div className="grid gap-3 max-w-lg">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="sr-only">Service step</h2>
          <div className="grid gap-1">
            <div className="text-[var(--font-size-sm)]">Service</div>
            <Combobox options={services.map((s) => ({ label: s.name, value: s.id }))} value={service.service_id} onChange={(v) => setService({ ...service, service_id: v })} />
            <div className="text-[var(--color-text-muted)]">Total: £{quote?.price_breakdown?.total ?? 0}</div>
            {quote?.price_breakdown?.distanceSurcharge ? (
              <div className="text-[var(--color-text-muted)]">Surcharge: £{quote?.price_breakdown?.distanceSurcharge}</div>
            ) : null}
          </div>
          <div className="flex justify-between gap-2">
            <Button intent="ghost" onClick={() => setStep('vehicle')}>Back</Button>
            <Button onClick={() => setStep(isAuthenticated === false ? 'customer' : 'schedule')}>Next</Button>
          </div>
        </div>
      )}

      {step === 'customer' && (
        <div className="grid gap-3 max-w-lg">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="sr-only">Customer details step</h2>
          <div className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text)]">Your Details</div>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-[var(--font-size-sm)] font-medium text-[var(--color-text)]">Full Name</label>
              <Input 
                placeholder="Enter your full name" 
                value={customerInfo.name} 
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} 
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-[var(--font-size-sm)] font-medium text-[var(--color-text)]">Email Address</label>
              <Input 
                type="email"
                placeholder="Enter your email address" 
                value={customerInfo.email} 
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} 
                required
              />
              <Input 
                className="mt-2"
                type="email"
                placeholder="Confirm your email address" 
                value={emailConfirm} 
                onChange={(e) => setEmailConfirm(e.target.value)} 
                required
              />
              {emailConfirm && emailConfirm !== customerInfo.email && (
                <div className="text-[var(--color-error)] text-[var(--font-size-sm)]">Emails do not match</div>
              )}
            </div>
            <div className="grid gap-1">
              <label className="text-[var(--font-size-sm)] font-medium text-[var(--color-text)]">Phone Number</label>
              <Input 
                type="tel"
                placeholder="Enter your phone number" 
                value={customerInfo.phone} 
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} 
                required
              />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={consentMarketing} onChange={(e) => setConsentMarketing(e.target.checked)} />
              <span className="text-[var(--color-text)] text-[var(--font-size-sm)]">I agree to receive marketing emails</span>
            </label>
          </div>
          <div className="flex justify-between gap-2">
            <Button intent="ghost" onClick={() => setStep('service')}>Back</Button>
            <Button 
              onClick={() => {
                if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
                  notify({ title: 'Please fill in all required fields' });
                  return;
                }
                if (emailConfirm !== customerInfo.email) {
                  notify({ title: 'Please confirm your email address' });
                  return;
                }
                setStep('schedule');
              }}
              disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone || (emailConfirm !== customerInfo.email)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 'schedule' && (
        <>
          <h2 ref={stepHeadingRef} tabIndex={-1} className="sr-only">Schedule step</h2>
          <ScheduleStep addresses={addresses} selectedAddressId={location.address_id} onBack={() => setStep(isAuthenticated === false ? 'customer' : 'service')} onNext={() => setStep('review')} onSet={(s) => setLocation(s)} />
        </>
      )}

      {step === 'review' && (
        <div className="grid gap-3 max-w-lg">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="sr-only">Review step</h2>
          <div>Review your booking:</div>
          <div>Vehicle: {vehicle.make} {vehicle.model} ({vehicle.size})</div>
          <div>Service: {service.service_id}</div>
          <div>Date: {new Date(location.start).toLocaleString()}</div>
          <div>Total: £{quote?.price_breakdown?.total ?? 0}</div>
          <div className="flex justify-between gap-2">
            <Button intent="ghost" onClick={() => setStep('schedule')}>Back</Button>
            <Button onClick={async () => {
              // Validate slot still available
              const latest = await getSlots(14);
              const stillAvailable = latest.slots.some((s: { start: string; end: string }) => s.start === location.start && s.end === location.end);
              if (!stillAvailable) {
                notify({ title: 'Selected slot is no longer available' });
                setStep('schedule');
                return;
              }
              // For guest users, create customer first
              let finalCustomerId = customerId;
              let finalVehicleId = vehicle.vehicle_id;
              let finalAddressId = location.address_id;

              if (isAuthenticated === false) {
                // Create customer, vehicle, and address for guest users
                try {
                  const tenantId = localStorage.getItem('guestTenantId');
                  if (!tenantId) {
                    notify({ title: 'Session expired. Please refresh the page.' });
                    return;
                  }

                  const customerRes = await fetch('/api/guest/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: customerInfo.name,
                      email: customerInfo.email,
                      phone: customerInfo.phone,
                      tenant_id: tenantId
                    })
                  });
                  const customerData = await customerRes.json();
                  if (!customerRes.ok || !customerData.success) throw new Error(customerData?.error?.message || 'Failed to create customer');
                  finalCustomerId = (customerData.data?.customer || customerData.customer).id;

                  // Create vehicle
                  const vehicleRes = await fetch(`/api/guest/customers/${finalCustomerId}/vehicles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      make: vehicle.make,
                      model: vehicle.model,
                      year: vehicle.year,
                      colour: vehicle.colour,
                      size_tier: vehicle.size
                    })
                  });
                  const vehicleData = await vehicleRes.json();
                  if (!vehicleRes.ok || !vehicleData.success) throw new Error(vehicleData?.error?.message || 'Failed to create vehicle');
                  finalVehicleId = (vehicleData.data?.vehicle || vehicleData.vehicle).id;

                  // Create address - for now using a default address since we don't have address input in this flow
                  const addressRes = await fetch(`/api/guest/customers/${finalCustomerId}/addresses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      address_line1: 'To be confirmed',
                      city: 'To be confirmed',
                      postcode: 'TBC'
                    })
                  });
                  const addressData = await addressRes.json();
                  if (!addressRes.ok || !addressData.success) throw new Error(addressData?.error?.message || 'Failed to create address');
                  finalAddressId = (addressData.data?.address || addressData.address).id;
                } catch (error) {
                  notify({ title: `Failed to create customer record: ${(error as Error).message}` });
                  return;
                }
              }

              if (!finalCustomerId || !finalVehicleId || !finalAddressId) {
                notify({ title: 'Please complete all required information' });
                setStep('vehicle');
                return;
              }

              // Store booking data in localStorage for payment completion
              const bookingData = {
                customer_id: finalCustomerId,
                vehicle_id: finalVehicleId, 
                address_id: finalAddressId,
                service_id: service.service_id,
                addon_ids: service.addons,
                start_at: location.start,
                end_at: location.end,
                reference: `BK-${Date.now()}`,
                customer_info: isAuthenticated === false ? customerInfo : null
              };
              localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
              
              // Redirect to payment
              setStep('payment');
            }}>Continue to Payment</Button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="grid gap-4 max-w-lg">
          <h2 ref={stepHeadingRef} tabIndex={-1} className="sr-only">Payment step</h2>
          <div className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text)]">Payment</div>
          
          <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 bg-[var(--color-surface)]">
            <div className="text-[var(--font-size-md)] font-medium text-[var(--color-text)] mb-3">Booking Summary</div>
            <div className="space-y-2 text-[var(--font-size-sm)]">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Vehicle:</span>
                <span className="text-[var(--color-text)]">{vehicle.make} {vehicle.model} ({vehicle.size})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Service:</span>
                <span className="text-[var(--color-text)]">{services.find(s => s.id === service.service_id)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Date & Time:</span>
                <span className="text-[var(--color-text)]">{new Date(location.start).toLocaleString()}</span>
              </div>
              {isAuthenticated === false && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Name:</span>
                    <span className="text-[var(--color-text)]">{customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Email:</span>
                    <span className="text-[var(--color-text)]">{customerInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Phone:</span>
                    <span className="text-[var(--color-text)]">{customerInfo.phone}</span>
                  </div>
                </>
              )}
              <div className="border-t border-[var(--color-border)] pt-2 mt-3">
                <div className="flex justify-between font-semibold">
                  <span className="text-[var(--color-text)]">Total:</span>
                  <span className="text-[var(--color-text)]">£{(pricing?.total ?? quote?.price_breakdown?.total ?? 0).toFixed(2)}</span>
                </div>
                {pricing && (
                  <div className="mt-2 space-y-1 text-[var(--font-size-sm)]">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Subtotal</span>
                      <span className="text-[var(--color-text)]">£{pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">VAT</span>
                      <span className="text-[var(--color-text)]">£{pricing.tax.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 bg-[var(--color-surface)]">
            <div className="text-[var(--font-size-md)] font-medium text-[var(--color-text)] mb-3">Payment Options</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="payopt" checked={paymentOption==='full'} onChange={() => setPaymentOption('full')} />
                <span className="text-[var(--color-text)]">Pay in full now</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="payopt" checked={paymentOption==='deposit'} onChange={() => setPaymentOption('deposit')} />
                <span className="text-[var(--color-text)]">Pay deposit now</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <Button intent="ghost" onClick={() => setStep('review')}>Back</Button>
            <Button 
              intent="primary"
              onClick={async () => {
                try {
                  setIsSubmitting(true);
                  // Create Stripe checkout session for booking payment
                  let depositOverride: number | undefined = undefined;
                  if (paymentOption === 'deposit') {
                    try {
                      const t = await fetch('/api/settings/tenant');
                      const tj = await t.json();
                      const prefs = tj?.data?.tenant?.business_prefs || tj?.tenant?.business_prefs || {};
                      const totalPence = Math.round((pricing?.total ?? quote?.price_breakdown?.total ?? 0) * 100);
                      const percent = Number(prefs.deposit_percent ?? 20);
                      const minGbp = Number(prefs.deposit_min_gbp ?? 5);
                      const deposit = Math.max(minGbp * 100, Math.round(totalPence * (percent / 100)));
                      depositOverride = deposit;
                    } catch {}
                  }

                  const checkoutRes = await fetch('/api/payments/checkout-booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount: Math.round((pricing?.total ?? quote?.price_breakdown?.total ?? 0) * 100), // pence
                      deposit_amount: depositOverride,
                      currency: 'gbp',
                      customer_email: isAuthenticated === false ? customerInfo.email : undefined,
                      booking_reference: `BK-${Date.now()}`,
                      return_url: `${window.location.origin}/bookings/confirmation`
                    })
                  });
                  
                  const checkoutData = await checkoutRes.json();
                  
                  if (checkoutData.url) {
                    // Redirect to Stripe checkout
                    window.location.href = checkoutData.url;
                  } else {
                    notify({ title: 'Payment setup failed. Please try again.' });
                  }
                } catch (error) {
                  notify({ title: 'Payment setup failed. Please try again.' });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              Pay £{quote?.price_breakdown?.total ?? 0}
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function ScheduleStep({ addresses, selectedAddressId, onBack, onNext, onSet }: { addresses: Array<{ id: string; label?: string; address_line1: string; postcode?: string }>; selectedAddressId?: string; onBack: () => void; onNext: () => void; onSet: (s: { address_id: string; start: string; end: string }) => void }) {
  const [slots, setSlots] = React.useState<Array<{ start: string; end: string; capacity: number }>>([]);
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [addressId, setAddressId] = React.useState(selectedAddressId || (addresses[0]?.id || ''));
  const [sr, setSr] = React.useState('');
  React.useEffect(() => {
    (async () => {
      try {
        // Try authenticated API first
        const s = await getSlots(14);
        setSlots(s.slots);
      } catch (error) {
        // Fall back to guest API
        try {
          const tenantId = localStorage.getItem('guestTenantId');
          if (tenantId) {
            const res = await fetch(`/api/guest/availability/slots?tenant_id=${tenantId}&days=14`);
            const data = await res.json();
            if (data.ok) setSlots(data.slots);
          }
        } catch (e) {
          console.error('Failed to load slots:', e);
        }
      }
    })();
  }, []);
  return (
    <div className="grid gap-3 max-w-lg">
      <div aria-live="polite" className="sr-only">{sr}</div>
      <div className="grid gap-1">
        <div className="text-[var(--font-size-sm)]">Service Address</div>
        <Select
          options={addresses.map((a) => ({ label: `${a.label || a.address_line1}${a.postcode ? `, ${a.postcode}` : ''}`, value: a.id }))}
          value={addressId}
          onValueChange={(v) => setAddressId(v)}
        />
      </div>
      <div className="text-[var(--font-size-sm)]">Choose a slot</div>
      <div className="grid gap-2 max-h-64 overflow-auto">
        {slots.map((s) => {
          const disabled = (s.capacity ?? 0) <= 0;
          return (
            <label key={s.start} className="flex items-center gap-2 opacity-100">
              <input type="radio" name="slot" disabled={disabled} onChange={() => { setStart(s.start); setEnd(s.end); setSr('Slot selected'); }} />
              <span className={disabled ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}>
                {new Date(s.start).toLocaleString()} – {new Date(s.end).toLocaleTimeString()} {disabled ? '(Unavailable)' : `(Cap: ${s.capacity})`}
              </span>
            </label>
          );
        })}
      </div>
      <div className="flex justify-between gap-2"><Button intent="ghost" onClick={onBack}>Back</Button><Button onClick={() => { onSet({ address_id: addressId, start, end }); onNext(); }}>Next</Button></div>
    </div>
  );
}


