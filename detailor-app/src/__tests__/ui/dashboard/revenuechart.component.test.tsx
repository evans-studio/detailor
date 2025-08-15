import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RevenueChart } from '@/components/dashboard/RevenueChart';

describe('RevenueChart', () => {
  it('renders chart with period selector', () => {
    const data = [
      { date: '2025-01-01', revenue: 100, revenue_prev: 80 },
      { date: '2025-01-02', revenue: 140, revenue_prev: 90 },
    ];
    render(<RevenueChart data={data} />);
    expect(screen.getByLabelText('Select period')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /line chart/i })).toBeInTheDocument();
  });
});


