import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderWithProviders } from '@/__tests__/setup/render';
import { EnterpriseBookingFlow, type BookingData, type ServiceOption, type AddonOption } from '@/components/booking/EnterpriseBookingFlow';

describe('EnterpriseBookingFlow payment step - deposit preview', () => {
  const services: ServiceOption[] = [
    { id: 'svc1', name: 'Deluxe Wash', description: 'desc', duration: 60, base_price: 100, features: [] },
  ];
  const addons: AddonOption[] = [];

  const bookingData: Partial<BookingData> = {
    service_id: 'svc1',
    addons: [],
    pricing: { subtotal: 100, tax: 20, total: 120 },
  };

  const businessName = 'Detailor Test';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/api/settings/tenant')) {
        return {
          json: async () => ({ data: { tenant: { business_prefs: { deposit_percent: 25, deposit_min_gbp: 5 } } } }),
        } as any;
      }
      return { json: async () => ({}) } as any;
    }));
  });

  afterEach(() => {
    (global.fetch as any).mockRestore?.();
    vi.unstubAllGlobals();
  });

  it('shows deposit amount and enables deposit option when less than total', async () => {
    const { findByText, getByLabelText } = renderWithProviders(
      <EnterpriseBookingFlow
        currentStep="payment"
        onStepChange={() => {}}
        services={services}
        addons={addons}
        bookingData={bookingData}
        onDataChange={() => {}}
        businessName={businessName}
        onComplete={() => {}}
      />
    );

    // Deposit is max(min, percent) => max(£5, 25% of £120 = £30) => £30
    await findByText(/Pay deposit now \(£30.00\)/);
    const radio = getByLabelText(/Pay deposit now/i) as HTMLInputElement;
    expect(radio.disabled).toBe(false);
  });
});


