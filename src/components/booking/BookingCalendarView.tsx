import { useState, useMemo } from 'react';
import { Booking } from '@/hooks/useBookingSystem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfWeek, addDays, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, User, Mail, Phone, FileText, MessageSquare, UtensilsCrossed, ShoppingBag, Search, Filter, Download } from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';
type BookingType = 'all' | 'appointment' | 'enquiry' | 'table' | 'order';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof CalendarDays; color: string }> = {
  appointment: { label: 'Appointment', icon: CalendarDays, color: '#3b82f6' },
  enquiry: { label: 'Enquiry', icon: MessageSquare, color: '#8b5cf6' },
  table: { label: 'Table', icon: UtensilsCrossed, color: '#f59e0b' },
  order: { label: 'Order', icon: ShoppingBag, color: '#10b981' },
};

function getBookingType(b: Booking): string {
  const meta = b.metadata as any;
  return meta?.booking_type || 'appointment';
}

export function BookingCalendarView({ bookings, onStatusChange }: { bookings: Booking[]; onStatusChange: (id: string, status: string) => void }) {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [typeFilter, setTypeFilter] = useState<BookingType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookings = useMemo(() => {
    let filtered = bookings;
    if (typeFilter !== 'all') {
      filtered = filtered.filter(b => getBookingType(b) === typeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.customer_name?.toLowerCase().includes(q) ||
        b.customer_email?.toLowerCase().includes(q) ||
        b.customer_phone?.toLowerCase().includes(q) ||
        b.notes?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [bookings, typeFilter, searchQuery]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getBookingsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredBookings.filter(b => b.booking_date === dateStr && b.status !== 'cancelled');
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 7);

  // Stats
  const stats = useMemo(() => {
    const types = { appointment: 0, enquiry: 0, table: 0, order: 0 };
    const pending = bookings.filter(b => b.status === 'pending').length;
    bookings.forEach(b => {
      const t = getBookingType(b) as keyof typeof types;
      if (types[t] !== undefined) types[t]++;
    });
    return { ...types, pending, total: bookings.length };
  }, [bookings]);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '#6b7280' },
          { label: 'Pending', value: stats.pending, color: '#f59e0b' },
          { label: 'Appointments', value: stats.appointment, color: '#3b82f6' },
          { label: 'Enquiries', value: stats.enquiry, color: '#8b5cf6' },
          { label: 'Tables', value: stats.table, color: '#f59e0b' },
          { label: 'Orders', value: stats.order, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Type Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['all', 'appointment', 'enquiry', 'table', 'order'] as BookingType[]).map(type => {
            const config = type === 'all' ? { label: 'All', color: '#6b7280' } : TYPE_CONFIG[type];
            const active = typeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${active ? 'text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                style={active ? { backgroundColor: config.color } : {}}
              >
                {config.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bookings..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-sm font-semibold min-w-[140px] text-center">
            {view === 'day' && format(currentDate, 'EEE, dd MMM yyyy')}
            {view === 'week' && `${format(weekDays[0], 'dd MMM')} – ${format(weekDays[6], 'dd MMM yyyy')}`}
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as ViewMode[]).map(v => (
            <Button key={v} variant={view === v ? 'default' : 'ghost'} size="sm" className="text-xs h-7 capitalize" onClick={() => setView(v)}>{v}</Button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border bg-border">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="bg-muted px-2 py-1.5 text-xs font-medium text-center text-muted-foreground">{d}</div>
          ))}
          {Array.from({ length: (monthDays[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-card p-2 min-h-[80px]" />
          ))}
          {monthDays.map(day => {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`bg-card p-1.5 min-h-[80px] ${isToday ? 'ring-2 ring-primary/20 ring-inset' : ''}`}>
                <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{format(day, 'd')}</span>
                <div className="mt-1 space-y-0.5">
                  {dayBookings.slice(0, 3).map(b => {
                    const type = getBookingType(b);
                    const config = TYPE_CONFIG[type] || TYPE_CONFIG.appointment;
                    return (
                      <button key={b.id} onClick={() => setSelectedBooking(b)} className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-colors hover:opacity-80" style={{ backgroundColor: config.color + '20', color: config.color }}>
                        {b.start_time?.slice(0, 5)} {b.customer_name?.split(' ')[0] || type}
                      </button>
                    );
                  })}
                  {dayBookings.length > 3 && <span className="text-[10px] text-muted-foreground px-1">+{dayBookings.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-8 text-xs border rounded-xl overflow-hidden">
          <div className="bg-muted p-2" />
          {weekDays.map(d => (
            <div key={d.toISOString()} className={`bg-muted p-2 text-center font-medium ${isSameDay(d, new Date()) ? 'text-primary' : 'text-muted-foreground'}`}>
              <div>{format(d, 'EEE')}</div>
              <div className="text-sm">{format(d, 'd')}</div>
            </div>
          ))}
          {hours.map(h => (
            <div key={h} className="contents">
              <div className="border-t p-1.5 text-muted-foreground bg-card text-right pr-2">{`${h}:00`}</div>
              {weekDays.map(d => {
                const dayBookings = getBookingsForDay(d).filter(b => {
                  const bH = parseInt(b.start_time?.split(':')[0] || '0');
                  return bH === h;
                });
                return (
                  <div key={`${d}-${h}`} className="border-t border-l p-0.5 bg-card min-h-[48px]">
                    {dayBookings.map(b => {
                      const type = getBookingType(b);
                      const config = TYPE_CONFIG[type] || TYPE_CONFIG.appointment;
                      return (
                        <button key={b.id} onClick={() => setSelectedBooking(b)} className="w-full text-left px-1.5 py-1 rounded text-[10px] font-medium truncate mb-0.5 transition-colors hover:opacity-80" style={{ backgroundColor: config.color + '20', color: config.color, borderLeft: `3px solid ${config.color}` }}>
                          {b.customer_name?.split(' ')[0] || type}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {view === 'day' && (
        <div className="border rounded-xl overflow-hidden">
          {hours.map(h => {
            const dayBookings = getBookingsForDay(currentDate).filter(b => parseInt(b.start_time?.split(':')[0] || '0') === h);
            return (
              <div key={h} className="flex border-t">
                <div className="w-16 p-2 text-xs text-muted-foreground text-right pr-3 shrink-0 bg-muted/30">{`${h}:00`}</div>
                <div className="flex-1 p-1 min-h-[52px] space-y-0.5">
                  {dayBookings.map(b => {
                    const type = getBookingType(b);
                    const config = TYPE_CONFIG[type] || TYPE_CONFIG.appointment;
                    const Icon = config.icon;
                    return (
                      <button key={b.id} onClick={() => setSelectedBooking(b)} className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors hover:opacity-80" style={{ backgroundColor: config.color + '10', borderLeft: `3px solid ${config.color}` }}>
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: config.color }} />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-foreground">{b.customer_name || 'Guest'}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{b.start_time?.slice(0, 5)}{b.duration_minutes > 0 ? ` · ${b.duration_minutes}min` : ''}</span>
                        </div>
                        <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${STATUS_COLORS[b.status] || ''}`}>{b.status}</Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent List (below calendar) */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">
          Recent {typeFilter === 'all' ? 'Bookings' : TYPE_CONFIG[typeFilter]?.label + 's'}
          <span className="text-muted-foreground font-normal ml-1">({filteredBookings.length})</span>
        </h3>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {filteredBookings.slice(0, 50).map(b => {
            const type = getBookingType(b);
            const config = TYPE_CONFIG[type] || TYPE_CONFIG.appointment;
            const Icon = config.icon;
            const meta = b.metadata as any;
            return (
              <button key={b.id} onClick={() => setSelectedBooking(b)} className="w-full text-left p-3 rounded-xl border bg-card hover:bg-accent/5 transition-colors flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: config.color + '15' }}>
                  <Icon className="h-4 w-4" style={{ color: config.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{b.customer_name || 'Unknown'}</span>
                    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 shrink-0 ${STATUS_COLORS[b.status] || ''}`}>{b.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{format(parseISO(b.booking_date), 'dd MMM')}</span>
                    {b.duration_minutes > 0 && <span>{b.start_time?.slice(0, 5)}</span>}
                    {meta?.party_size && <span>· {meta.party_size} guests</span>}
                    {meta?.subject && <span className="truncate">· {meta.subject}</span>}
                    <span className="ml-auto text-[10px]" style={{ color: config.color }}>{config.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
          {filteredBookings.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No bookings found</p>}
        </div>
      </div>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          {selectedBooking && (() => {
            const type = getBookingType(selectedBooking);
            const config = TYPE_CONFIG[type] || TYPE_CONFIG.appointment;
            const Icon = config.icon;
            const meta = selectedBooking.metadata as any;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.color + '15' }}>
                      <Icon className="h-4 w-4" style={{ color: config.color }} />
                    </div>
                    <DialogTitle className="text-base">{config.label} Details</DialogTitle>
                    <Badge variant="outline" className={`ml-auto ${STATUS_COLORS[selectedBooking.status] || ''}`}>{selectedBooking.status}</Badge>
                  </div>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                    {selectedBooking.customer_name && <div className="flex items-center gap-2 text-sm"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{selectedBooking.customer_name}</span></div>}
                    {selectedBooking.customer_email && <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{selectedBooking.customer_email}</span></div>}
                    {selectedBooking.customer_phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{selectedBooking.customer_phone}</span></div>}
                  </div>

                  <div className="rounded-xl border p-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{format(parseISO(selectedBooking.booking_date), 'EEE, dd MMM yyyy')}</span></div>
                    {selectedBooking.duration_minutes > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedBooking.start_time?.slice(0, 5)} – {selectedBooking.end_time?.slice(0, 5)}</span></div>
                    )}
                    {selectedBooking.booking_services && <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{(selectedBooking.booking_services as any)?.name}</span></div>}
                    {selectedBooking.booking_staff && <div className="flex justify-between"><span className="text-muted-foreground">Staff</span><span className="font-medium">{(selectedBooking.booking_staff as any)?.name}</span></div>}
                    {meta?.party_size && <div className="flex justify-between"><span className="text-muted-foreground">Party Size</span><span className="font-medium">{meta.party_size} guests</span></div>}
                    {meta?.subject && <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="font-medium">{meta.subject}</span></div>}
                    {meta?.company && <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{meta.company}</span></div>}
                    {selectedBooking.price > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-medium">{selectedBooking.currency} {selectedBooking.price}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span className="font-medium capitalize">{selectedBooking.source?.replace(/_/g, ' ')}</span></div>
                  </div>

                  {selectedBooking.notes && (
                    <div className="rounded-xl bg-muted/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><FileText className="h-3 w-3" /> {type === 'enquiry' ? 'Message' : 'Notes'}</div>
                      <p className="text-sm whitespace-pre-wrap">{selectedBooking.notes}</p>
                    </div>
                  )}

                  {meta?.special_requests && (
                    <div className="rounded-xl bg-muted/50 p-3">
                      <div className="text-xs text-muted-foreground mb-1">Special Requests</div>
                      <p className="text-sm">{meta.special_requests}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {selectedBooking.status === 'pending' && (
                      <>
                        <Button size="sm" className="flex-1" onClick={() => { onStatusChange(selectedBooking.id, 'confirmed'); setSelectedBooking(null); }}>Confirm</Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => { onStatusChange(selectedBooking.id, 'cancelled'); setSelectedBooking(null); }}>Decline</Button>
                      </>
                    )}
                    {selectedBooking.status === 'confirmed' && (
                      <>
                        <Button size="sm" className="flex-1" onClick={() => { onStatusChange(selectedBooking.id, 'completed'); setSelectedBooking(null); }}>Complete</Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => { onStatusChange(selectedBooking.id, 'cancelled'); setSelectedBooking(null); }}>Cancel</Button>
                      </>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
