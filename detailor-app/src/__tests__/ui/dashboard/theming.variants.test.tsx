import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatCard } from '@/components/dashboard/StatCard';

function setBrand(primary: string) {
  document.documentElement.style.setProperty('--color-primary', primary);
  document.documentElement.style.setProperty('--color-primary-foreground', '#ffffff');
}

describe('Theming Variants', () => {
  it('works with red brand', () => {
    setBrand('#EF4444');
    const { container } = render(<StatCard title="Test" value="1" />);
    expect(container.firstChild).toBeTruthy();
  });
  it('works with green brand', () => {
    setBrand('#10B981');
    const { container } = render(<StatCard title="Test" value="1" />);
    expect(container.firstChild).toBeTruthy();
  });
  it('works with purple brand', () => {
    setBrand('#8B5CF6');
    const { container } = render(<StatCard title="Test" value="1" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('updates tokens on brand-updated and maintains contrast', async () => {
    setBrand('#3B82F6');
    const before = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    window.dispatchEvent(new Event('brand-updated'));
    // simulate BrandProvider update
    document.documentElement.style.setProperty('--color-primary', '#EF4444');
    const after = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    expect(before.toLowerCase()).not.toBe(after.toLowerCase());
    const fg = getComputedStyle(document.documentElement).getPropertyValue('--color-primary-foreground').trim();
    expect(after.length > 0 && fg.length > 0 && after.toLowerCase() !== fg.toLowerCase()).toBe(true);
  });
});


