import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookingCalendar } from '@/components/dashboard/BookingCalendar';

describe('BookingCalendar', () => {
  it('renders events and supports drop', () => {
    const onDrop = vi.fn();
    const start = new Date();
    const events = [{ id: 'e1', title: 'Test Event', start, end: new Date(start.getTime()+3600000), status: 'confirmed' as const }];
    render(<BookingCalendar events={events} onEventDrop={(id, s, e) => onDrop(id, s, e)} />);
    expect(screen.getByText('Booking Calendar')).toBeInTheDocument();
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });
});


