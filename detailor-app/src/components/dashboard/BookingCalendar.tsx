"use client";
import * as React from 'react';

export type BookingEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
};

export interface BookingCalendarProps {
  events: BookingEvent[];
  onEventDrop?: (eventId: string, start: Date, end: Date) => void;
  onEventClick?: (eventId: string) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

const statusToClasses: Record<BookingEvent['status'], string> = {
  pending: 'bg-[var(--color-warning-50)] border-[var(--color-warning-400)] text-[var(--color-warning-600)]',
  confirmed: 'bg-[var(--color-primary-50)] border-[var(--color-primary-400)] text-[var(--color-primary-700)]',
  in_progress: 'bg-[var(--color-info)]/10 border-[var(--color-info)] text-[var(--color-info)]',
  completed: 'bg-[var(--color-success-50)] border-[var(--color-success-400)] text-[var(--color-success-600)]',
  cancelled: 'bg-[var(--color-muted)] border-[var(--color-border)] text-[var(--color-text-muted)]',
};

export function BookingCalendar({ events, onEventDrop, onEventClick, currentDate = new Date(), onDateChange }: BookingCalendarProps) {
  const [date, setDate] = React.useState(currentDate);
  React.useEffect(() => setDate(currentDate), [currentDate]);
  const liveRef = React.useRef<HTMLDivElement | null>(null);
  const [grabbedEventId, setGrabbedEventId] = React.useState<string | null>(null);
  const instructionsId = 'calendar-dnd-instructions';
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days: Date[] = [];
  for (let d = new Date(startOfMonth); d <= endOfMonth; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const eventsByDay = groupByDay(events);
  const findEventById = React.useMemo(() => findEventByIdFactory(events), [events]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4" role="region" aria-label="Booking calendar">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[var(--color-text)] font-[var(--font-weight-semibold)]">Booking Calendar</div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-hover-surface)]" onClick={() => changeMonth(-1)} aria-label="Previous month">←</button>
          <div className="text-[var(--color-text)]">{date.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button className="px-2 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-hover-surface)]" onClick={() => changeMonth(1)} aria-label="Next month">→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2" role="grid" aria-label="Month grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-[var(--color-text-muted)] text-center text-[var(--font-size-sm)]" role="columnheader">{d}</div>
        ))}
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className="min-h-[100px] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-1"
            role="gridcell"
            aria-label={d.toDateString()}
            tabIndex={0}
            onKeyDown={(ev) => {
              // Arrow navigation between days when cell focused
              const index = days.findIndex(day => day.toDateString() === d.toDateString());
              if (index === -1) return;
              let nextIndex = index;
              if (ev.key === 'ArrowRight') nextIndex = index + 1;
              else if (ev.key === 'ArrowLeft') nextIndex = index - 1;
              else if (ev.key === 'ArrowDown') nextIndex = index + 7;
              else if (ev.key === 'ArrowUp') nextIndex = index - 7;
              if (nextIndex !== index && days[nextIndex]) {
                ev.preventDefault();
                const el = (ev.currentTarget.parentElement?.children[nextIndex + 7] as HTMLElement) || null; // +7 to skip headers
                el?.focus();
              }
              // Drop grabbed event into this day
              if ((ev.key === 'Enter' || ev.key === ' ') && grabbedEventId) {
                ev.preventDefault();
                const grabbed = findEventById(grabbedEventId);
                if (grabbed) {
                  const start = new Date(d);
                  const duration = grabbed.end.getTime() - grabbed.start.getTime();
                  const end = new Date(start.getTime() + duration);
                  onEventDrop?.(grabbed.id, start, end);
                  setGrabbedEventId(null);
                  liveRef.current && (liveRef.current.textContent = `${grabbed.title} dropped on ${start.toDateString()}`);
                }
              }
            }}
          >
            <div className="text-[var(--color-text-muted)] text-[var(--font-size-xs)] text-right" aria-hidden>{d.getDate()}</div>
            <div className="space-y-1">
              {(eventsByDay[dateKey(d)] || []).map((e) => (
                <div
                  key={e.id}
                  className={`text-[var(--font-size-xs)] p-1 rounded border ${statusToClasses[e.status]} cursor-pointer`}
                  onClick={() => onEventClick?.(e.id)}
                  tabIndex={0}
                  role="button"
                  aria-roledescription="Event"
                  aria-describedby={instructionsId}
                  aria-grabbed={grabbedEventId === e.id}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter') {
                      ev.preventDefault();
                      onEventClick?.(e.id);
                    }
                    if (ev.key === ' ' && grabbedEventId !== e.id) {
                      ev.preventDefault();
                      setGrabbedEventId(e.id);
                      liveRef.current && (liveRef.current.textContent = `${e.title} picked up. Use arrow keys to move by day. Press Enter on a day to drop, or Escape to cancel.`);
                    } else if (ev.key === ' ' && grabbedEventId === e.id) {
                      // Space again cancels grab
                      ev.preventDefault();
                      setGrabbedEventId(null);
                      liveRef.current && (liveRef.current.textContent = `Cancelled moving ${e.title}.`);
                    }
                    if (ev.key === 'Escape' && grabbedEventId) {
                      ev.preventDefault();
                      setGrabbedEventId(null);
                      liveRef.current && (liveRef.current.textContent = `Cancelled moving ${e.title}.`);
                    }
                    // Arrow keys move by day only when grabbed
                    if ((ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') && grabbedEventId === e.id) {
                      ev.preventDefault();
                      const delta = ev.key === 'ArrowRight' ? 1 : -1;
                      const newStart = new Date(e.start);
                      newStart.setDate(newStart.getDate() + delta);
                      const duration = e.end.getTime() - e.start.getTime();
                      const newEnd = new Date(newStart.getTime() + duration);
                      onEventDrop?.(e.id, newStart, newEnd);
                      liveRef.current && (liveRef.current.textContent = `${e.title} moved to ${newStart.toDateString()}`);
                    }
                  }}
                  draggable
                  onDragStart={(ev) => ev.dataTransfer.setData('text/plain', e.id)}
                  onDragOver={(ev) => ev.preventDefault()}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    const id = ev.dataTransfer.getData('text/plain');
                    const start = new Date(d);
                    const end = new Date(start.getTime() + 60 * 60 * 1000);
                    onEventDrop?.(id, start, end);
                    liveRef.current && (liveRef.current.textContent = `${e.title} moved to ${start.toDateString()}`);
                  }}
                  aria-label={`${e.title}`}
                >
                  {e.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div id={instructionsId} className="sr-only">Use Space to pick up event, Arrow keys to move by day, Enter on a day to drop, Escape to cancel.</div>
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />
    </div>
  );

  function changeMonth(delta: number) {
    const next = new Date(date.getFullYear(), date.getMonth() + delta, 1);
    setDate(next);
    onDateChange?.(next);
  }
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function groupByDay(events: BookingEvent[]) {
  return events.reduce<Record<string, BookingEvent[]>>((acc, e) => {
    const key = dateKey(e.start);
    (acc[key] ||= []).push(e);
    return acc;
  }, {});
}

function findEventByIdFactory(events: BookingEvent[]) {
  const map = new Map<string, BookingEvent>();
  for (const e of events) map.set(e.id, e);
  return (id: string) => map.get(id) || null;
}



