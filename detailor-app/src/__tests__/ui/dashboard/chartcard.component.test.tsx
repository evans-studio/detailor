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
    expect(screen.getAllByText('Revenue')[0]).toBeInTheDocument();
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

  it('renders bar chart with multiple series and legend', () => {
    render(
      <ChartCard
        title="Services"
        type="bar"
        categories={["A","B","C"]}
        series={[{ name: 'Wash', data: [1,2,3] }, { name: 'Detail', data: [3,2,1] }]}
      />
    );
    expect(screen.getByRole('img', { name: /bar chart/i })).toBeInTheDocument();
    // Legend contains both series names
    expect(screen.getByText('Wash')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });

  it('renders pie chart and exposes slice labels with percentages', () => {
    render(
      <ChartCard
        title="Mix"
        type="pie"
        categories={["A","B","C"]}
        series={[{ name: 'Share', data: [1,2,3] }]}
      />
    );
    expect(screen.getByRole('img', { name: /pie chart/i })).toBeInTheDocument();
    // 1/6 = 16.7%, 2/6 = 33.3%, 3/6 = 50.0%
    expect(screen.getByLabelText(/A: 16\.7%/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/B: 33\.3%/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/C: 50\.0%/i)).toBeInTheDocument();
  });

  it('marks legend aria-hidden and contains series labels', () => {
    const { container } = render(
      <ChartCard
        title="Legend Test"
        type="line"
        categories={["A","B"]}
        series={[{ name: 'Series One', data: [1,2] }, { name: 'Series Two', data: [2,1] }]}
      />
    );
    const legend = container.querySelector('div[aria-hidden="true"]');
    expect(legend).toBeTruthy();
    expect(legend?.textContent).toContain('Series One');
    expect(legend?.textContent).toContain('Series Two');
  });

  it('exposes series names via sr-only container', () => {
    render(
      <ChartCard
        title="A11y"
        type="bar"
        categories={["A","B"]}
        series={[{ name: 'Alpha', data: [1,2] }, { name: 'Beta', data: [2,1] }]}
      />
    );
    expect(screen.getByTestId('chart-series').textContent).toContain('Alpha');
    expect(screen.getByTestId('chart-series').textContent).toContain('Beta');
  });
});


