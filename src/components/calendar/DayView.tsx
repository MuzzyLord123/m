import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { format, parseISO, isSameDay, isToday, differenceInMinutes, setHours, setMinutes, addMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent, rect: { x: number; y: number }) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onDragCreate?: (date: Date, startHour: number, endHour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64;
const SNAP_MINUTES = 15;

export function DayView({ currentDate, events, onTimeSlotClick, onEventClick, onEventDrop, onDragCreate }: DayViewProps) {
  const dayEvents = useMemo(() => events.filter(e => isSameDay(parseISO(e.start_time), currentDate) && !e.is_all_day), [events, currentDate]);
  const allDayEvents = useMemo(() => events.filter(e => isSameDay(parseISO(e.start_time), currentDate) && e.is_all_day), [events, currentDate]);

  const [now, setNow] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max((now.getHours() - 1) * HOUR_HEIGHT, 0);
    }
  }, []);

  const yToMinutes = useCallback((y: number) => {
    const mins = (y / HOUR_HEIGHT) * 60;
    return Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES;
  }, []);

  // Drag to create
  const [dragCreate, setDragCreate] = useState<{ startY: number; endY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-event]')) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDragCreate({ startY: y, endY: y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragCreate) return;
    const col = e.currentTarget.querySelector('[data-daycolumn]');
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDragCreate(prev => prev ? { ...prev, endY: Math.max(0, y) } : null);
  }, [dragCreate]);

  const handleMouseUp = useCallback(() => {
    if (!dragCreate) return;
    const startMins = yToMinutes(Math.min(dragCreate.startY, dragCreate.endY));
    const endMins = yToMinutes(Math.max(dragCreate.startY, dragCreate.endY));
    if (endMins - startMins >= 15) {
      if (onDragCreate) {
        onDragCreate(currentDate, startMins / 60, endMins / 60);
      } else {
        onTimeSlotClick(currentDate, Math.floor(startMins / 60));
      }
    }
    setDragCreate(null);
  }, [dragCreate, currentDate, onDragCreate, onTimeSlotClick, yToMinutes]);

  // Drag-to-reschedule
  const [draggingEvent, setDraggingEvent] = useState<{ event: CalendarEvent; offsetY: number } | null>(null);
  const [dragY, setDragY] = useState<number | null>(null);

  const handleEventDrag = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingEvent({ event, offsetY: e.clientY - rect.top });
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingEvent) return;
    const col = e.currentTarget.querySelector('[data-daycolumn]');
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const y = e.clientY - rect.top - draggingEvent.offsetY;
    setDragY(Math.max(0, y));
  }, [draggingEvent]);

  const handleDragEnd = useCallback(() => {
    if (draggingEvent && dragY !== null && onEventDrop) {
      const newStartMins = yToMinutes(dragY);
      const duration = differenceInMinutes(parseISO(draggingEvent.event.end_time), parseISO(draggingEvent.event.start_time));
      const newStart = setMinutes(setHours(currentDate, Math.floor(newStartMins / 60)), newStartMins % 60);
      const newEnd = addMinutes(newStart, duration);
      onEventDrop(draggingEvent.event.id, newStart, newEnd);
    }
    setDraggingEvent(null);
    setDragY(null);
  }, [draggingEvent, dragY, currentDate, onEventDrop, yToMinutes]);

  // Overlap layout
  const layouts = useMemo(() => {
    if (dayEvents.length === 0) return [];
    const sorted = [...dayEvents].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const result: { event: CalendarEvent; col: number; totalCols: number }[] = [];
    const cols: { end: number }[] = [];
    sorted.forEach(event => {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      const startMin = start.getHours() * 60 + start.getMinutes();
      const endMin = end.getHours() * 60 + end.getMinutes();
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (startMin >= cols[c].end) { cols[c].end = endMin; result.push({ event, col: c, totalCols: 0 }); placed = true; break; }
      }
      if (!placed) { cols.push({ end: endMin }); result.push({ event, col: cols.length - 1, totalCols: 0 }); }
    });
    // Group overlaps
    const groups: typeof result[] = [];
    let group: typeof result = [];
    let gEnd = 0;
    result.forEach(r => {
      const s = new Date(r.event.start_time);
      const startMin = s.getHours() * 60 + s.getMinutes();
      if (group.length === 0 || startMin < gEnd) {
        group.push(r);
        const e = new Date(r.event.end_time);
        gEnd = Math.max(gEnd, e.getHours() * 60 + e.getMinutes());
      } else { groups.push(group); group = [r]; const e = new Date(r.event.end_time); gEnd = e.getHours() * 60 + e.getMinutes(); }
    });
    if (group.length) groups.push(group);
    groups.forEach(g => { const mc = Math.max(...g.map(x => x.col)) + 1; g.forEach(x => { x.totalCols = mc; }); });
    return result;
  }, [dayEvents]);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden min-h-0"
      onMouseMove={(e) => { handleMouseMove(e); handleDragMove(e); }}
      onMouseUp={() => { handleMouseUp(); handleDragEnd(); }}
      onMouseLeave={() => { handleMouseUp(); handleDragEnd(); }}
      onContextMenu={(e) => { if (draggingEvent) e.preventDefault(); }}
    >
      {/* All-day */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-border px-3 py-2 space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">All day</div>
          {allDayEvents.map(event => (
            <button
              key={event.id}
              onClick={(e) => onEventClick(event, { x: e.clientX, y: e.clientY })}
              className="w-full text-left text-xs px-3 py-1.5 rounded-md font-medium truncate border-l-[3px]"
              style={{ backgroundColor: `${event.color}15`, borderLeftColor: event.color, color: event.color }}
            >
              {event.title}
            </button>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="w-20 flex-shrink-0 relative">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full text-right pr-3 text-[10px] text-muted-foreground/60 font-medium"
                style={{ top: hour * HOUR_HEIGHT - 5 }}
              >
                {hour === 0 ? '' : `${hour === 12 ? 12 : hour % 12}:00 ${hour < 12 ? 'AM' : 'PM'}`}
              </div>
            ))}
          </div>

          {/* Day column */}
          <div
            data-daycolumn
            className="flex-1 relative border-l border-border/60"
            onMouseDown={handleMouseDown}
          >
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full border-t border-border/25"
                style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              >
                <div className="absolute w-full border-t border-border/10 border-dashed" style={{ top: HOUR_HEIGHT / 2 }} />
              </div>
            ))}

            {/* Current time */}
            {isToday(currentDate) && (
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{ top: now.getHours() * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT }}
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-destructive -ml-1.5 shadow-md shadow-destructive/40 ring-2 ring-card" />
                  <div className="flex-1 h-[2px] bg-destructive/70" />
                </div>
              </div>
            )}

            {/* Drag-to-create preview */}
            {dragCreate && (
              <div
                className="absolute left-2 right-4 rounded-lg bg-primary/10 border-2 border-primary/40 border-dashed z-20 pointer-events-none"
                style={{
                  top: Math.min(dragCreate.startY, dragCreate.endY),
                  height: Math.abs(dragCreate.endY - dragCreate.startY),
                }}
              >
                <span className="text-[11px] text-primary font-semibold px-2 py-1">
                  {format(setMinutes(setHours(new Date(), Math.floor(yToMinutes(Math.min(dragCreate.startY, dragCreate.endY)) / 60)), yToMinutes(Math.min(dragCreate.startY, dragCreate.endY)) % 60), 'h:mm a')}
                  {' – '}
                  {format(setMinutes(setHours(new Date(), Math.floor(yToMinutes(Math.max(dragCreate.startY, dragCreate.endY)) / 60)), yToMinutes(Math.max(dragCreate.startY, dragCreate.endY)) % 60), 'h:mm a')}
                </span>
              </div>
            )}

            {/* Events with overlap */}
            {layouts.map(({ event, col, totalCols }) => {
              const start = parseISO(event.start_time);
              const end = parseISO(event.end_time);
              const startMinutes = start.getHours() * 60 + start.getMinutes();
              const duration = differenceInMinutes(end, start);
              const top = (startMinutes / 60) * HOUR_HEIGHT;
              const height = Math.max((duration / 60) * HOUR_HEIGHT, 28);
              const isDragging = draggingEvent?.event.id === event.id;

              return (
              <motion.button
                  key={event.id}
                  data-event
                  layout
                  className={`absolute rounded-lg px-3 py-1.5 text-sm overflow-hidden z-10 text-left border-l-[3px] select-none ${
                    isDragging ? 'opacity-40 cursor-grabbing' : 'hover:shadow-lg hover:z-20 cursor-pointer'
                  }`}
                  style={{
                    top,
                    height,
                    width: `calc(${100 / totalCols}% - 8px)`,
                    left: `calc(${(col / totalCols) * 100}% + 4px)`,
                    backgroundColor: `${event.color}10`,
                    borderLeftColor: event.color,
                    color: event.color,
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    if (e.button === 2) {
                      e.stopPropagation();
                      handleEventDrag(event, e);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event, { x: e.clientX, y: e.clientY });
                  }}
                >
                  <div className="font-semibold truncate">{event.title}</div>
                  {height > 40 && (
                    <div className="text-xs opacity-60 mt-0.5">{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</div>
                  )}
                  {height > 64 && event.location && (
                    <div className="text-xs opacity-50 truncate mt-0.5">📍 {event.location}</div>
                  )}
                </motion.button>
              );
            })}

            {/* Drag ghost */}
            {draggingEvent && dragY !== null && (
              <div
                className="absolute left-2 right-4 rounded-lg px-3 py-1.5 text-sm z-50 pointer-events-none border-l-[3px] opacity-70 shadow-2xl"
                style={{
                  top: dragY,
                  height: Math.max((differenceInMinutes(parseISO(draggingEvent.event.end_time), parseISO(draggingEvent.event.start_time)) / 60) * HOUR_HEIGHT, 28),
                  backgroundColor: `${draggingEvent.event.color}20`,
                  borderLeftColor: draggingEvent.event.color,
                  color: draggingEvent.event.color,
                }}
              >
                <div className="font-semibold truncate">{draggingEvent.event.title}</div>
                <div className="text-xs opacity-60">
                  {format(setMinutes(setHours(new Date(), Math.floor(yToMinutes(dragY) / 60)), yToMinutes(dragY) % 60), 'h:mm a')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
