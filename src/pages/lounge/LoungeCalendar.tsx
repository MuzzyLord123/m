import { useState, useMemo, useCallback, useEffect } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { PageHeader, SkeletonBlock } from '@/components/platform';
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync';
import { GoogleCalendarSyncBar } from '@/components/calendar/GoogleCalendarSyncBar';
import {
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addYears, subYears, setHours, setMinutes,
} from 'date-fns';
import { useCalendarEvents, type CreateEventData, type CalendarEvent } from '@/hooks/useCalendarEvents';
import { CalendarHeader, type CalendarViewMode } from '@/components/calendar/CalendarHeader';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { AgendaView } from '@/components/calendar/AgendaView';
import { YearView } from '@/components/calendar/YearView';
import { EventDialog } from '@/components/calendar/EventDialog';
import { EventPopover } from '@/components/calendar/EventPopover';
import { MiniCalendar } from '@/components/calendar/MiniCalendar';
import { AnimatePresence } from 'framer-motion';
import { useSwipe } from '@/hooks/useTouch';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export default function LoungeCalendar() {
  const { events, loading, createEvent, updateEvent, deleteEvent, refetch } = useCalendarEvents();
  const { isConnected: isGcalConnected, hasCredentials, syncStatus, syncMessage, lastSyncedAt, importEvents, pushEvent, autoSync, startAuth } = useGoogleCalendarSync();

  // Auto-sync Google Calendar on first load
  useEffect(() => {
    if (isGcalConnected) {
      autoSync(refetch);
    }
  }, [isGcalConnected, autoSync, refetch]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const [mobileEventSheet, setMobileEventSheet] = useState<CalendarEvent | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();
  const [defaultHour, setDefaultHour] = useState<number | undefined>();
  const [defaultEndHour, setDefaultEndHour] = useState<number | undefined>();

  // Event popover state
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      e => e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const navigate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      if (direction === 'today') { setCurrentDate(new Date()); return; }
      setCurrentDate(prev => {
        if (viewMode === 'year') return direction === 'next' ? addYears(prev, 1) : subYears(prev, 1);
        if (viewMode === 'month') return direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
        if (viewMode === 'week') return direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1);
        return direction === 'next' ? addDays(prev, 1) : subDays(prev, 1);
      });
    },
    [viewMode]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'n': case 'c': handleCreateNew(); break;
        case 't': navigate('today'); break;
        case 'd': setViewMode('day'); break;
        case 'w': setViewMode('week'); break;
        case 'm': setViewMode('month'); break;
        case 'y': setViewMode('year'); break;
        case 'a': setViewMode('agenda'); break;
        case '/': e.preventDefault(); break; // Let search handle it
        case 'ArrowLeft': if (!e.shiftKey) navigate('prev'); break;
        case 'ArrowRight': if (!e.shiftKey) navigate('next'); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const handleDateClick = (date: Date) => {
    setPopoverEvent(null);
    setSelectedEvent(null);
    setDefaultDate(date);
    setDefaultHour(9);
    setDefaultEndHour(undefined);
    setDialogOpen(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setPopoverEvent(null);
    setSelectedEvent(null);
    setDefaultDate(date);
    setDefaultHour(hour);
    setDefaultEndHour(undefined);
    setDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, pos?: { x: number; y: number }) => {
    if (pos) {
      setPopoverEvent(event);
      setPopoverPos(pos);
    } else {
      setSelectedEvent(event);
      setDialogOpen(true);
    }
  };

  const handleEventClickLegacy = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleEditFromPopover = (event: CalendarEvent) => {
    setPopoverEvent(null);
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleDeleteFromPopover = (id: string) => {
    deleteEvent(id);
    setPopoverEvent(null);
  };

  const handleCreateNew = () => {
    setPopoverEvent(null);
    setSelectedEvent(null);
    setDefaultDate(currentDate);
    setDefaultHour(undefined);
    setDefaultEndHour(undefined);
    setDialogOpen(true);
  };

  const handleSave = async (data: CreateEventData) => {
    if (selectedEvent) {
      await updateEvent(selectedEvent.id, data);
      // Push update to Google Calendar
      if (isGcalConnected) pushEvent({ ...data, id: selectedEvent.id });
    } else {
      const created = await createEvent(data);
      // Push new event to Google Calendar
      if (isGcalConnected && created) pushEvent(created);
    }
  };

  // Drag-to-reschedule handler
  const handleEventDrop = useCallback(async (eventId: string, newStart: Date, newEnd: Date) => {
    await updateEvent(eventId, {
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    });
  }, [updateEvent]);

  // Drag-to-create handler
  const handleDragCreate = useCallback((date: Date, startHour: number, endHour: number) => {
    setPopoverEvent(null);
    setSelectedEvent(null);
    setDefaultDate(date);
    setDefaultHour(startHour);
    setDefaultEndHour(endHour);
    setDialogOpen(true);
  }, []);

  // Mini calendar date select
  const handleMiniDateSelect = (date: Date) => {
    setCurrentDate(date);
    if (viewMode === 'year') setViewMode('day');
  };

  // Year view date click
  const handleYearDateClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  // Swipe navigation for mobile
  const swipeHandlers = useSwipe(
    () => navigate('next'),  // swipe left = next
    () => navigate('prev'),  // swipe right = prev
  );

  // On mobile, event clicks open bottom sheet instead of popover
  const handleEventClickMobile = (event: CalendarEvent) => {
    if (isMobile) {
      setMobileEventSheet(event);
    } else {
      setSelectedEvent(event);
      setDialogOpen(true);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]" {...(isMobile ? swipeHandlers : {})}>
      {/* Mini calendar sidebar (desktop only) */}
      {sidebarOpen && (
        <div className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-border/60 bg-card p-4 space-y-5">
          <MiniCalendar
            currentDate={currentDate}
            selectedDate={currentDate}
            onSelectDate={handleMiniDateSelect}
            events={events}
          />

          {/* Upcoming events sidebar */}
          <div>
            <h4 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Upcoming</h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {events
                .filter(e => new Date(e.start_time) >= new Date())
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .slice(0, 5)
                .map(event => (
                  <button
                    key={event.id}
                    className="w-full text-left flex items-start gap-2 p-1.5 rounded-md hover:bg-foreground/[0.03] transition-colors duration-150 group touch-target"
                    onClick={() => handleEventClickLegacy(event)}
                  >
                    <div className="w-1 h-full min-h-[24px] rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: event.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-foreground truncate">
                        {event.title}
                      </div>
                      <div className="font-mono text-[9.5px] tabular-nums text-muted-foreground">
                        {event.is_all_day
                          ? new Date(event.start_time).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
                          : new Date(event.start_time).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) + ' · ' +
                            new Date(event.start_time).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
                        }
                      </div>
                    </div>
                  </button>
                ))
              }
              {events.filter(e => new Date(e.start_time) >= new Date()).length === 0 && (
                <p className="text-[10px] text-muted-foreground/60">No upcoming events</p>
              )}
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-auto pt-3 border-t border-border/60">
            <p className="font-mono text-[9px] text-muted-foreground/70">
              <kbd className="rounded bg-foreground/[0.05] px-1">N</kbd> new · <kbd className="rounded bg-foreground/[0.05] px-1">T</kbd> today · <kbd className="rounded bg-foreground/[0.05] px-1">D</kbd> <kbd className="rounded bg-foreground/[0.05] px-1">W</kbd> <kbd className="rounded bg-foreground/[0.05] px-1">M</kbd> views
            </p>
          </div>
        </div>
      )}

      {/* Main calendar area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 lg:px-6 pt-3 lg:pt-5 space-y-2 lg:space-y-3">
           <div className="flex items-center justify-between">
              <PageHeader
                kicker="Portal"
                title="Calendar"
                description="Schedule and manage your events."
              />
            </div>
            <GoogleCalendarSyncBar
              isConnected={isGcalConnected}
              hasCredentials={hasCredentials}
              syncStatus={syncStatus}
              syncMessage={syncMessage}
              lastSyncedAt={lastSyncedAt}
              onSync={() => importEvents(refetch)}
              onAuthorize={startAuth}
            />
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onNavigate={navigate}
            onCreateEvent={handleCreateNew}
            onSearch={setSearchQuery}
          />
        </div>

        {/* Calendar view */}
        <div className="flex-1 min-h-0 overflow-hidden mx-2 lg:mx-6 border border-border/60 rounded-[10px] bg-card flex flex-col">
          {loading ? (
            <div className="flex-1 p-4" aria-hidden>
              <SkeletonBlock className="h-full rounded-lg" />
            </div>
          ) : (
            <>
              {viewMode === 'month' && (
                <MonthView currentDate={currentDate} events={filteredEvents} onDateClick={handleDateClick} onEventClick={isMobile ? handleEventClickMobile : handleEventClickLegacy} />
              )}
              {viewMode === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventClick={isMobile ? (e) => handleEventClickMobile(e) : handleEventClick}
                  onEventDrop={handleEventDrop}
                  onDragCreate={handleDragCreate}
                />
              )}
              {viewMode === 'day' && (
                <DayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventClick={isMobile ? (e) => handleEventClickMobile(e) : handleEventClick}
                  onEventDrop={handleEventDrop}
                  onDragCreate={handleDragCreate}
                />
              )}
              {viewMode === 'year' && (
                <YearView currentDate={currentDate} events={filteredEvents} onDateClick={handleYearDateClick} />
              )}
              {viewMode === 'agenda' && (
                <AgendaView currentDate={currentDate} events={filteredEvents} onEventClick={isMobile ? handleEventClickMobile : handleEventClickLegacy} />
              )}
            </>
          )}
        </div>

      </div>

      {/* Mobile FAB for quick event creation */}
      <FloatingActionButton
        onClick={handleCreateNew}
        icon={<Plus className="w-6 h-6" />}
      />

      {/* Mobile event bottom sheet */}
      <BottomSheet
        open={!!mobileEventSheet}
        onClose={() => setMobileEventSheet(null)}
        title={mobileEventSheet?.title || 'Event'}
        height="auto"
      >
        {mobileEventSheet && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mobileEventSheet.color }} />
              <span className="text-sm font-medium">{mobileEventSheet.title}</span>
            </div>
            {mobileEventSheet.description && (
              <p className="text-sm text-muted-foreground">{mobileEventSheet.description}</p>
            )}
            <div className="text-xs tabular-nums text-muted-foreground">
              {new Date(mobileEventSheet.start_time).toLocaleString('en-GB')} to {new Date(mobileEventSheet.end_time).toLocaleString('en-GB')}
            </div>
            {mobileEventSheet.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {mobileEventSheet.location}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setMobileEventSheet(null);
                  setSelectedEvent(mobileEventSheet);
                  setDialogOpen(true);
                }}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium touch-target"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  deleteEvent(mobileEventSheet.id);
                  setMobileEventSheet(null);
                }}
                className="px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium touch-target"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Event Popover (desktop) */}
      <AnimatePresence>
        {popoverEvent && !isMobile && (
          <EventPopover
            event={popoverEvent}
            position={popoverPos}
            onClose={() => setPopoverEvent(null)}
            onEdit={handleEditFromPopover}
            onDelete={handleDeleteFromPopover}
          />
        )}
      </AnimatePresence>

      {/* Event Dialog */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        defaultEndHour={defaultEndHour}
        onSave={handleSave}
        onDelete={deleteEvent}
      />
    </div>
  );
}
