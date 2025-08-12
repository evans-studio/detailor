import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  uuidSchema,
  emailSchema,
  phoneSchema,
  dateSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createBookingSchema,
  updateBookingSchema,
  createQuoteSchema,
  createServiceSchema,
  updateServiceSchema,
  createAddonSchema,
  createVehicleSchema,
  createAddressSchema,
  sessionSchema,
  paginationSchema,
  pricingConfigSchema,
  sendMessageSchema,
  fileUploadSchema,
  validateAndSanitize,
  safeValidate,
  patterns,
} from '@/lib/validation';

describe('validation schemas', () => {
  describe('basic schemas', () => {
    describe('uuidSchema', () => {
      it('should validate correct UUIDs', () => {
        const validUuids = [
          '123e4567-e89b-12d3-a456-426614174000',
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        ];

        validUuids.forEach(uuid => {
          expect(() => uuidSchema.parse(uuid)).not.toThrow();
        });
      });

      it('should reject invalid UUIDs', () => {
        const invalidUuids = [
          'not-a-uuid',
          '123e4567-e89b-12d3-a456', // too short
          '123e4567-e89b-12d3-a456-426614174000-extra', // too long
          '',
          null,
          undefined,
        ];

        invalidUuids.forEach(uuid => {
          expect(() => uuidSchema.parse(uuid)).toThrow();
        });
      });
    });

    describe('emailSchema', () => {
      it('should validate correct emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name+tag@domain.co.uk',
          'simple@domain.org',
        ];

        validEmails.forEach(email => {
          expect(() => emailSchema.parse(email)).not.toThrow();
        });
      });

      it('should reject invalid emails', () => {
        const invalidEmails = [
          'not-an-email',
          '@domain.com',
          'user@',
          'user@domain',
          '',
          'user..name@domain.com',
        ];

        invalidEmails.forEach(email => {
          expect(() => emailSchema.parse(email)).toThrow();
        });
      });
    });

    describe('phoneSchema', () => {
      it('should validate correct phone numbers', () => {
        const validPhones = [
          '+1234567890',
          '(123) 456-7890',
          '+44 20 7123 4567',
          '1234567',
        ];

        validPhones.forEach(phone => {
          expect(() => phoneSchema.parse(phone)).not.toThrow();
        });
      });

      it('should reject invalid phone numbers', () => {
        const invalidPhones = [
          '123', // too short
          'call-me-maybe', // letters
          '+1234567890123456789012345', // too long
          '',
        ];

        invalidPhones.forEach(phone => {
          expect(() => phoneSchema.parse(phone)).toThrow();
        });
      });
    });

    describe('dateSchema', () => {
      it('should validate correct ISO dates', () => {
        const validDates = [
          '2024-01-01T10:00:00.000Z',
          '2023-12-25T15:30:00Z',
          new Date().toISOString(),
        ];

        validDates.forEach(date => {
          expect(() => dateSchema.parse(date)).not.toThrow();
        });
      });

      it('should reject invalid dates', () => {
        const invalidDates = [
          '2024-01-01',
          'not-a-date',
          '2024/01/01',
          '',
        ];

        invalidDates.forEach(date => {
          expect(() => dateSchema.parse(date)).toThrow();
        });
      });
    });
  });

  describe('customer schemas', () => {
    describe('createCustomerSchema', () => {
      it('should validate correct customer data', () => {
        const validCustomer = {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        };

        expect(() => createCustomerSchema.parse(validCustomer)).not.toThrow();
      });

      it('should allow optional email and phone', () => {
        const minimalCustomer = {
          name: 'Jane Doe',
        };

        expect(() => createCustomerSchema.parse(minimalCustomer)).not.toThrow();
      });

      it('should reject invalid customer data', () => {
        const invalidCustomers = [
          { name: '' }, // empty name
          { name: 'A'.repeat(101) }, // name too long
          { name: 'John', email: 'invalid-email' },
          { name: 'John', phone: '123' }, // phone too short
          {},
        ];

        invalidCustomers.forEach(customer => {
          expect(() => createCustomerSchema.parse(customer)).toThrow();
        });
      });
    });

    describe('updateCustomerSchema', () => {
      it('should allow partial updates', () => {
        const partialUpdates = [
          { name: 'New Name' },
          { email: 'new@example.com' },
          { phone: '+9876543210' },
          {}, // empty update
        ];

        partialUpdates.forEach(update => {
          expect(() => updateCustomerSchema.parse(update)).not.toThrow();
        });
      });
    });
  });

  describe('booking schemas', () => {
    describe('createBookingSchema', () => {
      it('should validate correct booking data', () => {
        const validBooking = {
          customer_id: '123e4567-e89b-12d3-a456-426614174000',
          vehicle_id: '123e4567-e89b-12d3-a456-426614174001',
          address_id: '123e4567-e89b-12d3-a456-426614174002',
          service_id: '123e4567-e89b-12d3-a456-426614174003',
          addon_ids: ['123e4567-e89b-12d3-a456-426614174004'],
          start_at: '2024-01-01T10:00:00.000Z',
          end_at: '2024-01-01T12:00:00.000Z',
          reference: 'BOOK123',
        };

        expect(() => createBookingSchema.parse(validBooking)).not.toThrow();
      });

      it('should allow optional addon_ids', () => {
        const bookingWithoutAddons = {
          customer_id: '123e4567-e89b-12d3-a456-426614174000',
          vehicle_id: '123e4567-e89b-12d3-a456-426614174001',
          address_id: '123e4567-e89b-12d3-a456-426614174002',
          service_id: '123e4567-e89b-12d3-a456-426614174003',
          start_at: '2024-01-01T10:00:00.000Z',
          end_at: '2024-01-01T12:00:00.000Z',
          reference: 'BOOK123',
        };

        expect(() => createBookingSchema.parse(bookingWithoutAddons)).not.toThrow();
      });

      it('should reject invalid booking data', () => {
        const invalidBookings = [
          { customer_id: 'invalid-uuid' },
          { reference: 'ABC' }, // too short
          { reference: 'A'.repeat(21) }, // too long
          { start_at: 'invalid-date' },
          {},
        ];

        invalidBookings.forEach(booking => {
          expect(() => createBookingSchema.parse(booking)).toThrow();
        });
      });
    });

    describe('updateBookingSchema', () => {
      it('should allow partial booking updates', () => {
        const validUpdates = [
          { start_at: '2024-01-02T10:00:00.000Z' },
          { status: 'confirmed' },
          { status: 'completed' },
          {},
        ];

        validUpdates.forEach(update => {
          expect(() => updateBookingSchema.parse(update)).not.toThrow();
        });
      });

      it('should reject invalid status values', () => {
        const invalidUpdates = [
          { status: 'invalid-status' },
          { status: '' },
          { start_at: 'invalid-date' },
        ];

        invalidUpdates.forEach(update => {
          expect(() => updateBookingSchema.parse(update)).toThrow();
        });
      });
    });
  });

  describe('quote schemas', () => {
    describe('createQuoteSchema', () => {
      it('should validate correct quote data', () => {
        const validQuote = {
          customer_id: '123e4567-e89b-12d3-a456-426614174000',
          service_id: '123e4567-e89b-12d3-a456-426614174001',
          vehicle_size_tier: 'medium',
          distance_miles: 5.5,
          discount_code: 'SAVE10',
        };

        expect(() => createQuoteSchema.parse(validQuote)).not.toThrow();
      });

      it('should reject invalid quote data', () => {
        const invalidQuotes = [
          { customer_id: 'invalid-uuid' },
          { vehicle_size_tier: '' },
          { distance_miles: -1 }, // negative distance
          { distance_miles: 1001 }, // too large
          { discount_code: 'A'.repeat(51) }, // too long
        ];

        invalidQuotes.forEach(quote => {
          expect(() => createQuoteSchema.parse(quote)).toThrow();
        });
      });
    });
  });

  describe('service schemas', () => {
    describe('createServiceSchema', () => {
      it('should validate correct service data', () => {
        const validService = {
          name: 'Full Detail',
          description: 'Complete car detailing service',
          base_price: 50.00,
          duration_minutes: 120,
          is_active: true,
        };

        expect(() => createServiceSchema.parse(validService)).not.toThrow();
      });

      it('should use default values', () => {
        const serviceWithDefaults = {
          name: 'Basic Wash',
          base_price: 25.00,
          duration_minutes: 60,
        };

        const parsed = createServiceSchema.parse(serviceWithDefaults);
        expect(parsed.is_active).toBe(true);
      });

      it('should reject invalid service data', () => {
        const invalidServices = [
          { name: '' }, // empty name
          { name: 'A'.repeat(101) }, // name too long
          { base_price: -1 }, // negative price
          { base_price: 10001 }, // price too high
          { duration_minutes: 10 }, // duration too short
          { duration_minutes: 500 }, // duration too long
          { duration_minutes: 30.5 }, // not integer
        ];

        invalidServices.forEach(service => {
          expect(() => createServiceSchema.parse(service)).toThrow();
        });
      });
    });
  });

  describe('vehicle schemas', () => {
    describe('createVehicleSchema', () => {
      it('should validate correct vehicle data', () => {
        const validVehicle = {
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          color: 'Blue',
          license_plate: 'ABC123',
          size_tier: 'medium',
        };

        expect(() => createVehicleSchema.parse(validVehicle)).not.toThrow();
      });

      it('should allow optional fields', () => {
        const minimalVehicle = {
          make: 'Honda',
          model: 'Civic',
          size_tier: 'small',
        };

        expect(() => createVehicleSchema.parse(minimalVehicle)).not.toThrow();
      });

      it('should reject invalid vehicle data', () => {
        const currentYear = new Date().getFullYear();
        const invalidVehicles = [
          { make: '' }, // empty make
          { model: '' }, // empty model
          { year: 1800 }, // year too early
          { year: currentYear + 5 }, // year too late
          { size_tier: '' }, // empty size tier
          { license_plate: 'A'.repeat(21) }, // license plate too long
        ];

        invalidVehicles.forEach(vehicle => {
          expect(() => createVehicleSchema.parse(vehicle)).toThrow();
        });
      });
    });
  });

  describe('address schemas', () => {
    describe('createAddressSchema', () => {
      it('should validate correct address data', () => {
        const validAddress = {
          line1: '123 Main Street',
          line2: 'Apt 4B',
          city: 'London',
          state: 'England',
          postal_code: 'SW1A 1AA',
          country: 'GB',
        };

        expect(() => createAddressSchema.parse(validAddress)).not.toThrow();
      });

      it('should use default country', () => {
        const addressWithoutCountry = {
          line1: '456 Oak Avenue',
          city: 'Manchester',
          postal_code: 'M1 1AA',
        };

        const parsed = createAddressSchema.parse(addressWithoutCountry);
        expect(parsed.country).toBe('GB');
      });

      it('should reject invalid address data', () => {
        const invalidAddresses = [
          { line1: '' }, // empty line1
          { line1: 'A'.repeat(101) }, // line1 too long
          { city: '' }, // empty city
          { postal_code: 'AB' }, // postal code too short
          { country: 'A' }, // country code too short
          { country: 'ABCD' }, // country code too long
        ];

        invalidAddresses.forEach(address => {
          expect(() => createAddressSchema.parse(address)).toThrow();
        });
      });
    });
  });

  describe('pagination schema', () => {
    it('should validate correct pagination params', () => {
      const validPagination = {
        page: '2',
        limit: '50',
        q: 'search term',
        sort: 'name',
        order: 'asc',
      };

      const parsed = paginationSchema.parse(validPagination);
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(50);
    });

    it('should use default values', () => {
      const emptyPagination = {};
      const parsed = paginationSchema.parse(emptyPagination);
      
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.order).toBe('desc');
    });

    it('should reject invalid pagination params', () => {
      const invalidPaginations = [
        { page: '0' }, // page too small
        { page: '-1' }, // negative page
        { limit: '0' }, // limit too small
        { limit: '101' }, // limit too large
        { q: 'A'.repeat(101) }, // query too long
        { sort: 'invalid_field' }, // invalid sort field
        { order: 'invalid_order' }, // invalid order
      ];

      invalidPaginations.forEach(pagination => {
        expect(() => paginationSchema.parse(pagination)).toThrow();
      });
    });
  });

  describe('pricing config schema', () => {
    it('should validate correct pricing config', () => {
      const validConfig = {
        vehicle_tiers: {
          small: 1.0,
          medium: 1.2,
          large: 1.5,
          xl: 2.0,
        },
        distance_policy: {
          free_radius: 5,
          surcharge_per_mile: 2.50,
        },
        tax: {
          rate: 0.20,
          inclusive: false,
        },
      };

      expect(() => pricingConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('should reject invalid pricing config', () => {
      const invalidConfigs = [
        {
          vehicle_tiers: { small: 0 }, // zero multiplier
          distance_policy: { free_radius: 0, surcharge_per_mile: 0 },
          tax: { rate: 0 },
        },
        {
          vehicle_tiers: { small: -1 }, // negative multiplier
          distance_policy: { free_radius: 0, surcharge_per_mile: 0 },
          tax: { rate: 0 },
        },
        {
          vehicle_tiers: { small: 1 },
          distance_policy: { free_radius: -1, surcharge_per_mile: 0 }, // negative radius
          tax: { rate: 0 },
        },
        {
          vehicle_tiers: { small: 1 },
          distance_policy: { free_radius: 0, surcharge_per_mile: 0 },
          tax: { rate: 1.5 }, // tax rate > 100%
        },
      ];

      invalidConfigs.forEach(config => {
        expect(() => pricingConfigSchema.parse(config)).toThrow();
      });
    });
  });

  describe('file upload schema', () => {
    it('should validate correct file data', () => {
      const validFile = {
        filename: 'document.pdf',
        content_type: 'application/pdf',
        size: 1024 * 1024, // 1MB
      };

      expect(() => fileUploadSchema.parse(validFile)).not.toThrow();
    });

    it('should reject invalid file data', () => {
      const invalidFiles = [
        { filename: '', content_type: 'text/plain', size: 1000 }, // empty filename
        { filename: 'A'.repeat(256), content_type: 'text/plain', size: 1000 }, // filename too long
        { filename: 'test.txt', content_type: '', size: 1000 }, // empty content type
        { filename: 'test.txt', content_type: 'text/plain', size: 0 }, // empty file
        { filename: 'test.txt', content_type: 'text/plain', size: 11 * 1024 * 1024 }, // file too large
      ];

      invalidFiles.forEach(file => {
        expect(() => fileUploadSchema.parse(file)).toThrow();
      });
    });
  });

  describe('validation helpers', () => {
    describe('validateAndSanitize', () => {
      it('should parse valid data', () => {
        const schema = z.object({ name: z.string() });
        const data = { name: 'John' };
        
        const result = validateAndSanitize(schema, data);
        expect(result).toEqual(data);
      });

      it('should throw on invalid data', () => {
        const schema = z.object({ name: z.string() });
        const data = { name: 123 };
        
        expect(() => validateAndSanitize(schema, data)).toThrow();
      });
    });

    describe('safeValidate', () => {
      it('should return success for valid data', () => {
        const schema = z.object({ name: z.string() });
        const data = { name: 'John' };
        
        const result = safeValidate(schema, data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(data);
        }
      });

      it('should return error for invalid data', () => {
        const schema = z.object({ name: z.string() });
        const data = { name: 123 };
        
        const result = safeValidate(schema, data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(z.ZodError);
        }
      });
    });
  });

  describe('patterns', () => {
    it('should match valid UUIDs', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      validUuids.forEach(uuid => {
        expect(patterns.uuid.test(uuid)).toBe(true);
      });
    });

    it('should match valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
      ];

      validEmails.forEach(email => {
        expect(patterns.email.test(email)).toBe(true);
      });
    });

    it('should match valid hex colors', () => {
      const validColors = [
        '#FF0000',
        '#123ABC',
        '#ffffff',
      ];

      validColors.forEach(color => {
        expect(patterns.hexColor.test(color)).toBe(true);
      });
    });
  });
});