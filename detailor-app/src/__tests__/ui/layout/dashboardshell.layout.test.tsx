import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AuthProvider } from '@/lib/BrandProvider';

describe('DashboardShell Layout', () => {
  it('does not shift content via margin-left when toggling sidebar', () => {
    const { container } = render(
      <AuthProvider>
        <DashboardShell role="admin" tenantName="Detailor">
          <div>content</div>
        </DashboardShell>
      </AuthProvider>
    );
    const main = container.querySelector('main');
    expect(main).toBeTruthy();
    const cls = main?.className || '';
    expect(cls.includes('ml-64')).toBe(false);
    expect(cls.includes('ml-16')).toBe(false);
  });
});


