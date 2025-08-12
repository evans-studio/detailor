"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';

// Calendar utilities
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color?: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  status?: string;
  metadata?: Record<string, unknown>;
  draggable?: boolean;
  onClick?: () => void;
}

export interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  view?: 'month' | 'week' | 'day';
  className?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
  showToday?: boolean;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  workingHours?: { start: number; end: number }; // 24-hour format
  weekStartsOn?: 0 | 1; // 0 = Sunday, 1 = Monday
}

// Modern Calendar Month View
export function EnterpriseCalendar({
  events = [],
  onDateClick,
  onEventClick,
  onEventDrop,
  view = 'month',
  className,
  showHeader = true,
  showNavigation = true,
  showToday = true,
  currentDate: controlledDate,
  onDateChange,
  workingHours = { start: 8, end: 18 },
  weekStartsOn = 1, // Monday
}: CalendarProps) {
  const [internalDate, setInternalDate] = React.useState(new Date());
  const currentDate = controlledDate || internalDate;

  const [draggedEvent, setDraggedEvent] = React.useState<CalendarEvent | null>(null);

  const handleDateChange = (newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    handleDateChange(newDate);
  };

  const goToToday = () => {
    handleDateChange(new Date());
  };

  if (view === 'month') {
    return (
      <MonthView
        currentDate={currentDate}
        events={events}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
        onEventDrop={onEventDrop}
        onNavigate={navigateMonth}
        onToday={goToToday}
        showHeader={showHeader}
        showNavigation={showNavigation}
        showToday={showToday}
        weekStartsOn={weekStartsOn}
        className={className}
        draggedEvent={draggedEvent}
        setDraggedEvent={setDraggedEvent}
      />
    );
  }

  if (view === 'week') {
    return (
      <WeekView
        currentDate={currentDate}
        events={events}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
        onEventDrop={onEventDrop}
        workingHours={workingHours}
        className={className}
        draggedEvent={draggedEvent}
        setDraggedEvent={setDraggedEvent}
      />
    );
  }

  // Day view would go here
  return <div>Day view not implemented yet</div>;
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  onEventDrop,
  onNavigate,
  onToday,
  showHeader,
  showNavigation,
  showToday,
  weekStartsOn,
  className,
  draggedEvent,
  setDraggedEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  showHeader: boolean;
  showNavigation: boolean;
  showToday: boolean;
  weekStartsOn: 0 | 1;
  className?: string;
  draggedEvent: CalendarEvent | null;
  setDraggedEvent: (event: CalendarEvent | null) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate calendar days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Adjust for week starting day
    let startingDayOfWeek = firstDay.getDay();
    if (weekStartsOn === 1) {
      startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    }
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days from previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add padding to complete the grid (6 rows × 7 days = 42 cells)
    const totalCells = 42;
    while (days.length < totalCells) {
      days.push(null);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toDateString();
    return events.filter(event => 
      event.start.toDateString() === dateString
    );
  };

  const handleEventDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetDate: Date, e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedEvent || !onEventDrop) return;
    
    const originalDuration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
    const newStart = new Date(targetDate);
    newStart.setHours(draggedEvent.start.getHours(), draggedEvent.start.getMinutes());
    const newEnd = new Date(newStart.getTime() + originalDuration);
    
    onEventDrop(draggedEvent, newStart, newEnd);
    setDraggedEvent(null);
  };

  const days = getDaysInMonth();

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-[var(--font-size-2xl)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            {showToday && (
              <Button intent="ghost" size="sm" onClick={onToday}>
                Today
              </Button>
            )}
          </div>
          {showNavigation && (
            <div className="flex items-center gap-2">
              <Button 
                intent="ghost" 
                size="sm"
                onClick={() => onNavigate('prev')}
                aria-label="Previous month"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <Button 
                intent="ghost" 
                size="sm"
                onClick={() => onNavigate('next')}
                aria-label="Next month"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {(weekStartsOn === 1 ? DAYS_OF_WEEK.slice(1).concat(DAYS_OF_WEEK[0]) : DAYS_OF_WEEK).map((day) => (
            <div
              key={day}
              className="p-3 text-center text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-muted)] bg-[var(--color-muted)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <CalendarDay
              key={index}
              day={day}
              isToday={day?.getTime() === today.getTime()}
              isCurrentMonth={day?.getMonth() === currentDate.getMonth()}
              events={day ? getEventsForDate(day) : []}
              onClick={day && onDateClick ? () => onDateClick(day) : undefined}
              onEventClick={onEventClick}
              onEventDragStart={handleEventDragStart}
              onDragOver={handleDragOver}
              onDrop={day ? (e) => handleDrop(day, e) : undefined}
              isDragTarget={!!draggedEvent}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Individual Calendar Day Component
function CalendarDay({
  day,
  isToday,
  isCurrentMonth,
  events,
  onClick,
  onEventClick,
  onEventDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}: {
  day: Date | null;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  onClick?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDragStart?: (event: CalendarEvent, e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragTarget: boolean;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  if (!day) {
    return <div className="h-32 bg-[var(--color-muted)]/30" />;
  }

  const visibleEvents = events.slice(0, 3);
  const hiddenEventsCount = events.length - visibleEvents.length;

  return (
    <div
      className={`
        h-32 p-2 border-b border-r border-[var(--color-border)] bg-[var(--color-surface)]
        transition-colors cursor-pointer
        ${onClick ? 'hover:bg-[var(--color-hover-surface)]' : ''}
        ${isDragTarget ? 'hover:bg-[var(--color-primary-50)]' : ''}
        ${!isCurrentMonth ? 'bg-[var(--color-muted)]/30 text-[var(--color-text-muted)]' : ''}
      `}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Date Number */}
      <div className={`
        text-[var(--font-size-sm)] font-[var(--font-weight-medium)] mb-2
        ${isToday 
          ? 'w-6 h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center text-[var(--font-size-xs)] font-[var(--font-weight-bold)]' 
          : isCurrentMonth 
            ? 'text-[var(--color-text)]' 
            : 'text-[var(--color-text-muted)]'
        }
      `}>
        {day.getDate()}
      </div>

      {/* Events */}
      <div className="space-y-1 overflow-hidden">
        {visibleEvents.map((event) => (
          <CalendarEventItem
            key={event.id}
            event={event}
            onClick={onEventClick}
            onDragStart={onEventDragStart}
            isHovered={isHovered}
          />
        ))}
        
        {hiddenEventsCount > 0 && (
          <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] font-[var(--font-weight-medium)] px-2">
            +{hiddenEventsCount} more
          </div>
        )}
      </div>
    </div>
  );
}

// Calendar Event Item
function CalendarEventItem({
  event,
  onClick,
  onDragStart,
  isHovered,
}: {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  onDragStart?: (event: CalendarEvent, e: React.DragEvent) => void;
  isHovered: boolean;
}) {
  const variant = event.variant || 'primary';
  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary-600)]',
    success: 'bg-[var(--color-success)] text-[var(--color-success-foreground)] border-[var(--color-success-600)]',
    warning: 'bg-[var(--color-warning)] text-[var(--color-warning-foreground)] border-[var(--color-warning-600)]',
    error: 'bg-[var(--color-error)] text-[var(--color-error-foreground)] border-[var(--color-error-600)]',
    info: 'bg-[var(--color-info)] text-[var(--color-info-foreground)] border-[var(--color-info-600)]',
  };

  return (
    <div
      className={`
        text-[var(--font-size-xs)] px-2 py-1 rounded-[var(--radius-sm)] 
        border-l-2 cursor-pointer transition-all
        ${variantClasses[variant]}
        ${event.draggable ? 'cursor-move' : ''}
        ${isHovered ? 'shadow-[var(--shadow-sm)] scale-105' : ''}
        hover:shadow-[var(--shadow-md)] hover:scale-105
      `}
      title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      draggable={event.draggable}
      onDragStart={onDragStart ? (e) => onDragStart(event, e) : undefined}
    >
      <div className="font-[var(--font-weight-medium)] truncate">
        {event.title}
      </div>
      {event.start && (
        <div className="opacity-90 truncate">
          {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

// Week View Component (simplified for now)
function WeekView({
  currentDate,
  events,
  onDateClick,
  onEventClick,
  onEventDrop, // eslint-disable-line @typescript-eslint/no-unused-vars
  workingHours,
  className,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  workingHours: { start: number; end: number };
  className?: string;
  draggedEvent: CalendarEvent | null;
  setDraggedEvent: (event: CalendarEvent | null) => void;
}) {
  // Get the start of the week (Monday)
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  // Generate time slots
  const timeSlots = Array.from(
    { length: workingHours.end - workingHours.start },
    (_, i) => workingHours.start + i
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Week View</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-px bg-[var(--color-border)]">
          {/* Time column header */}
          <div className="bg-[var(--color-muted)] p-2 text-center font-[var(--font-weight-semibold)]">
            Time
          </div>
          
          {/* Day headers */}
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="bg-[var(--color-muted)] p-2 text-center">
              <div className="font-[var(--font-weight-semibold)]">
                {day.toLocaleDateString('en-GB', { weekday: 'short' })}
              </div>
              <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                {day.getDate()}
              </div>
            </div>
          ))}

          {/* Time slots and day columns */}
          {timeSlots.map((hour) => (
            <React.Fragment key={hour}>
              {/* Time label */}
              <div className="bg-[var(--color-surface)] p-2 text-center text-[var(--font-size-sm)] text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                {String(hour).padStart(2, '0')}:00
              </div>
              
              {/* Day columns for this hour */}
              {weekDays.map((day) => {
                const slotDate = new Date(day);
                slotDate.setHours(hour, 0, 0, 0);
                const slotEvents = events.filter(event => {
                  const eventHour = event.start.getHours();
                  const eventDate = event.start.toDateString();
                  return eventDate === day.toDateString() && eventHour === hour;
                });

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="bg-[var(--color-surface)] p-1 border-b border-[var(--color-border)] min-h-[60px] hover:bg-[var(--color-hover-surface)] cursor-pointer"
                    onClick={() => onDateClick?.(slotDate)}
                  >
                    {slotEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-[var(--font-size-xs)] p-1 rounded bg-[var(--color-primary)] text-[var(--color-primary-foreground)] mb-1 cursor-pointer hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}