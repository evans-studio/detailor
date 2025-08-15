import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChartCard } from '@/components/dashboard/ChartCard';

describe('ChartCard', () => {
  it('renders line chart with legend', () => {
    render(
      <ChartCard
        title="Revenue"
        type="line"
        categories={["Mon","Tue","Wed"]}
        series={[{ name: 'Revenue', data: [1,2,3] }]}
      />
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /line chart/i })).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(
      <ChartCard
        title="Revenue"
        type="bar"
        categories={[]}
        series={[]}
      />
    );
    expect(screen.getByText(/No data/)).toBeInTheDocument();
  });
});


