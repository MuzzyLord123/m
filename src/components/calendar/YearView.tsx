import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isToday, format, isSameDay,
} from 'date-fns';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

export function YearView({ currentDate, events, onDateClick }: YearViewProps) {
  const year = currentDate.getFullYear();

  const eventDates = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach(e => {
      const key = format(new Date(e.start_time), 'yyyy-MM-dd');
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [events]);

  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)),
    [year]
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map(month => (
          <MonthMini key={month.getMonth()} month={month} eventDates={eventDates} onDateClick={onDateClick} today={new Date()} />
        ))}
      </div>
    </div>
  );
}

function MonthMini({ month, eventDates, onDateClick, today }: {
  month: Date;
  eventDates: Map<string, number>;
  onDateClick: (date: Date) => void;
  today: Date;
}) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [month]);

  return (
    <div>
      <h3 className="text-xs font-bold text-foreground mb-2">{format(month, 'MMMM')}</h3>
      <div className="grid grid-cols-7 gap-y-0.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[8px] font-semibold text-muted-foreground text-center">{d}</div>
        ))}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, month);
          const isTodayDate = isToday(day);
          const count = eventDates.get(dateKey) || 0;

          return (
            <button
              key={dateKey}
              onClick={() => onDateClick(day)}
              className={`h-5 w-5 mx-auto flex items-center justify-center text-[9px] rounded-full transition-all
                ${!inMonth ? 'text-transparent pointer-events-none' : ''}
                ${isTodayDate ? 'bg-primary text-primary-foreground font-bold' : ''}
                ${count > 0 && !isTodayDate ? 'bg-primary/15 text-primary font-semibold' : ''}
                ${inMonth && !isTodayDate && count === 0 ? 'text-muted-foreground hover:bg-accent' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
