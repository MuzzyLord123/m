import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  startOfWeek, addDays, format, parseISO, isSameDay, isToday, differenceInMinutes,
  addMinutes, setHours, setMinutes,
} from 'date-fns';
import { motion } from 'framer-motion';
import type { CalendarEvent } from '@/hooks/useCalendarEvents';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent, rect: { x: number; y: number }) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onDragCreate?: (date: Date, startHour: number, endHour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60;
const SNAP_MINUTES = 15;

interface ColumnLayout { event: CalendarEvent; column: number; totalColumns: number; }

function layoutOverlapping(dayEvents: CalendarEvent[]): ColumnLayout[] {
  if (dayEvents.length === 0) return [];
  const sorted = [...dayEvents].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const layouts: ColumnLayout[] = [];
  const columns: { end: number }[] = [];

  sorted.forEach(event => {
    const startMin = new Date(event.start_time).getHours() * 60 + new Date(event.start_time).getMinutes();
    const endMin = new Date(event.end_time).getHours() * 60 + new Date(event.end_time).getMinutes();

    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (startMin >= columns[c].end) {
        columns[c].end = endMin;
        layouts.push({ event, column: c, totalColumns: 0 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push({ end: endMin });
      layouts.push({ event, column: columns.length - 1, totalColumns: 0 });
    }
  });

  // Calculate max overlapping columns for each group
  const groups: ColumnLayout[][] = [];
  let currentGroup: ColumnLayout[] = [];
  let groupEnd = 0;

  layouts.forEach(layout => {
    const startMin = new Date(layout.event.start_time).getHours() * 60 + new Date(layout.event.start_time).getMinutes();
    if (currentGroup.length === 0 || startMin < groupEnd) {
      currentGroup.push(layout);
      const endMin = new Date(layout.event.end_time).getHours() * 60 + new Date(layout.event.end_time).getMinutes();
      groupEnd = Math.max(groupEnd, endMin);
    } else {
      groups.push(currentGroup);
      currentGroup = [layout];
      const endMin = new Date(layout.event.end_time).getHours() * 60 + new Date(layout.event.end_time).getMinutes();
      groupEnd = endMin;
    }
  });
  if (currentGroup.length > 0) groups.push(currentGroup);

  groups.forEach(group => {
    const maxCol = Math.max(...group.map(l => l.column)) + 1;
    group.forEach(l => { l.totalColumns = maxCol; });
  });

  return layouts;
}

export function WeekView({ currentDate, events, onTimeSlotClick, onEventClick, onEventDrop, onDragCreate }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const [now, setNow] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live time
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to current time
  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = Math.max((now.getHours() - 1) * HOUR_HEIGHT, 0);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Drag-to-create state
  const [dragCreate, setDragCreate] = useState<{ dayIdx: number; startY: number; endY: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const yToMinutes = useCallback((y: number) => {
    const mins = (y / HOUR_HEIGHT) * 60;
    return Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES;
  }, []);

  const handleMouseDown = useCallback((dayIdx: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-event]')) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDragCreate({ dayIdx, startY: y, endY: y });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragCreate) return;
    const cols = gridRef.current?.querySelectorAll('[data-daycolumn]');
    if (!cols || !cols[dragCreate.dayIdx]) return;
    const rect = cols[dragCreate.dayIdx].getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDragCreate(prev => prev ? { ...prev, endY: Math.max(0, y) } : null);
  }, [dragCreate]);

  const handleMouseUp = useCallback(() => {
    if (!dragCreate) return;
    const startMins = yToMinutes(Math.min(dragCreate.startY, dragCreate.endY));
    const endMins = yToMinutes(Math.max(dragCreate.startY, dragCreate.endY));
    if (endMins - startMins >= 15) {
      const day = weekDays[dragCreate.dayIdx];
      if (onDragCreate) {
        onDragCreate(day, startMins / 60, endMins / 60);
      } else {
        onTimeSlotClick(day, Math.floor(startMins / 60));
      }
    }
    setDragCreate(null);
  }, [dragCreate, weekDays, onDragCreate, onTimeSlotClick, yToMinutes]);

  // Drag-to-reschedule state
  const [draggingEvent, setDraggingEvent] = useState<{ event: CalendarEvent; offsetY: number; dayIdx: number } | null>(null);
  const [dragPos, setDragPos] = useState<{ dayIdx: number; top: number } | null>(null);

  const handleEventDragStart = useCallback((event: CalendarEvent, dayIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    setDraggingEvent({ event, offsetY, dayIdx });
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggingEvent) return;
    const cols = gridRef.current?.querySelectorAll('[data-daycolumn]');
    if (!cols) return;
    // Determine which day column
    let closestIdx = 0;
    let closestDist = Infinity;
    cols.forEach((col, idx) => {
      const rect = col.getBoundingClientRect();
      const dist = Math.abs(e.clientX - (rect.left + rect.width / 2));
      if (dist < closestDist) { closestDist = dist; closestIdx = idx; }
    });
    const colRect = cols[closestIdx].getBoundingClientRect();
    const y = e.clientY - colRect.top - draggingEvent.offsetY;
    setDragPos({ dayIdx: closestIdx, top: Math.max(0, y) });
  }, [draggingEvent]);

  const handleDragEnd = useCallback(() => {
    if (draggingEvent && dragPos && onEventDrop) {
      const newDay = weekDays[dragPos.dayIdx];
      const newStartMins = yToMinutes(dragPos.top);
      const duration = differenceInMinutes(parseISO(draggingEvent.event.end_time), parseISO(draggingEvent.event.start_time));
      const newStart = setMinutes(setHours(newDay, Math.floor(newStartMins / 60)), newStartMins % 60);
      const newEnd = addMinutes(newStart, duration);
      onEventDrop(draggingEvent.event.id, newStart, newEnd);
    }
    setDraggingEvent(null);
    setDragPos(null);
  }, [draggingEvent, dragPos, onEventDrop, weekDays, yToMinutes]);

  // All-day events
  const allDayEvents = useMemo(() =>
    weekDays.map(day => events.filter(e => isSameDay(parseISO(e.start_time), day) && e.is_all_day)),
    [weekDays, events]
  );
  const hasAllDay = allDayEvents.some(d => d.length > 0);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden min-h-0"
      onMouseMove={(e) => { handleMouseMove(e); handleDragMove(e); }}
      onMouseUp={() => { handleMouseUp(); handleDragEnd(); }}
      onMouseLeave={() => { handleMouseUp(); handleDragEnd(); }}
      onContextMenu={(e) => { if (draggingEvent) e.preventDefault(); }}
    >
      {/* Day headers */}
      <div className="flex border-b border-border sticky top-0 z-10 bg-card">
        <div className="w-14 flex-shrink-0" />
        {weekDays.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={`flex-1 text-center py-2 border-l border-border/60 ${today ? 'bg-primary/[0.03]' : ''}`}
            >
              <div className={`text-[10px] uppercase tracking-widest font-semibold ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-lg font-bold w-9 h-9 mx-auto flex items-center justify-center rounded-full mt-0.5 transition-colors ${
                  today ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {hasAllDay && (
        <div className="flex border-b border-border bg-card">
          <div className="w-14 flex-shrink-0 flex items-center justify-end pr-2">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase">All day</span>
          </div>
          {weekDays.map((day, i) => (
            <div key={i} className="flex-1 border-l border-border/60 p-1 min-h-[28px]">
              {allDayEvents[i].map(event => (
                <button
                  key={event.id}
                  data-event
                  className="w-full text-left text-[10px] px-1.5 py-0.5 rounded font-medium truncate mb-0.5"
                  style={{ backgroundColor: `${event.color}20`, color: event.color }}
                  onClick={(e) => onEventClick(event, { x: e.clientX, y: e.clientY })}
                >
                  {event.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative min-h-0">
        <div ref={gridRef} className="flex" style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="w-14 flex-shrink-0 relative">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-[10px] text-muted-foreground/60 font-medium"
                style={{ top: hour * HOUR_HEIGHT - 5 }}
              >
                {hour === 0 ? '' : `${hour === 12 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), day) && !e.is_all_day);
            const layouts = layoutOverlapping(dayEvents);

            return (
              <div
                key={dayIdx}
                data-daycolumn
                className="flex-1 relative border-l border-border/60"
                onMouseDown={(e) => handleMouseDown(dayIdx, e)}
              >
                {/* Hour gridlines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/25"
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  >
                    <div className="absolute w-full border-t border-border/10 border-dashed" style={{ top: HOUR_HEIGHT / 2 }} />
                  </div>
                ))}

                {/* Current time indicator */}
                {isToday(day) && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{ top: now.getHours() * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT }}
                  >
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-[5px] shadow-md shadow-destructive/40 ring-2 ring-card" />
                      <div className="flex-1 h-[2px] bg-destructive/70" />
                    </div>
                  </div>
                )}

                {/* Drag-to-create preview */}
                {dragCreate && dragCreate.dayIdx === dayIdx && (
                  <div
                    className="absolute left-1 right-1 rounded-md bg-primary/15 border-2 border-primary/40 border-dashed z-20 pointer-events-none"
                    style={{
                      top: Math.min(dragCreate.startY, dragCreate.endY),
                      height: Math.abs(dragCreate.endY - dragCreate.startY),
                    }}
                  >
                    <span className="text-[10px] text-primary font-semibold px-1.5 py-0.5">
                      {format(setMinutes(setHours(new Date(), Math.floor(yToMinutes(Math.min(dragCreate.startY, dragCreate.endY)) / 60)), yToMinutes(Math.min(dragCreate.startY, dragCreate.endY)) % 60), 'h:mm a')}
                      {' – '}
                      {format(setMinutes(setHours(new Date(), Math.floor(yToMinutes(Math.max(dragCreate.startY, dragCreate.endY)) / 60)), yToMinutes(Math.max(dragCreate.startY, dragCreate.endY)) % 60), 'h:mm a')}
                    </span>
                  </div>
                )}

                {/* Events with overlap layout */}
                {layouts.map(({ event, column, totalColumns }) => {
                  const start = parseISO(event.start_time);
                  const end = parseISO(event.end_time);
                  const startMinutes = start.getHours() * 60 + start.getMinutes();
                  const duration = differenceInMinutes(end, start);
                  const top = (startMinutes / 60) * HOUR_HEIGHT;
                  const height = Math.max((duration / 60) * HOUR_HEIGHT, 24);
                  const width = `calc(${100 / totalColumns}% - 2px)`;
                  const left = `calc(${(column / totalColumns) * 100}% + 1px)`;

                  const isDragging = draggingEvent?.event.id === event.id;

                  return (
                    <motion.button
                      key={event.id}
                      data-event
                      layout
                      className={`absolute rounded-md px-1.5 py-0.5 text-[11px] overflow-hidden z-10 text-left transition-shadow border-l-[3px] select-none ${
                        isDragging ? 'opacity-40 cursor-grabbing' : 'hover:shadow-lg hover:z-20 cursor-pointer'
                      }`}
                      style={{
                        top,
                        height,
                        width,
                        left,
                        backgroundColor: `${event.color}12`,
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
                          handleEventDragStart(event, dayIdx, e);
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event, { x: e.clientX, y: e.clientY });
                      }}
                    >
                      <div className="font-semibold truncate leading-tight text-[10px]">{event.title}</div>
                      {height > 30 && (
                        <div className="text-[9px] opacity-60 leading-tight">
                          {format(start, 'h:mm a')}
                        </div>
                      )}
                    </motion.button>
                  );
                })}

                {/* Drag ghost */}
                {draggingEvent && dragPos && dragPos.dayIdx === dayIdx && (
                  <div
                    className="absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-[11px] z-50 pointer-events-none border-l-[3px] opacity-70 shadow-xl"
                    style={{
                      top: dragPos.top,
                      height: Math.max((differenceInMinutes(parseISO(draggingEvent.event.end_time), parseISO(draggingEvent.event.start_time)) / 60) * HOUR_HEIGHT, 24),
                      backgroundColor: `${draggingEvent.event.color}20`,
                      borderLeftColor: draggingEvent.event.color,
                      color: draggingEvent.event.color,
                    }}
                  >
                    <div className="font-semibold truncate leading-tight text-[10px]">{draggingEvent.event.title}</div>
                    <div className="text-[9px] opacity-60">
                      {format(setMinutes(setHours(new Date(), Math.floor(yToMinutes(dragPos.top) / 60)), yToMinutes(dragPos.top) % 60), 'h:mm a')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
