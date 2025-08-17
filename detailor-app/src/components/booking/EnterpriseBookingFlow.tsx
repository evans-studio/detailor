"use client";

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';

// Types
export type BookingStep = 'services' | 'vehicle' | 'datetime' | 'details' | 'payment' | 'confirmation';

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  base_price: number;
  features: string[];
  popular?: boolean;
  premium?: boolean;
  image_url?: string;
}

export interface AddonOption {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'interior' | 'exterior' | 'protection' | 'special';
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  color: string;
  size_tier: 'S' | 'M' | 'L' | 'XL';
  license_plate?: string;
}

export interface BookingData {
  service_id: string;
  addons: string[];
  vehicle: VehicleInfo;
  date: string;
  time: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    postal_code: string;
    special_instructions?: string;
  };
  pricing: {
    subtotal: number;
    tax: number;
    total: number;
  };
}

interface EnterpriseBookingFlowProps {
  currentStep: BookingStep;
  onStepChange: (step: BookingStep) => void;
  services: ServiceOption[];
  addons: AddonOption[];
  bookingData: Partial<BookingData>;
  onDataChange: (data: Partial<BookingData>) => void;
  businessName: string;
  brandColor?: string;
  onComplete: () => void;
  onCheckout?: (mode: 'full' | 'deposit') => void;
}

