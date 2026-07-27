import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, format, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

interface MiniCalendarProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
}

export function MiniCalendar({ currentDate, selectedDate, onSelectDate, events }: MiniCalendarProps) {
  const [miniDate, setMiniDate] = useMemo(() => [currentDate], [currentDate]) as any;
  // We need state for the mini calendar's own month
  return <MiniCalendarInner selectedDate={selectedDate} onSelectDate={onSelectDate} events={events} initialDate={currentDate} />;
}

import { useState } from 'react';

function MiniCalendarInner({ selectedDate, onSelectDate, events, initialDate }: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
  initialDate: Date;
}) {
  const [viewDate, setViewDate] = useState(initialDate);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewDate]);

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => set.add(format(new Date(e.start_time), 'yyyy-MM-dd')));
    return set;
  }, [events]);

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{format(viewDate, 'MMMM yyyy')}</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setViewDate(prev => subMonths(prev, 1))}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={() => setViewDate(prev => addMonths(prev, 1))}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d, i) => (
          <div key={i} className="text-[9px] font-semibold text-muted-foreground text-center py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasEvents = eventDates.has(dateKey);

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(day)}
              className={`relative h-6 w-6 mx-auto flex items-center justify-center text-[10px] font-medium rounded-full transition-all duration-150
                ${!isCurrentMonth ? 'text-muted-foreground/30' : ''}
                ${isSelected ? 'bg-primary text-primary-foreground shadow-sm' : ''}
                ${isTodayDate && !isSelected ? 'bg-primary/10 text-primary font-bold' : ''}
                ${!isSelected && isCurrentMonth ? 'hover:bg-accent' : ''}
              `}
            >
              {format(day, 'd')}
              {hasEvents && !isSelected && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
