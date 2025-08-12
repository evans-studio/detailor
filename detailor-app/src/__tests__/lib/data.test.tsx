import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchInvoices, fetchCustomers, fetchJobs } from '@/lib/data';

// Mock the api function
vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}));

const mockApi = vi.mocked(await import('@/lib/api')).api;

// Mock window focus events
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener,
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  value: mockRemoveEventListener,
});

describe('data fetching utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Note: Hook tests would require React Testing Library setup
  // For now, we'll focus on testing the fetch functions which are pure functions

  describe('common fetchers', () => {
    describe('fetchInvoices', () => {
      it('should fetch invoices from API', async () => {
        const mockInvoices = [{ id: 1, total: 100 }, { id: 2, total: 200 }];
        mockApi.mockResolvedValue({ ok: true, invoices: mockInvoices });

        const result = await fetchInvoices();

        expect(mockApi).toHaveBeenCalledWith('/api/invoices');
        expect(result).toEqual(mockInvoices);
      });

      it('should handle API errors', async () => {
        mockApi.mockRejectedValue(new Error('API Error'));

        await expect(fetchInvoices()).rejects.toThrow('API Error');
      });
    });

    describe('fetchCustomers', () => {
      it('should fetch customers without query string', async () => {
        const mockCustomers = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
        mockApi.mockResolvedValue({ ok: true, customers: mockCustomers });

        const result = await fetchCustomers();

        expect(mockApi).toHaveBeenCalledWith('/api/customers');
        expect(result).toEqual(mockCustomers);
      });

      it('should fetch customers with query string', async () => {
        const mockCustomers = [{ id: 1, name: 'John' }];
        mockApi.mockResolvedValue({ ok: true, customers: mockCustomers });

        const result = await fetchCustomers('?q=john');

        expect(mockApi).toHaveBeenCalledWith('/api/customers?q=john');
        expect(result).toEqual(mockCustomers);
      });
    });

    describe('fetchJobs', () => {
      it('should fetch jobs without query string', async () => {
        const mockJobs = [{ id: 1, status: 'pending' }, { id: 2, status: 'completed' }];
        mockApi.mockResolvedValue({ ok: true, jobs: mockJobs });

        const result = await fetchJobs();

        expect(mockApi).toHaveBeenCalledWith('/api/jobs');
        expect(result).toEqual(mockJobs);
      });

      it('should fetch jobs with query string', async () => {
        const mockJobs = [{ id: 1, status: 'pending' }];
        mockApi.mockResolvedValue({ ok: true, jobs: mockJobs });

        const result = await fetchJobs('?status=pending');

        expect(mockApi).toHaveBeenCalledWith('/api/jobs?status=pending');
        expect(result).toEqual(mockJobs);
      });
    });
  });
});