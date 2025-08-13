import { beforeEach, vi, expect } from 'vitest';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) < 400,
    })),
    redirect: vi.fn((url) => ({ 
      status: 302, 
      headers: { location: url },
      redirect: true 
    })),
    rewrite: vi.fn((url) => ({ 
      rewrite: true, 
      url 
    })),
    next: vi.fn(() => ({ next: true })),
  },
}));

// Setup environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'detailor.co.uk';
process.env.NEXT_PUBLIC_MARKETING_URL = 'https://detailor.co.uk';
process.env.NEXT_PUBLIC_APP_URL = 'https://admin.detailor.co.uk';
// Use non-secret placeholders for tests; never commit real or pattern-matching keys
process.env.STRIPE_SECRET_KEY = 'test-stripe-secret';
process.env.STRIPE_PUBLISHABLE_KEY = 'test-stripe-publishable';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.RESEND_FROM = 'test@detailor.co.uk';

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Global test types
declare global {
  namespace Vi {
    interface JestAssertion<T> {
      toBeWithinRange(floor: number, ceiling: number): T;
    }
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});