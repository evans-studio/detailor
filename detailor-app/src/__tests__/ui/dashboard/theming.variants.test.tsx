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
});


