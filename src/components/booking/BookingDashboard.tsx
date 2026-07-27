import { useState } from 'react';
import { useBookingSystem, Booking, BookingService, BookingStaff } from '@/hooks/useBookingSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  CalendarDays, Clock, Plus, Pencil, Trash2, Users, Settings2, BarChart3,
  Loader2, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink, Code, Key,
} from 'lucide-react';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { BookingCalendarView } from './BookingCalendarView';
import { BookingEmbedPanel } from './BookingEmbedPanel';
import { BookingAnalytics } from './BookingAnalytics';
import { BookingAPIPanel } from './BookingAPIPanel';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookingDashboard() {
  const bs = useBookingSystem();
  const [activeTab, setActiveTab] = useState('calendar');

  if (bs.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LoungePageHeader
        title="Booking System"
        description="Manage appointments, services, and staff"
        icon={CalendarDays}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="calendar" className="text-xs sm:text-sm"><CalendarDays className="h-3.5 w-3.5 mr-1" /><span className="hidden xs:inline">Calendar</span><span className="xs:hidden">Cal</span></TabsTrigger>
            <TabsTrigger value="services" className="text-xs sm:text-sm"><Clock className="h-3.5 w-3.5 mr-1" />Services</TabsTrigger>
            <TabsTrigger value="staff" className="text-xs sm:text-sm"><Users className="h-3.5 w-3.5 mr-1" />Staff</TabsTrigger>
            <TabsTrigger value="availability" className="text-xs sm:text-sm"><Settings2 className="h-3.5 w-3.5 mr-1" />Hours</TabsTrigger>
            <TabsTrigger value="embed" className="text-xs sm:text-sm"><Code className="h-3.5 w-3.5 mr-1" />Embed</TabsTrigger>
            <TabsTrigger value="api" className="text-xs sm:text-sm"><Key className="h-3.5 w-3.5 mr-1" />API</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm"><BarChart3 className="h-3.5 w-3.5 mr-1" />Analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="mt-4">
          <BookingCalendarView bookings={bs.bookings} onStatusChange={bs.updateBookingStatus} />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServicesTab services={bs.services} onCreate={bs.createService} onUpdate={bs.updateService} onDelete={bs.deleteService} />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <StaffTab staff={bs.staff} services={bs.services} onCreate={bs.createStaffMember} onUpdate={bs.updateStaffMember} onDelete={bs.deleteStaffMember} onAssign={bs.assignStaffService} onUnassign={bs.removeStaffService} />
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <AvailabilityTab availability={bs.availability} onAdd={bs.setAvailabilitySlot} onRemove={bs.removeAvailabilitySlot} onBlock={bs.blockDate} settings={bs.settings} onSaveSettings={bs.saveSettings} />
        </TabsContent>

        <TabsContent value="embed" className="mt-4">
          <BookingEmbedPanel settings={bs.settings} onSaveSettings={bs.saveSettings} />
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <BookingAPIPanel />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <BookingAnalytics bookings={bs.bookings} services={bs.services} staff={bs.staff} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Services Tab ──────────────────────────────────────────
function ServicesTab({ services, onCreate, onUpdate, onDelete }: {
  services: BookingService[];
  onCreate: (d: Partial<BookingService>) => void;
  onUpdate: (id: string, d: Partial<BookingService>) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', duration_minutes: 60, buffer_minutes: 0, price: 0, currency: 'GBP', color: '#3b82f6' });

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      onUpdate(editingId, form);
    } else {
      onCreate(form);
    }
    setOpen(false);
    setEditingId(null);
    setForm({ name: '', description: '', duration_minutes: 60, buffer_minutes: 0, price: 0, currency: 'GBP', color: '#3b82f6' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Services</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditingId(null); setForm({ name: '', description: '', duration_minutes: 60, buffer_minutes: 0, price: 0, currency: 'GBP', color: '#3b82f6' }); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'New'} Service</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))} /></div>
                <div><Label>Buffer (min)</Label><Input type="number" value={form.buffer_minutes} onChange={e => setForm(p => ({ ...p, buffer_minutes: parseInt(e.target.value) || 0 }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="GBP">GBP</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Color</Label><Input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="h-10" /></div>
              <Button className="w-full" onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No services yet. Add your first service to start accepting bookings.</div>
      ) : (
        <div className="grid gap-3">
          {services.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.duration_minutes} min · {s.price > 0 ? `${s.currency} ${s.price}` : 'Free'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                <Button variant="ghost" size="icon" onClick={() => { setEditingId(s.id); setForm({ name: s.name, description: s.description || '', duration_minutes: s.duration_minutes, buffer_minutes: s.buffer_minutes, price: Number(s.price), currency: s.currency, color: s.color }); setOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Staff Tab ─────────────────────────────────────────────
function StaffTab({ staff, services, onCreate, onUpdate, onDelete, onAssign, onUnassign }: {
  staff: BookingStaff[];
  services: BookingService[];
  onCreate: (d: Partial<BookingStaff>) => void;
  onUpdate: (id: string, d: Partial<BookingStaff>) => void;
  onDelete: (id: string) => void;
  onAssign: (staffId: string, serviceId: string) => void;
  onUnassign: (staffId: string, serviceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', bio: '' });

  const handleSave = () => {
    if (!form.name.trim()) return;
    onCreate(form);
    setOpen(false);
    setForm({ name: '', email: '', bio: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Staff Members</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Staff</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Staff Member</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={2} /></div>
              <Button className="w-full" onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No staff members yet.</div>
      ) : (
        <div className="grid gap-3">
          {staff.map(s => {
            const assignedIds = s.booking_staff_services?.map(ss => ss.service_id) || [];
            return (
              <div key={s.id} className="p-4 rounded-xl border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      {s.email && <p className="text-sm text-muted-foreground">{s.email}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>

                {services.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {services.map(srv => {
                      const isAssigned = assignedIds.includes(srv.id);
                      return (
                        <button
                          key={srv.id}
                          onClick={() => isAssigned ? onUnassign(s.id, srv.id) : onAssign(s.id, srv.id)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${isAssigned ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/50'}`}
                        >
                          {srv.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Availability Tab ──────────────────────────────────────
function AvailabilityTab({ availability, onAdd, onRemove, onBlock, settings, onSaveSettings }: {
  availability: any[];
  onAdd: (d: any) => void;
  onRemove: (id: string) => void;
  onBlock: (date: string, staffId?: string, reason?: string) => void;
  settings: any;
  onSaveSettings: (d: any) => void;
}) {
  const [addDay, setAddDay] = useState(1);
  const [addStart, setAddStart] = useState('09:00');
  const [addEnd, setAddEnd] = useState('17:00');
  const [blockDateVal, setBlockDateVal] = useState('');

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">Booking Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Business Name</Label>
            <Input defaultValue={settings?.business_name || ''} onBlur={e => onSaveSettings({ business_name: e.target.value })} />
          </div>
          <div>
            <Label>Business Slug (URL)</Label>
            <Input defaultValue={settings?.business_slug || ''} onBlur={e => onSaveSettings({ business_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="my-business" />
          </div>
          <div>
            <Label>Timezone</Label>
            <Input defaultValue={settings?.timezone || 'Europe/London'} onBlur={e => onSaveSettings({ timezone: e.target.value })} />
          </div>
          <div>
            <Label>Max Advance Days</Label>
            <Input type="number" defaultValue={settings?.max_advance_days || 90} onBlur={e => onSaveSettings({ max_advance_days: parseInt(e.target.value) || 90 })} />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={settings?.auto_confirm !== false} onCheckedChange={v => onSaveSettings({ auto_confirm: v })} />
            <Label className="cursor-pointer">Auto-confirm bookings</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={settings?.allow_cancellation !== false} onCheckedChange={v => onSaveSettings({ allow_cancellation: v })} />
            <Label className="cursor-pointer">Allow cancellation</Label>
          </div>
        </div>
      </div>

      {/* Working hours */}
      <div className="rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">Working Hours</h3>
        <div className="flex items-end gap-3">
          <div>
            <Label>Day</Label>
            <Select value={String(addDay)} onValueChange={v => setAddDay(parseInt(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start</Label>
            <Input type="time" value={addStart} onChange={e => setAddStart(e.target.value)} className="w-[120px]" />
          </div>
          <div>
            <Label>End</Label>
            <Input type="time" value={addEnd} onChange={e => setAddEnd(e.target.value)} className="w-[120px]" />
          </div>
          <Button onClick={() => onAdd({ day_of_week: addDay, start_time: addStart, end_time: addEnd })}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="grid gap-2 mt-3">
          {DAY_NAMES.map((day, i) => {
            const daySlots = availability.filter(a => a.day_of_week === i);
            if (daySlots.length === 0) return (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{day}</span>
                <span className="text-xs text-muted-foreground">Closed</span>
              </div>
            );
            return (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border">
                <span className="text-sm font-medium">{day}</span>
                <div className="flex items-center gap-2">
                  {daySlots.map(slot => (
                    <div key={slot.id} className="flex items-center gap-1 text-xs">
                      <span>{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</span>
                      <button onClick={() => onRemove(slot.id)} className="text-destructive hover:text-destructive/80"><XCircle className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Block dates */}
      <div className="rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">Block Dates</h3>
        <div className="flex items-end gap-3">
          <div>
            <Label>Date</Label>
            <Input type="date" value={blockDateVal} onChange={e => setBlockDateVal(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => { if (blockDateVal) { onBlock(blockDateVal); setBlockDateVal(''); } }}>
            Block Date
          </Button>
        </div>
      </div>
    </div>
  );
}
