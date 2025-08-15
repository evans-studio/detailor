import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from '@/components/dashboard/StatCard';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Revenue" value="£1,234" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value')).toHaveTextContent('£1,234');
  });

  it('shows loading skeleton', () => {
    render(<StatCard title="Revenue" loading />);
    expect(screen.getByRole('status', { name: /loading statistic/i })).toBeInTheDocument();
  });

  it('shows empty message when no value', () => {
    render(<StatCard title="Revenue" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });

  it('applies status color for increase', () => {
    render(<StatCard title="Bookings" value={32} change={'+5%'} changeType="increase" />);
    expect(screen.getByTestId('stat-change')).toHaveTextContent('▲');
  });
});


