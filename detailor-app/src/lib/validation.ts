import { z } from 'zod';

// Common validation patterns
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const phoneSchema = z.string().regex(/^[\d\s\+\-\(\)]{7,20}$/, 'Invalid phone number format');
export const dateSchema = z.string().datetime();

// Customer schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Booking schemas
export const createBookingSchema = z.object({
  customer_id: uuidSchema,
  vehicle_id: uuidSchema,
  address_id: uuidSchema,
  service_id: uuidSchema,
  addon_ids: z.array(uuidSchema).optional(),
  start_at: dateSchema,
  end_at: dateSchema,
  reference: z.string().min(4, 'Reference must be at least 4 characters').max(20, 'Reference too long'),
});

export const updateBookingSchema = z.object({
  start_at: dateSchema.optional(),
  end_at: dateSchema.optional(),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
});

// Quote schemas
export const createQuoteSchema = z.object({
  customer_id: uuidSchema,
  service_id: uuidSchema,
  addon_ids: z.array(uuidSchema).optional(),
  vehicle_size_tier: z.string().min(1, 'Vehicle size tier is required'),
  scheduled_at: dateSchema.optional(),
  distance_miles: z.number().min(0, 'Distance cannot be negative').max(1000, 'Distance too large').optional(),
  discount_code: z.string().max(50, 'Discount code too long').optional(),
});

// Service schemas
export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Service name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  base_price: z.number().min(0, 'Price cannot be negative').max(10000, 'Price too high'),
  duration_minutes: z.number().int().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration too long'),
  is_active: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

// Add-on schemas
export const createAddonSchema = z.object({
  name: z.string().min(1, 'Add-on name is required').max(100, 'Add-on name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price_delta: z.number().min(-1000, 'Price delta too low').max(1000, 'Price delta too high'),
  is_active: z.boolean().default(true),
});

export const updateAddonSchema = createAddonSchema.partial();

// Vehicle schemas
export const createVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required').max(50, 'Make too long'),
  model: z.string().min(1, 'Model is required').max(50, 'Model too long'),
  year: z.number().int().min(1900, 'Year too early').max(new Date().getFullYear() + 2, 'Year too late').optional(),
  color: z.string().max(30, 'Color description too long').optional(),
  license_plate: z.string().max(20, 'License plate too long').optional(),
  size_tier: z.string().min(1, 'Size tier is required'),
});

export const updateVehicleSchema = createVehicleSchema.partial();

// Address schemas
export const createAddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').max(100, 'Address line 1 too long'),
  line2: z.string().max(100, 'Address line 2 too long').optional(),
  city: z.string().min(1, 'City is required').max(50, 'City name too long'),
  state: z.string().max(50, 'State name too long').optional(),
  postal_code: z.string().min(3, 'Postal code too short').max(20, 'Postal code too long'),
  country: z.string().min(2, 'Country code required').max(3, 'Country code too long').default('GB'),
});

export const updateAddressSchema = createAddressSchema.partial();

// Authentication schemas
export const sessionSchema = z.object({
  access_token: z.string().min(10, 'Access token too short'),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit too high').default(20),
  q: z.string().max(100, 'Search query too long').optional(),
  sort: z.enum(['created_at', 'updated_at', 'name']).default('created_at').optional(),
  order: z.enum(['asc', 'desc']).default('desc').optional(),
});

// Pricing schemas
export const pricingConfigSchema = z.object({
  vehicle_tiers: z.record(z.string(), z.number().positive('Multiplier must be positive')),
  distance_policy: z.object({
    free_radius: z.number().min(0, 'Free radius cannot be negative'),
    surcharge_per_mile: z.number().min(0, 'Surcharge cannot be negative'),
  }),
  tax: z.object({
    rate: z.number().min(0, 'Tax rate cannot be negative').max(1, 'Tax rate cannot exceed 100%'),
    inclusive: z.boolean().default(false),
  }),
});

// Message schemas
export const sendMessageSchema = z.object({
  recipient_type: z.enum(['customer', 'staff', 'admin']),
  recipient_ids: z.array(uuidSchema).min(1, 'At least one recipient required'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  body: z.string().min(1, 'Message body is required').max(5000, 'Message too long'),
  template_id: uuidSchema.optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  content_type: z.string().min(1, 'Content type is required'),
  size: z.number().int().min(1, 'File cannot be empty').max(10 * 1024 * 1024, 'File too large (max 10MB)'),
});

// Error response schema for testing
export const errorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  hint: z.string().optional(),
});

// Success response schema for testing
export const successResponseSchema = z.object({
  ok: z.literal(true),
});

// Generic list response schema
export const listResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => 
  z.object({
    ok: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }).optional(),
  });

// Generic item response schema
export const itemResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: itemSchema,
  });

// Validation helper functions
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result;
}

// Common validation patterns
export const patterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\+\-\(\)]{7,20}$/,
  url: /^https?:\/\/.+/,
  hexColor: /^#[0-9a-f]{6}$/i,
} as const;