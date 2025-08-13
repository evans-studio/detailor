import { vi } from 'vitest';
import { createMockRequest, mockUser, mockProfile } from './mocks';

// Test utilities for common operations

/**
 * Create a mock authenticated request with bearer token
 */
export function createAuthenticatedRequest(options: {
  method?: string;
  body?: any;
  token?: string;
  userId?: string;
} = {}) {
  const { method = 'GET', body, token = 'mock-jwt-token', userId = mockUser.id } = options;
  
  return createMockRequest({
    method,
    body,
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
}

/**
 * Create a mock request with cookie authentication
 */
export function createCookieAuthenticatedRequest(options: {
  method?: string;
  body?: any;
  token?: string;
} = {}) {
  const { method = 'GET', body, token = 'mock-jwt-token' } = options;
  
  return createMockRequest({
    method,
    body,
    headers: {
      'cookie': `sb-access-token=${token}; path=/`,
      'content-type': 'application/json',
    },
  });
}

/**
 * Setup mock for getUserFromRequest function
 */
export function mockGetUserFromRequest(user = mockUser, token = 'mock-jwt-token') {
  return vi.fn().mockResolvedValue({ user, token });
}

/**
 * Setup mock for successful database query
 */
export function mockDatabaseSuccess<T>(data: T) {
  return vi.fn().mockResolvedValue({ data, error: null });
}

/**
 * Setup mock for database error
 */
export function mockDatabaseError(message = 'Database error') {
  const error = new Error(message);
  return vi.fn().mockResolvedValue({ data: null, error });
}

/**
 * Helper to test API route handlers
 */
export async function testRouteHandler(
  handler: (req: Request) => Promise<Response>,
  request: Request
) {
  const response = await handler(request);
  const data = await response.json();
  
  return {
    status: response.status,
    ok: response.ok,
    data,
    response,
  };
}

/**
 * Helper to create mock pricing breakdown
 */
export function createMockPriceBreakdown(options: {
  base?: number;
  vehicleMultiplier?: number;
  addons?: number;
  distanceSurcharge?: number;
  taxRate?: number;
} = {}) {
  const {
    base = 50.00,
    vehicleMultiplier = 1.2,
    addons = 25.00,
    distanceSurcharge = 5.00,
    taxRate = 0.20,
  } = options;
  
  const subtotal = base * vehicleMultiplier + addons + distanceSurcharge;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  
  return {
    base,
    vehicleMultiplier,
    addons,
    distanceSurcharge,
    taxRate,
    tax,
    total,
  };
}

/**
 * Helper to generate UUID for testing
 */
export function generateTestUuid(): string {
  return '12345678-1234-1234-1234-123456789abc';
}

/**
 * Helper to wait for async operations in tests
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Create a mock date for consistent testing
 */
export function createMockDate(dateString = '2024-01-01T10:00:00.000Z'): Date {
  return new Date(dateString);
}