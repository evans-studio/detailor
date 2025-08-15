import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrandProvider } from '@/lib/BrandProvider';

describe('BrandProvider', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/brand')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: { palette: { brand: { primary: '#3B82F6' } } } }),
            { status: 200 }
          )
        );
      }
      if (url.includes('/api/tenant/me')) {
        return Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 401 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('applies brand variables and updates on brand-updated event', async () => {
    render(
      <BrandProvider>
        <div>child</div>
      </BrandProvider>
    );
    // Allow effect to run
    await new Promise((r) => setTimeout(r, 0));
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#3B82F6');

    // Next two calls: /api/tenant/me (401) then /api/brand (new color)
    fetchMock
      .mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify({ success: false }), { status: 401 })))
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({ success: true, data: { palette: { brand: { primary: '#EF4444' } } } }),
            { status: 200 }
          )
        )
      );
    window.dispatchEvent(new Event('brand-updated'));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#EF4444');
  });
});


