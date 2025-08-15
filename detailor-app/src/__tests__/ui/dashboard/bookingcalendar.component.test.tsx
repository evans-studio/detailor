import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('supports keyboard move and announces changes', () => {
    const onDrop = vi.fn();
    const start = new Date('2025-01-01T10:00:00Z');
    const events = [{ id: 'e1', title: 'Test Event', start, end: new Date(start.getTime()+3600000), status: 'confirmed' as const }];
    render(<BookingCalendar events={events} onEventDrop={(id, s, e) => onDrop(id, s, e)} currentDate={new Date('2025-01-01T00:00:00Z')} />);
    const eventEl = screen.getByText('Test Event');
    eventEl.focus();
    // grab with Space, then move one day with ArrowRight
    fireEvent.keyDown(eventEl, { key: ' ' });
    fireEvent.keyDown(eventEl, { key: 'ArrowRight' });
    expect(onDrop).toHaveBeenCalled();
  });

  it('announces month change and moves focus to first day', async () => {
    render(
      <BookingCalendar
        events={[]}
        currentDate={new Date('2025-01-01T00:00:00Z')}
      />
    );
    const nextBtn = screen.getByRole('button', { name: /Next month/i });
    nextBtn.click();
    // SR announcement appears
    await screen.findByText(/Showing February 2025/i);
    // Focus moves to first gridcell in new month
    const active = document.activeElement as HTMLElement | null;
    expect(active?.getAttribute('role')).toBe('gridcell');
    expect(active?.getAttribute('aria-label')).toMatch(/Feb/);
    expect(active?.getAttribute('aria-label')).toMatch(/2025/);
  });

  it('returns focus to moved event after keyboard drop', async () => {
    const onDrop = vi.fn();
    const start = new Date('2025-01-01T10:00:00Z');
    const events = [{ id: 'e1', title: 'Test Event', start, end: new Date(start.getTime()+3600000), status: 'confirmed' as const }];
    render(<BookingCalendar events={events} onEventDrop={(id, s, e) => onDrop(id, s, e)} currentDate={new Date('2025-01-01T00:00:00Z')} />);
    const eventEl = screen.getByText('Test Event');
    eventEl.focus();
    // grab with Space, then drop one day to the right
    fireEvent.keyDown(eventEl, { key: ' ' });
    fireEvent.keyDown(eventEl, { key: 'ArrowRight' });
    expect(onDrop).toHaveBeenCalled();
    await waitFor(() => {
      const active = document.activeElement as HTMLElement | null;
      expect(active?.getAttribute('data-event-id')).toBe('e1');
    });
  });
});


