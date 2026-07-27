import { useMemo } from 'react';
import { format, parseISO, isToday, isTomorrow, startOfDay } from 'date-fns';
import { MapPin, Clock, Users, CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function AgendaView({ currentDate, events, onEventClick }: AgendaViewProps) {
  const grouped = useMemo(() => {
    const sorted = [...events]
      .filter(e => parseISO(e.start_time) >= startOfDay(currentDate))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const groups: Record<string, CalendarEvent[]> = {};
    sorted.forEach(event => {
      const key = format(parseISO(event.start_time), 'yyyy-MM-dd');
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }, [events, currentDate]);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d');
  };

  const entries = Object.entries(grouped).slice(0, 14);

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
            <CalendarDays className="h-8 w-8 opacity-30" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground/80">No upcoming events</p>
            <p className="text-sm text-muted-foreground mt-1">Use the AI chat below to schedule something</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {entries.map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-sm font-semibold text-foreground">{getDateLabel(dateKey)}</h3>
            <span className="text-[11px] text-muted-foreground font-medium">{format(parseISO(dateKey), 'MMM d, yyyy')}</span>
          </div>
          <div className="space-y-1.5">
            {dayEvents.map(event => (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-accent/20 transition-all duration-150 group"
              >
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm group-hover:text-primary transition-colors">{event.title}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" />
                      {event.is_all_day
                        ? 'All day'
                        : `${format(parseISO(event.start_time), 'h:mm a')} – ${format(parseISO(event.end_time), 'h:mm a')}`}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 opacity-60" />
                        {event.location}
                      </span>
                    )}
                    {event.attendees && (event.attendees as any[]).length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 opacity-60" />
                        {(event.attendees as any[]).length}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
