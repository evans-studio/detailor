import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make successful GET request', async () => {
    const mockResponseData = { message: 'success', data: [1, 2, 3] };
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResponseData),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await api('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', undefined);
    expect(mockResponse.json).toHaveBeenCalled();
    expect(result).toEqual(mockResponseData);
  });

  it('should make POST request with body', async () => {
    const requestBody = { name: 'test', value: 123 };
    const mockResponseData = { id: 1, created: true };
    const mockResponse = {
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue(mockResponseData),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await api('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    expect(result).toEqual(mockResponseData);
  });

  it('should throw error for non-ok response', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: 'Bad request' }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await expect(api('/api/error')).rejects.toThrow('API error: 400');
    expect(mockFetch).toHaveBeenCalledWith('/api/error', undefined);
  });

  it('should throw error for 404 response', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ error: 'Not found' }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await expect(api('/api/notfound')).rejects.toThrow('API error: 404');
  });

  it('should throw error for 500 response', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: 'Internal server error' }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await expect(api('/api/server-error')).rejects.toThrow('API error: 500');
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValue(networkError);

    await expect(api('/api/network-error')).rejects.toThrow('Network error');
  });

  it('should handle JSON parsing errors', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await expect(api('/api/invalid-json')).rejects.toThrow('Invalid JSON');
  });

  it('should work with different HTTP methods', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ method: 'PUT' }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await api('/api/update', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer token123' },
      body: JSON.stringify({ id: 1, name: 'updated' }),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/update', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer token123' },
      body: JSON.stringify({ id: 1, name: 'updated' }),
    });
  });

  it('should handle DELETE requests', async () => {
    const mockResponse = {
      ok: true,
      status: 204,
      json: vi.fn().mockResolvedValue({}),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await api('/api/delete/123', { method: 'DELETE' });

    expect(mockFetch).toHaveBeenCalledWith('/api/delete/123', { method: 'DELETE' });
  });

  it('should preserve query parameters', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: 'filtered' }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await api('/api/search?q=test&page=1&limit=10');

    expect(mockFetch).toHaveBeenCalledWith('/api/search?q=test&page=1&limit=10', undefined);
  });

  it('should work with absolute URLs', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ external: true }),
    };
    mockFetch.mockResolvedValue(mockResponse);

    await api('https://api.example.com/data');

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', undefined);
  });

  it('should handle empty response body', async () => {
    const mockResponse = {
      ok: true,
      status: 204,
      json: vi.fn().mockResolvedValue(null),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await api('/api/empty');

    expect(result).toBeNull();
  });

  it('should work with type parameter', async () => {
    interface TestResponse {
      id: number;
      name: string;
      active: boolean;
    }

    const mockResponseData: TestResponse = {
      id: 1,
      name: 'Test Item',
      active: true,
    };

    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResponseData),
    };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await api<TestResponse>('/api/typed');

    expect(result).toEqual(mockResponseData);
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test Item');
    expect(result.active).toBe(true);
  });
});