import { describe, it, expect } from 'vitest';
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-response';

describe('api-response helpers (System Bible envelope)', () => {
  it('creates success response with data and timestamp', async () => {
    const resp = createSuccessResponse({ ok: true });
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ ok: true });
    expect(typeof json.meta.timestamp).toBe('string');
  });

  it('supports custom meta including nested pagination object', async () => {
    const resp = createSuccessResponse({ items: [1, 2, 3] }, {
      pagination: { page: 2, pageSize: 25, total: 100 },
    });
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.data.items).toEqual([1, 2, 3]);
    expect(json.meta.pagination).toEqual({ page: 2, pageSize: 25, total: 100 });
  });

  it('creates error response with code, message, details and status', async () => {
    const resp = createErrorResponse('UNAUTHORIZED', 'Unauthorized', { hint: 'Missing token' }, 401);
    expect(resp.status).toBe(401);
    const json = await resp.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
    expect(json.error.message).toBe('Unauthorized');
    expect(json.error.details).toEqual({ hint: 'Missing token' });
    expect(typeof json.meta.timestamp).toBe('string');
  });

  it('createPaginatedResponse places pagination at meta root (legacy helper)', async () => {
    const resp = createPaginatedResponse([1, 2], 3, 42);
    expect(resp.status).toBe(200);
    const json = await resp.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([1, 2]);
    expect(json.meta.page).toBe(3);
    expect(json.meta.total).toBe(42);
  });
});


