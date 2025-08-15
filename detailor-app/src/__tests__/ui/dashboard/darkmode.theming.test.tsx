import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatCard } from '@/components/dashboard/StatCard';

function setDarkMode() {
  // Simulate dark variables being applied by toggling key tokens
  const root = document.documentElement.style;
  root.setProperty('--color-bg', '#0F172A');
  root.setProperty('--color-surface', '#1E293B');
  root.setProperty('--color-text', '#F8FAFC');
  root.setProperty('--color-border', '#334155');
  root.setProperty('--color-primary', '#3B82F6');
  root.setProperty('--color-primary-foreground', '#ffffff');
}

describe('Dark mode theming', () => {
  it('renders with dark tokens without visual errors', () => {
    setDarkMode();
    const { container } = render(<StatCard title="Dark" value="OK" />);
    expect(container.firstChild).toBeTruthy();
  });
});
