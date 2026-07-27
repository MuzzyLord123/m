import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStorefront } from '@/contexts/StorefrontContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { CalendarDays, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Slot {
  time: string;
  available: boolean;
}

export function BookingWidget({ siteId }: { siteId: string }) {
  const { visitor, setAuthOpen } = useStorefront();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotDuration, setSlotDuration] = useState(60);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState({
    service_name: '',
    customer_name: visitor?.name || '',
    customer_email: visitor?.email || '',
    customer_phone: '',
    notes: '',
  });

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      const { data, error } = await supabase.functions.invoke('site-booking', {
        body: {
          action: 'get-slots',
          site_id: siteId,
          date: format(selectedDate, 'yyyy-MM-dd'),
        },
      });
      if (data?.slots) {
        setSlots(data.slots);
        setSlotDuration(data.slot_duration || 60);
      } else {
        setSlots([]);
      }
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [selectedDate, siteId]);

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !form.service_name) return;
    setBooking(true);
    try {
      const { data, error } = await supabase.functions.invoke('site-booking', {
        body: {
          action: 'create',
          site_id: siteId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedSlot,
          service_name: form.service_name,
          duration_minutes: slotDuration,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          notes: form.notes,
          visitor_id: visitor?.id || null,
        },
      });
      if (data?.error) throw new Error(data.error);
      setConfirmed(true);
      toast({ title: 'Booking confirmed!', description: `${format(selectedDate, 'EEE, dd MMM')} at ${selectedSlot}` });
    } catch (err: any) {
      toast({ title: 'Booking failed', description: err.message, variant: 'destructive' });
    } finally {
      setBooking(false);
    }
  };

  if (confirmed) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
        <h3 className="text-xl font-bold">Booking Confirmed!</h3>
        <p className="text-muted-foreground">
          {form.service_name} on {selectedDate && format(selectedDate, 'EEEE, dd MMMM yyyy')} at {selectedSlot}
        </p>
        <Button onClick={() => { setConfirmed(false); setStep(1); setSelectedDate(undefined); setSelectedSlot(null); }}>
          Book Another
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <CalendarDays className="h-6 w-6" /> Book an Appointment
      </h2>

      {/* Step 1: Service & Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Service</Label>
            <Input placeholder="e.g. Haircut, Consultation..." value={form.service_name} onChange={e => setForm(p => ({ ...p, service_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Phone (optional)</Label>
            <Input type="tel" value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
          <Button className="w-full" disabled={!form.service_name || !form.customer_name || !form.customer_email} onClick={() => setStep(2)}>
            Choose Date & Time
          </Button>
        </div>
      )}

      {/* Step 2: Date picker */}
      {step === 2 && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← Back</Button>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); if (d) setStep(3); }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border"
            />
          </div>
        </div>
      )}

      {/* Step 3: Time slots */}
      {step === 3 && selectedDate && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep(2)}>← Back</Button>
          <p className="font-medium">
            <CalendarDays className="inline h-4 w-4 mr-1" />
            {format(selectedDate, 'EEEE, dd MMMM yyyy')}
          </p>

          {loadingSlots ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : slots.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No available slots on this date</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(slot => (
                <Button
                  key={slot}
                  variant={selectedSlot === slot ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSlot(slot)}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" /> {slot}
                </Button>
              ))}
            </div>
          )}

          {selectedSlot && (
            <div className="space-y-3 pt-4 border-t">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium">{form.service_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(selectedDate, 'EEE, dd MMM')} at {selectedSlot} ({slotDuration} min)
                </p>
              </div>
              <Button className="w-full" onClick={handleBook} disabled={booking}>
                {booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {booking ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