// Step Navigation Component
function StepIndicator({ 
  currentStep, 
  onStepClick 
}: { 
  currentStep: BookingStep;
  onStepClick: (step: BookingStep) => void;
}) {
  const steps: Array<{ id: BookingStep; title: string; icon: React.ReactNode; description: string }> = [
    {
      id: 'services',
      title: 'Select Service',
      description: 'Choose your detailing package',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'vehicle',
      title: 'Vehicle Info',
      description: 'Tell us about your car',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" />
        </svg>
      ),
    },
    {
      id: 'datetime',
      title: 'Schedule',
      description: 'Pick date and time',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'details',
      title: 'Your Details',
      description: 'Contact and address',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'payment',
      title: 'Payment',
      description: 'Secure checkout',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentIndex;
            const isClickable = index <= currentIndex;

            return (
              <React.Fragment key={step.id}>
                <div 
                  className={`
                    flex flex-col items-center text-center cursor-pointer group
                    ${isClickable ? 'hover:opacity-80' : 'cursor-not-allowed'}
                  `}
                  onClick={() => isClickable && onStepClick(step.id)}
                >
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                    ${isActive 
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' 
                      : isCompleted 
                        ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }
                  `}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="mt-2 hidden sm:block">
                    <div className={`text-[var(--font-size-sm)] font-[var(--font-weight-medium)] ${
                      isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4 
                    ${index < currentIndex 
                      ? 'bg-[var(--color-success)]' 
                      : 'bg-[var(--color-border)]'
                    }
                  `} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Service Selection Step
function ServiceSelectionStep({
  services,
  addons,
  selectedService,
  selectedAddons,
  onServiceSelect,
  onAddonToggle,
}: {
  services: ServiceOption[];
  addons: AddonOption[];
  selectedService?: string;
  selectedAddons: string[];
  onServiceSelect: (serviceId: string) => void;
  onAddonToggle: (addonId: string) => void;
}) {
  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Service Selection */}
      <div>
        <h2 className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text)] mb-2">
          Choose Your Service
        </h2>
        <p className="text-[var(--color-text-muted)] mb-6">
          Select the perfect detailing package for your vehicle
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className={`
                relative cursor-pointer card-hover focus-ring ripple-container
                ${selectedService === service.id 
                  ? 'ring-2 ring-[var(--color-primary)] border-[var(--color-primary)]' 
                  : 'hover:border-[var(--color-primary)]/30'
                }
              `}
              onClick={() => onServiceSelect(service.id)}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary" className="shadow-sm">Most Popular</Badge>
                </div>
              )}
              {service.premium && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="warning" className="shadow-sm">Premium</Badge>
                </div>
              )}
              
              <CardHeader>
                {service.image_url && (
                  <div className="w-full h-32 rounded-[var(--radius-md)] bg-[var(--color-muted)] mb-4 overflow-hidden relative">
                    <Image 
                      src={service.image_url} 
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardTitle className="text-[var(--font-size-lg)]">{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-primary)]">
                      £{service.base_price}
                    </span>
                    <span className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                      ~{service.duration} mins
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {service.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-[var(--font-size-sm)]">
                        <div className="w-4 h-4 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-[var(--color-text)]">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {selectedService === service.id && (
                    <div className="pt-4 border-t border-[var(--color-border)]">
                      <div className="flex items-center gap-2 text-[var(--font-size-sm)] text-[var(--color-success)]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-[var(--font-weight-medium)]">Selected</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add-ons Selection */}
      {selectedServiceData && (
        <div>
          <h3 className="text-[var(--font-size-xl)] font-[var(--font-weight-semibold)] text-[var(--color-text)] mb-2">
            Add Extra Services
          </h3>
          <p className="text-[var(--color-text-muted)] mb-6">
            Enhance your {selectedServiceData.name} with these premium add-ons
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addons.map((addon) => (
              <Card 
                key={addon.id}
                className={`
                  cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-sm)]
                  ${selectedAddons.includes(addon.id) 
                    ? 'ring-2 ring-[var(--color-primary)] border-[var(--color-primary)] bg-[var(--color-primary)]/5' 
                    : 'hover:border-[var(--color-primary)]/30'
                  }
                `}
                onClick={() => onAddonToggle(addon.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                          {addon.name}
                        </h4>
                        <Badge variant="outline" size="sm">
                          {addon.category}
                        </Badge>
                      </div>
                      <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                        {addon.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                        +£{addon.price}
                      </span>
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${selectedAddons.includes(addon.id) 
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                          : 'border-[var(--color-border)]'
                        }
                      `}>
                        {selectedAddons.includes(addon.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Booking Summary Sidebar
function BookingSummary({
  bookingData,
  services,
  addons,
  businessName,
  brandColor,
}: {
  bookingData: Partial<BookingData>;
  services: ServiceOption[];
  addons: AddonOption[];
  businessName: string;
  brandColor?: string;
}) {
  const selectedService = services.find(s => s.id === bookingData.service_id);
  const selectedAddons = addons.filter(a => bookingData.addons?.includes(a.id));
  
  // Prefer server-computed pricing if present in bookingData.pricing
  const computedSubtotal = (selectedService?.base_price || 0) + selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const fallbackTax = computedSubtotal * 0.2;
  const pricing = bookingData.pricing || { subtotal: computedSubtotal, tax: fallbackTax, total: computedSubtotal + fallbackTax };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-[var(--font-weight-semibold)]"
            style={{ backgroundColor: brandColor || 'var(--color-primary)' }}
          >
            {businessName.charAt(0)}
          </div>
          <div>
            <CardTitle className="text-[var(--font-size-lg)]">Booking Summary</CardTitle>
            <CardDescription>{businessName}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Service */}
        {selectedService && (
          <div>
            <h4 className="font-[var(--font-weight-medium)] text-[var(--color-text)] mb-3">Service</h4>
            <div className="flex justify-between">
              <div>
                <div className="font-[var(--font-weight-medium)] text-[var(--color-text)]">
                  {selectedService.name}
                </div>
                <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                  ~{selectedService.duration} minutes
                </div>
              </div>
              <span className="font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                £{selectedService.base_price}
              </span>
            </div>
          </div>
        )}

        {/* Add-ons */}
        {selectedAddons.length > 0 && (
          <div>
            <h4 className="font-[var(--font-weight-medium)] text-[var(--color-text)] mb-3">Add-ons</h4>
            <div className="space-y-2">
              {selectedAddons.map((addon) => (
                <div key={addon.id} className="flex justify-between text-[var(--font-size-sm)]">
                  <span className="text-[var(--color-text)]">{addon.name}</span>
                  <span className="font-[var(--font-weight-medium)] text-[var(--color-text)]">
                    +£{addon.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle & Schedule */}
        {bookingData.vehicle && (
          <div>
            <h4 className="font-[var(--font-weight-medium)] text-[var(--color-text)] mb-3">Vehicle</h4>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text)]">
              {bookingData.vehicle.year} {bookingData.vehicle.make} {bookingData.vehicle.model}
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              {bookingData.vehicle.color} • Size {bookingData.vehicle.size_tier}
            </div>
          </div>
        )}

        {bookingData.date && bookingData.time && (
          <div>
            <h4 className="font-[var(--font-weight-medium)] text-[var(--color-text)] mb-3">Schedule</h4>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text)]">
              {new Date(bookingData.date).toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              {bookingData.time}
            </div>
          </div>
        )}

        {/* Pricing */}
        {selectedService && (
          <div className="border-t border-[var(--color-border)] pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[var(--font-size-sm)]">
                <span className="text-[var(--color-text)]">Subtotal</span>
                <span className="text-[var(--color-text)]">£{pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[var(--font-size-sm)]">
                <span className="text-[var(--color-text)]">VAT</span>
                <span className="text-[var(--color-text)]">£{pricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[var(--font-size-lg)] font-[var(--font-weight-bold)] border-t border-[var(--color-border)] pt-2">
                <span className="text-[var(--color-text)]">Total</span>
                <span className="text-[var(--color-primary)]">£{pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
          <div className="flex items-center gap-2 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
            <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Fully insured & bonded</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
            <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>100% satisfaction guarantee</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
            <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure payment processing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Enterprise Booking Flow Component
export function EnterpriseBookingFlow({
  currentStep,
  onStepChange,
  services,
  addons,
  bookingData,
  onDataChange,
  businessName,
  brandColor,
  onComplete,
  onCheckout,
}: EnterpriseBookingFlowProps) {
  const [payMode, setPayMode] = React.useState<'full' | 'deposit'>('full');
  const [depositPreview, setDepositPreview] = React.useState<number | null>(null);
  const tenantPrefsRef = React.useRef<{ deposit_percent?: number; deposit_min_gbp?: number } | null>(null);

  // Compute deposit preview when total changes
  React.useEffect(() => {
    const total = Number(bookingData.pricing?.total || 0);
    if (!total || total <= 0) { setDepositPreview(null); return; }
    (async () => {
      try {
        if (!tenantPrefsRef.current) {
          const res = await fetch('/api/settings/tenant', { cache: 'no-store' });
          const json = await res.json();
          tenantPrefsRef.current = json?.data?.tenant?.business_prefs || json?.tenant?.business_prefs || {};
        }
        const percent = Number(tenantPrefsRef.current?.deposit_percent ?? 20);
        const minGbp = Number(tenantPrefsRef.current?.deposit_min_gbp ?? 5);
        const totalPence = Math.round(total * 100);
        const calc = Math.max(minGbp * 100, Math.round(totalPence * (percent / 100)));
        setDepositPreview(calc < totalPence ? calc / 100 : null);
      } catch {
        setDepositPreview(null);
      }
    })();
  }, [bookingData.pricing?.total]);
  const handleServiceSelect = (serviceId: string) => {
    onDataChange({ service_id: serviceId });
  };

  const handleAddonToggle = (addonId: string) => {
    const currentAddons = bookingData.addons || [];
    const newAddons = currentAddons.includes(addonId)
      ? currentAddons.filter(id => id !== addonId)
      : [...currentAddons, addonId];
    onDataChange({ addons: newAddons });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-[var(--font-weight-semibold)]"
                style={{ backgroundColor: brandColor || 'var(--color-primary)' }}
              >
                {businessName.charAt(0)}
              </div>
              <span className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                {businessName}
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure Booking</span>
              </div>
              <Button intent="ghost" size="sm">
                Need Help?
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} onStepClick={onStepChange} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {currentStep === 'services' && (
              <ServiceSelectionStep
                services={services}
                addons={addons}
                selectedService={bookingData.service_id}
                selectedAddons={bookingData.addons || []}
                onServiceSelect={handleServiceSelect}
                onAddonToggle={handleAddonToggle}
              />
            )}
            
            {/* Additional steps would be rendered here */}
            {currentStep !== 'services' && (
              <div className="px-6 py-8">
                <Card>
                  <CardContent className="p-8 text-center">
                    <h3 className="text-[var(--font-size-xl)] font-[var(--font-weight-semibold)] text-[var(--color-text)] mb-2">
                      {currentStep === 'vehicle' && 'Vehicle Information'}
                      {currentStep === 'datetime' && 'Schedule Your Service'}
                      {currentStep === 'details' && 'Your Details'}
                      {currentStep === 'payment' && 'Payment & Confirmation'}
                    </h3>
                    {currentStep === 'payment' && (
                      <div className="max-w-md mx-auto text-left mb-6">
                        <div className="text-[var(--font-size-md)] font-[var(--font-weight-medium)] text-[var(--color-text)] mb-3">Payment Options</div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="payopt"
                              checked={payMode === 'full'}
                              onChange={() => setPayMode('full')}
                            />
                            <span className="text-[var(--color-text)]">Pay in full now</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="payopt"
                              checked={payMode === 'deposit'}
                              onChange={() => setPayMode('deposit')}
                              disabled={!depositPreview}
                            />
                            <span className="text-[var(--color-text)]">
                              Pay deposit now{depositPreview ? ` (£${depositPreview.toFixed(2)})` : ''}
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    <p className="text-[var(--color-text-muted)] mb-4">
                      This step would contain the form for {currentStep} information.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button intent="ghost" onClick={() => onStepChange('services')}>
                        Back
                      </Button>
                      <Button 
                        intent="primary" 
                        onClick={() => {
                          const steps: BookingStep[] = ['services', 'vehicle', 'datetime', 'details', 'payment'];
                          const currentIndex = steps.indexOf(currentStep);
                          if (currentIndex < steps.length - 1) {
                            onStepChange(steps[currentIndex + 1]);
                          } else {
                            if (onCheckout) {
                              onCheckout(payMode);
                            } else {
                              onComplete();
                            }
                          }
                        }}
                      >
                        {currentStep === 'payment' ? (payMode === 'deposit' ? 'Pay Deposit' : 'Pay in Full') : 'Continue'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="px-6 lg:px-0">
            <BookingSummary
              bookingData={bookingData}
              services={services}
              addons={addons}
              businessName={businessName}
              brandColor={brandColor}
            />
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet summary */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] lg:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] truncate">Estimated total</div>
            <div className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
              £{(bookingData.pricing?.total ?? 0).toFixed(2)}
            </div>
          </div>
          <Button intent="primary" onClick={() => {
            const steps: BookingStep[] = ['services', 'vehicle', 'datetime', 'details', 'payment'];
            const currentIndex = steps.indexOf(currentStep);
            if (currentIndex < steps.length - 1) {
              onStepChange(steps[currentIndex + 1]);
            } else {
              if (onCheckout) {
                onCheckout(payMode);
              } else {
                onComplete();
              }
            }
          }}>
            {currentStep === 'payment' ? (payMode === 'deposit' ? 'Pay Deposit' : 'Pay in Full') : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}