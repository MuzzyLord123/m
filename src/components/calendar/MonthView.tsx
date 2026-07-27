import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, format, parseISO,
} from 'date-fns';
import { motion } from 'framer-motion';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const EVENT_COLORS: Record<string, string> = {
  '#3b82f6': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/25',
  '#ef4444': 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/25',
  '#22c55e': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25',
  '#f59e0b': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/25',
  '#8b5cf6': 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/25',
  '#ec4899': 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20 hover:bg-pink-500/25',
  '#06b6d4': 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/25',
  '#f97316': 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/25',
  '#14b8a6': 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20 hover:bg-teal-500/25',
  '#6366f1': 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/25',
};

function getEventStyle(color: string) {
  return EVENT_COLORS[color] || EVENT_COLORS['#3b82f6'];
}

export function MonthView({ currentDate, events, onDateClick, onEventClick }: MonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = format(parseISO(event.start_time), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    });
    return map;
  }, [events]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const rows = Math.ceil(days.length / 7);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map(day => (
          <div key={day} className="px-2 py-2.5 text-[11px] font-semibold text-muted-foreground text-center uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className={`grid grid-cols-7 flex-1`} style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {days.map((day, i) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const maxVisible = 2;

          return (
            <div
              key={dateKey}
              className={`relative border-b border-r border-border/60 p-1 lg:p-1.5 cursor-pointer transition-colors duration-150 group ${
                !isCurrentMonth ? 'bg-muted/20' : 'hover:bg-accent/20'
              } ${isCurrentDay ? 'bg-primary/[0.03]' : ''}`}
              onClick={() => onDateClick(day)}
            >
              {/* Date number */}
              <div className="flex items-center justify-center mb-0.5">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    isCurrentDay
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : !isCurrentMonth
                        ? 'text-muted-foreground/50'
                        : 'text-foreground group-hover:bg-accent'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map(event => (
                  <button
                    key={event.id}
                    onClick={e => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={`w-full text-left text-[10px] lg:text-[11px] leading-tight px-1.5 py-[3px] rounded-[4px] truncate font-medium transition-colors ${getEventStyle(event.color)}`}
                  >
                    {event.is_all_day ? '' : (
                      <span className="opacity-60 mr-0.5">{format(parseISO(event.start_time), 'h:mm')}</span>
                    )}
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > maxVisible && (
                  <div className="text-[10px] font-medium text-muted-foreground/70 text-center pt-0.5 hover:text-primary cursor-pointer">
                    +{dayEvents.length - maxVisible} more
                  </div>
                )}
              </div>

              {/* Dot indicator for events on small screens */}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 lg:hidden">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
