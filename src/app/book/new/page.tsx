"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Combobox } from '@/ui/combobox';
import { getQuote, getSlots, createBooking } from '@/lib/bookingApi';
import { api } from '@/lib/api';
import { useNotifications } from '@/lib/notifications';

type Step = 'vehicle' | 'service' | 'schedule' | 'review';

export default function NewBookingPage() {
  const [step, setStep] = React.useState<Step>('vehicle');
  const [vehicle, setVehicle] = React.useState({ make: '', model: '', year: '', colour: '', size: 'M', vehicle_id: '' });
  const [service, setService] = React.useState<{ service_id: string; addons: string[] }>({ service_id: '', addons: [] });
  const [services, setServices] = React.useState<Array<{ id: string; name: string }>>([]);
  const [location, setLocation] = React.useState({ address_id: '', start: '', end: '' });
  const [quote, setQuote] = React.useState<{ price_breakdown?: { total?: number; distanceSurcharge?: number } } | null>(null);
  const [customerId, setCustomerId] = React.useState<string>('');
  const [vehicles, setVehicles] = React.useState<Array<{ id: string; make: string; model: string; size_tier?: string }>>([]);
  const [addresses, setAddresses] = React.useState<Array<{ id: string; label?: string; address_line1: string; postcode?: string }>>([]);
  const { notify } = useNotifications();

  // Load persisted form state
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('bookingFormState');
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.vehicle) setVehicle(saved.vehicle);
        if (saved.service) setService(saved.service);
        if (saved.location) setLocation(saved.location);
      }
    } catch {}
  }, []);
  React.useEffect(() => {
    const toSave = JSON.stringify({ vehicle, service, location });
    localStorage.setItem('bookingFormState', toSave);
  }, [vehicle, service, location]);

  async function refreshQuote() {
    if (!service.service_id || !customerId) return;
    const q = await getQuote({ customer_id: customerId, service_id: service.service_id, addon_ids: service.addons, vehicle_size_tier: vehicle.size });
    setQuote(q.quote);
  }

  React.useEffect(() => {
    void refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, vehicle.size]);

  React.useEffect(() => {
    (async () => {
      const s = await api<{ ok: boolean; services: Array<{ id: string; name: string }> }>(`/api/services`);
      setServices(s.services);
      // Load current customer (self)
      const list = await api<{ ok: boolean; customers: Array<{ id: string }> }>(`/api/customers`);
      const me = list.customers?.[0];
      if (me?.id) {
        setCustomerId(me.id);
        const vs = await api<{ ok: boolean; vehicles: Array<{ id: string; make: string; model: string; size_tier?: string }> }>(`/api/customers/${me.id}/vehicles`);
        setVehicles(vs.vehicles || []);
        const as = await api<{ ok: boolean; addresses: Array<{ id: string; label?: string; address_line1: string; postcode?: string }> }>(`/api/customers/${me.id}/addresses`);
        setAddresses(as.addresses || []);
      }
    })();
  }, []);

  return (
    <DashboardShell role="customer" tenantName="DetailFlow">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">Book a Service</h1>
        <div className="text-[var(--color-text-muted)]">Step: {step}</div>
      </div>

      {step === 'vehicle' && (
        <div className="grid gap-3 max-w-lg">
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
          <div className="grid gap-1">
            <div className="text-[var(--font-size-sm)]">Service</div>
            <Combobox options={services.map((s) => ({ label: s.name, value: s.id }))} value={service.service_id} onChange={(v) => setService({ ...service, service_id: v })} />
            <div className="text-[var(--color-text-muted)]">Total: £{quote?.price_breakdown?.total ?? 0}</div>
            {quote?.price_breakdown?.distanceSurcharge ? (
              <div className="text-[var(--color-text-muted)]">Surcharge: £{quote?.price_breakdown?.distanceSurcharge}</div>
            ) : null}
          </div>
          <div className="flex justify-between gap-2"><Button intent="ghost" onClick={() => setStep('vehicle')}>Back</Button><Button onClick={() => setStep('schedule')}>Next</Button></div>
        </div>
      )}

      {step === 'schedule' && (
        <ScheduleStep addresses={addresses} selectedAddressId={location.address_id} onBack={() => setStep('service')} onNext={() => setStep('review')} onSet={(s) => setLocation(s)} />
      )}

      {step === 'review' && (
        <div className="grid gap-3 max-w-lg">
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
              const stillAvailable = latest.slots.some((s) => s.start === location.start && s.end === location.end);
              if (!stillAvailable) {
                notify({ title: 'Selected slot is no longer available' });
                setStep('schedule');
                return;
              }
              if (!customerId || !vehicle.vehicle_id || !location.address_id) {
                notify({ title: 'Please select vehicle and address' });
                setStep('vehicle');
                return;
              }
              await createBooking({ customer_id: customerId, vehicle_id: vehicle.vehicle_id, address_id: location.address_id, service_id: service.service_id, addon_ids: service.addons, start_at: location.start, end_at: location.end, reference: `BK-${Date.now()}` });
            }}>Confirm</Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function ScheduleStep({ addresses, selectedAddressId, onBack, onNext, onSet }: { addresses: Array<{ id: string; label?: string; address_line1: string; postcode?: string }>; selectedAddressId?: string; onBack: () => void; onNext: () => void; onSet: (s: { address_id: string; start: string; end: string }) => void }) {
  const [slots, setSlots] = React.useState<Array<{ start: string; end: string; capacity: number }>>([]);
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [addressId, setAddressId] = React.useState(selectedAddressId || (addresses[0]?.id || ''));
  React.useEffect(() => {
    (async () => {
      const s = await getSlots(14);
      setSlots(s.slots);
    })();
  }, []);
  return (
    <div className="grid gap-3 max-w-lg">
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
        {slots.map((s) => (
          <label key={s.start} className="flex items-center gap-2">
            <input type="radio" name="slot" onChange={() => { setStart(s.start); setEnd(s.end); }} />
            <span>{new Date(s.start).toLocaleString()} – {new Date(s.end).toLocaleTimeString()}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between gap-2"><Button intent="ghost" onClick={onBack}>Back</Button><Button onClick={() => { onSet({ address_id: addressId, start, end }); onNext(); }}>Next</Button></div>
    </div>
  );
}


