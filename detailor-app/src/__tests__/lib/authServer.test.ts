import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBearerToken, getUserScopedClient, getUserFromRequest } from '@/lib/authServer';
import { createMockRequest, mockSupabaseClient } from '../setup/mocks';
import { mockUser } from '../setup/mocks';

// Mock the Supabase module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('authServer utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBearerToken', () => {
    it('should extract bearer token from Authorization header', () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer test-token-123',
        },
      });

      const token = getBearerToken(request);
      expect(token).toBe('test-token-123');
    });

    it('should extract bearer token from lowercase authorization header', () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer test-token-456',
        },
      });

      const token = getBearerToken(request);
      expect(token).toBe('test-token-456');
    });

    it('should return null if no authorization header', () => {
      const request = createMockRequest();
      const token = getBearerToken(request);
      expect(token).toBeNull();
    });

    it('should return null if authorization header is malformed', () => {
      let request = createMockRequest({
        headers: {
          'authorization': 'InvalidFormat',
        },
      });
      expect(getBearerToken(request)).toBeNull();

      request = createMockRequest({
        headers: {
          'authorization': 'Bearer',
        },
      });
      expect(getBearerToken(request)).toBeNull();

      request = createMockRequest({
        headers: {
          'authorization': 'Basic dGVzdDp0ZXN0',
        },
      });
      expect(getBearerToken(request)).toBeNull();
    });

    it('should return null for empty bearer token', () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer ',
        },
      });

      const token = getBearerToken(request);
      expect(token).toBeNull();
    });

    it('should handle tokens with spaces or special characters', () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      });

      const token = getBearerToken(request);
      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });
  });

  describe('getUserScopedClient', () => {
    it('should create a client with the provided access token', () => {
      const accessToken = 'test-access-token';
      
      const client = getUserScopedClient(accessToken);
      
      expect(client).toBeDefined();
      // The actual implementation should be tested with integration tests
      // Here we just verify the function doesn't throw
    });

    it('should throw error if environment variables are missing', () => {
      // Mock missing environment variables
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => getUserScopedClient('test-token')).toThrow('Missing Supabase env for user client');
      
      process.env = originalEnv;
    });
  });

  describe('getUserFromRequest', () => {
    beforeEach(() => {
      // Reset environment variables to defaults
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    it('should extract user from request with bearer token', async () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer test-token',
        },
      });

      // Mock successful user retrieval
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getUserFromRequest(request);
      
      expect(result.token).toBe('test-token');
      expect(result.user).toEqual(mockUser);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('test-token');
    });

    it('should extract user from request with cookie token', async () => {
      const request = createMockRequest({
        headers: {
          'cookie': 'sb-access-token=cookie-token; other=value',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getUserFromRequest(request);
      
      expect(result.token).toBe('cookie-token');
      expect(result.user).toEqual(mockUser);
    });

    it('should prefer bearer token over cookie', async () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer bearer-token',
          'cookie': 'sb-access-token=cookie-token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getUserFromRequest(request);
      
      expect(result.token).toBe('bearer-token');
    });

    it('should throw error if no token provided', async () => {
      const request = createMockRequest();

      await expect(getUserFromRequest(request)).rejects.toThrow('Missing Authorization token');
    });

    it('should throw error if token is invalid', async () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer invalid-token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await expect(getUserFromRequest(request)).rejects.toThrow('Invalid or expired token');
    });

    it('should throw error if user data is null', async () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer valid-token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getUserFromRequest(request)).rejects.toThrow('Invalid or expired token');
    });

    it('should throw error if environment variables are missing', async () => {
      const request = createMockRequest({
        headers: {
          'authorization': 'Bearer test-token',
        },
      });

      // Mock missing environment variables
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      await expect(getUserFromRequest(request)).rejects.toThrow('Missing Supabase env');
      
      process.env = originalEnv;
    });

    it('should handle complex cookie parsing', async () => {
      const request = createMockRequest({
        headers: {
          'cookie': 'first=value1; sb-access-token=complex-token-with=equals; last=value2',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getUserFromRequest(request);
      
      expect(result.token).toBe('complex-token-with=equals');
    });

    it('should handle empty cookie values', async () => {
      const request = createMockRequest({
        headers: {
          'cookie': 'sb-access-token=; other=value',
        },
      });

      await expect(getUserFromRequest(request)).rejects.toThrow('Missing Authorization token');
    });
  });
});