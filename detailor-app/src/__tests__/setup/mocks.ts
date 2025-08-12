import { vi } from 'vitest';

// Mock Supabase types
export interface MockUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export interface MockProfile {
  id: string;
  tenant_id: string;
  role: 'customer' | 'staff' | 'admin';
  email?: string;
}

export interface MockSupabaseResponse<T = any> {
  data: T;
  error: Error | null;
}

// Mock Supabase admin client
export function createMockSupabaseAdmin() {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  };
}

// Mock Supabase client
export function createMockSupabaseClient() {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      getSession: vi.fn(),
    },
  };
}

// Mock Next.js Request
export function createMockRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  url?: string;
} = {}) {
  const { method = 'GET', headers = {}, body, url = 'http://localhost:3000' } = options;
  
  return {
    method,
    headers: {
      get: vi.fn((name: string) => headers[name.toLowerCase()] || null),
    },
    json: vi.fn().mockResolvedValue(body || {}),
    text: vi.fn().mockResolvedValue(JSON.stringify(body || {})),
    url,
  } as unknown as Request;
}

// Test data fixtures
export const mockUser: MockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  user_metadata: {},
};

export const mockProfile: MockProfile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  tenant_id: '456e7890-e89b-12d3-a456-426614174000',
  role: 'admin',
  email: 'test@example.com',
};

export const mockService = {
  id: '789e1234-e89b-12d3-a456-426614174000',
  tenant_id: '456e7890-e89b-12d3-a456-426614174000',
  name: 'Full Detail',
  description: 'Complete car detailing service',
  base_price: 50.00,
  duration_minutes: 120,
  is_active: true,
};

export const mockAddon = {
  id: 'abc1234e-e89b-12d3-a456-426614174000',
  tenant_id: '456e7890-e89b-12d3-a456-426614174000',
  name: 'Interior Clean',
  description: 'Deep interior cleaning',
  price_delta: 25.00,
  is_active: true,
};

export const mockPricingConfig = {
  id: 'def5678e-e89b-12d3-a456-426614174000',
  tenant_id: '456e7890-e89b-12d3-a456-426614174000',
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
    rate: 0.20, // 20% tax
    inclusive: false,
  },
};

export const mockCustomer = {
  id: 'ghi9012e-e89b-12d3-a456-426614174000',
  tenant_id: '456e7890-e89b-12d3-a456-426614174000',
  email: 'customer@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890',
};

// Mock functions for common operations
export const mockSupabaseAdmin = createMockSupabaseAdmin();
export const mockSupabaseClient = createMockSupabaseClient();

// Vi mocks for modules
vi.mock('@/lib/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabaseAdmin),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));