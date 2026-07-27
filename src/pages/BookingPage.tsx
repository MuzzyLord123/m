import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CalendarDays, Clock, CheckCircle2, Loader2, ArrowLeft, User, ChevronRight, MessageSquare, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

type BookingMode = 'appointment' | 'enquiry' | 'table' | 'order';

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const brandParam = searchParams.get('brand');
  const modeParam = (searchParams.get('mode') || 'appointment') as BookingMode;

  const [mode, setMode] = useState<BookingMode>(modeParam);
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '', notes: '',
    // Enquiry
    subject: '', message: '', company: '',
    // Table
    party_size: '2', special_requests: '',
  });

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const [settRes, servRes] = await Promise.all([
        supabase.functions.invoke('booking-api', { body: { action: 'get-settings', slug } }),
        supabase.functions.invoke('booking-api', { body: { action: 'get-services', slug } }),
      ]);
      if (settRes.data?.settings) setSettings(settRes.data.settings);
      if (servRes.data?.services) setServices(servRes.data.services);
      setLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!selectedService || !slug) return;
    supabase.functions.invoke('booking-api', {
      body: { action: 'get-staff', slug, service_id: selectedService.id },
    }).then(res => { if (res.data?.staff) setStaffList(res.data.staff); });
  }, [selectedService, slug]);

  useEffect(() => {
    if (!selectedDate || !slug || !selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    supabase.functions.invoke('booking-api', {
      body: { action: 'get-slots', slug, date: format(selectedDate, 'yyyy-MM-dd'), service_id: selectedService.id, staff_id: selectedStaff?.id || null },
    }).then(res => { setSlots(res.data?.slots || []); setLoadingSlots(false); });
  }, [selectedDate, slug, selectedService, selectedStaff]);

  const brandColor = brandParam || settings?.branding_color || '#3b82f6';

  const handleSubmit = async () => {
    setBooking(true);
    try {
      let res;
      if (mode === 'appointment') {
        res = await supabase.functions.invoke('booking-api', {
          body: {
            action: 'create-booking', slug,
            service_id: selectedService?.id,
            staff_id: selectedStaff?.id || null,
            date: format(selectedDate!, 'yyyy-MM-dd'),
            start_time: selectedSlot,
            customer_name: form.customer_name,
            customer_email: form.customer_email,
            customer_phone: form.customer_phone,
            notes: form.notes,
            source: 'hosted_page',
            booking_type: 'appointment',
          },
        });
      } else if (mode === 'enquiry') {
        res = await supabase.functions.invoke('booking-api', {
          body: {
            action: 'submit-enquiry', slug,
            customer_name: form.customer_name,
            customer_email: form.customer_email,
            customer_phone: form.customer_phone,
            subject: form.subject,
            message: form.message,
            company: form.company,
            source: 'hosted_page',
          },
        });
      } else if (mode === 'table') {
        res = await supabase.functions.invoke('booking-api', {
          body: {
            action: 'book-table', slug,
            customer_name: form.customer_name,
            customer_email: form.customer_email,
            customer_phone: form.customer_phone,
            date: format(selectedDate!, 'yyyy-MM-dd'),
            time: selectedSlot,
            party_size: form.party_size,
            notes: form.notes,
            special_requests: form.special_requests,
            source: 'hosted_page',
          },
        });
      }
      if (res?.data?.error) throw new Error(res.data.error);
      setConfirmed(true);
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="text-center space-y-3 max-w-sm px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
            <CalendarDays className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Not Found</h1>
          <p className="text-gray-500 text-sm">This booking page doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    const confirmMessages: Record<BookingMode, string> = {
      appointment: 'Your appointment has been confirmed!',
      enquiry: 'Your enquiry has been received. We\'ll be in touch shortly.',
      table: 'Your table has been reserved!',
      order: 'Your order has been placed!',
    };
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <div className="max-w-md mx-auto p-8 text-center space-y-5 bg-white rounded-3xl shadow-xl border border-gray-100 mx-4">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor + '15' }}>
            <CheckCircle2 className="h-10 w-10" style={{ color: brandColor }} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{mode === 'enquiry' ? 'Enquiry Sent!' : mode === 'table' ? 'Table Reserved!' : 'Booking Confirmed!'}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{settings.confirmation_message || confirmMessages[mode]}</p>
          {mode === 'appointment' && selectedDate && selectedSlot && (
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700">
              <p className="font-medium">{selectedService?.name}</p>
              <p>{format(selectedDate, 'EEEE, dd MMMM yyyy')} at {selectedSlot}</p>
            </div>
          )}
          {mode === 'table' && selectedDate && selectedSlot && (
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700">
              <p className="font-medium">Table for {form.party_size}</p>
              <p>{format(selectedDate, 'EEEE, dd MMMM yyyy')} at {selectedSlot}</p>
            </div>
          )}
          <Button
            className="w-full h-12 rounded-xl font-semibold text-sm"
            onClick={() => { setConfirmed(false); setStep(1); setSelectedService(null); setSelectedStaff(null); setSelectedDate(undefined); setSelectedSlot(null); setForm({ customer_name: '', customer_email: '', customer_phone: '', notes: '', subject: '', message: '', company: '', party_size: '2', special_requests: '' }); }}
            style={{ backgroundColor: brandColor, color: '#fff' }}
          >
            {mode === 'enquiry' ? 'Send Another' : 'Book Again'}
          </Button>
        </div>
      </div>
    );
  }

  const modes: { key: BookingMode; label: string; icon: typeof CalendarDays }[] = [
    { key: 'appointment', label: 'Appointment', icon: CalendarDays },
    { key: 'enquiry', label: 'Enquiry', icon: MessageSquare },
    { key: 'table', label: 'Table', icon: UtensilsCrossed },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          {settings.branding_logo && <img src={settings.branding_logo} alt="" className="h-7 sm:h-8 object-contain" />}
          <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{settings.business_name || 'Book'}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-8 sm:pb-12">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1">
          {modes.map(m => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setStep(1); setSelectedService(null); setSelectedDate(undefined); setSelectedSlot(null); }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0"
                style={{
                  backgroundColor: active ? brandColor : '#fff',
                  color: active ? '#fff' : '#6b7280',
                  border: `1.5px solid ${active ? brandColor : '#e5e7eb'}`,
                  boxShadow: active ? `0 4px 14px ${brandColor}30` : 'none',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* ═══ ENQUIRY MODE ═══ */}
          {mode === 'enquiry' && (
            <div className="p-5 sm:p-8 space-y-4 sm:space-y-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Send an Enquiry</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">We'll get back to you as soon as possible</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Full Name *</Label><Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} placeholder="Your name" className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Email *</Label><Input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} placeholder="you@email.com" className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Phone</Label><Input type="tel" value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} placeholder="+44..." className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Company</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="What's this about?" className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Message *</Label><Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4} placeholder="Tell us more..." className="rounded-xl border-gray-200 text-sm resize-none" /></div>
              <Button
                className="w-full h-11 sm:h-12 rounded-xl font-semibold text-sm"
                disabled={!form.customer_name || !form.customer_email || !form.message || booking}
                onClick={handleSubmit}
                style={{ backgroundColor: brandColor, color: '#fff' }}
              >
                {booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                {booking ? 'Sending...' : 'Send Enquiry'}
              </Button>
            </div>
          )}

          {/* ═══ TABLE BOOKING MODE ═══ */}
          {mode === 'table' && step === 1 && (
            <div className="p-5 sm:p-8 space-y-4 sm:space-y-5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Reserve a Table</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Choose your date, time, and party size</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Name *</Label><Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Phone *</Label><Input type="tel" value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Email</Label><Input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-600">Party Size *</Label>
                  <Select value={form.party_size} onValueChange={v => setForm(p => ({ ...p, party_size: v }))}>
                    <SelectTrigger className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,10,12,15,20].map(n => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'Guest' : 'Guests'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Special Requests</Label><Textarea value={form.special_requests} onChange={e => setForm(p => ({ ...p, special_requests: e.target.value }))} rows={2} placeholder="Allergies, accessibility needs, celebrations..." className="rounded-xl border-gray-200 text-sm resize-none" /></div>
              <Button
                className="w-full h-11 sm:h-12 rounded-xl font-semibold text-sm"
                disabled={!form.customer_name || !form.customer_phone}
                onClick={() => setStep(2)}
                style={{ backgroundColor: brandColor, color: '#fff' }}
              >
                Choose Date & Time <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {mode === 'table' && step === 2 && (
            <div className="p-5 sm:p-8 space-y-4 sm:space-y-5">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Date & Time</h2>
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                <div className="flex justify-center"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))} className="rounded-xl border" /></div>
                {selectedDate && (
                  <div className="flex-1 space-y-3">
                    <p className="font-medium text-sm text-gray-900"><CalendarDays className="inline h-4 w-4 mr-1" />{format(selectedDate, 'EEEE, dd MMMM')}</p>
                    {loadingSlots ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                    : slots.length === 0 ? <p className="text-center py-6 text-sm text-gray-500">No availability</p>
                    : (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map(slot => (
                          <button key={slot} onClick={() => setSelectedSlot(slot)} className="py-2.5 px-2 rounded-xl text-sm font-medium border transition-all" style={selectedSlot === slot ? { backgroundColor: brandColor, borderColor: brandColor, color: '#fff' } : { borderColor: '#e5e7eb', color: '#374151' }}>
                            <Clock className="inline h-3 w-3 mr-1" />{slot}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSlot && (
                      <Button className="w-full h-11 sm:h-12 rounded-xl font-semibold text-sm mt-4" onClick={handleSubmit} disabled={booking} style={{ backgroundColor: brandColor, color: '#fff' }}>
                        {booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UtensilsCrossed className="h-4 w-4 mr-2" />}
                        {booking ? 'Reserving...' : `Reserve Table for ${form.party_size}`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ APPOINTMENT MODE ═══ */}
          {mode === 'appointment' && (
            <>
              {/* Steps indicator */}
              <div className="px-5 sm:px-8 pt-5 sm:pt-6">
                <div className="flex items-center gap-1 sm:gap-2">
                  {['Service', 'Date & Time', 'Details', 'Confirm'].map((label, i) => (
                    <div key={label} className="flex items-center gap-1 sm:gap-2">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all" style={{ backgroundColor: step >= i + 1 ? brandColor : '#f3f4f6', color: step >= i + 1 ? '#fff' : '#9ca3af' }}>{i + 1}</span>
                      <span className={`text-[10px] sm:text-xs font-medium hidden sm:inline ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                      {i < 3 && <ChevronRight className="h-3 w-3 text-gray-300" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-8 space-y-4 sm:space-y-5">
                {/* Step 1: Service */}
                {step === 1 && (
                  <div className="space-y-3 sm:space-y-4">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select a Service</h2>
                    {services.length === 0 ? <p className="text-gray-500 text-center py-8 text-sm">No services available</p> : (
                      <div className="space-y-2 sm:space-y-3">
                        {services.map(service => (
                          <button key={service.id} onClick={() => { setSelectedService(service); setStep(2); }}
                            className="w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 hover:shadow-md transition-all group"
                            style={{ borderColor: selectedService?.id === service.id ? brandColor : '#f3f4f6' }}>
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: service.color }} /><span className="font-semibold text-sm text-gray-900 truncate">{service.name}</span></div>
                                {service.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2 ml-[18px]">{service.description}</p>}
                                <div className="flex items-center gap-3 mt-2 ml-[18px]">
                                  <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{service.duration_minutes} min</span>
                                  <span className="text-xs font-bold" style={{ color: service.price > 0 ? brandColor : '#059669' }}>{service.price > 0 ? `${service.currency} ${service.price}` : 'Free'}</span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition shrink-0 ml-2" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Date & Time */}
                {step === 2 && (
                  <div className="space-y-3 sm:space-y-4">
                    <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                    {staffList.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-medium text-gray-600">Preferred Staff</h3>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <button onClick={() => setSelectedStaff(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!selectedStaff ? 'text-white' : 'border-gray-200 text-gray-600'}`} style={!selectedStaff ? { backgroundColor: brandColor, borderColor: brandColor } : {}}>First Available</button>
                          {staffList.map(s => (
                            <button key={s.id} onClick={() => setSelectedStaff(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${selectedStaff?.id === s.id ? 'text-white' : 'border-gray-200 text-gray-600'}`} style={selectedStaff?.id === s.id ? { backgroundColor: brandColor, borderColor: brandColor } : {}}>
                              <User className="h-3 w-3" /> {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                      <div className="flex justify-center"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))} className="rounded-xl border" /></div>
                      {selectedDate && (
                        <div className="flex-1 space-y-3">
                          <p className="font-medium text-sm text-gray-900"><CalendarDays className="inline h-4 w-4 mr-1" />{format(selectedDate, 'EEEE, dd MMMM')}</p>
                          {loadingSlots ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                          : slots.length === 0 ? <p className="text-center py-6 text-sm text-gray-500">No available slots</p>
                          : (
                            <div className="grid grid-cols-3 gap-2">
                              {slots.map(slot => (
                                <button key={slot} onClick={() => { setSelectedSlot(slot); setStep(3); }} className="py-2.5 px-2 rounded-xl text-sm font-medium border transition-all hover:shadow-sm" style={selectedSlot === slot ? { backgroundColor: brandColor, borderColor: brandColor, color: '#fff' } : { borderColor: '#e5e7eb', color: '#374151' }}>
                                  <Clock className="inline h-3 w-3 mr-1" />{slot}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                  <div className="space-y-3 sm:space-y-4">
                    <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Name *</Label><Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Email *</Label><Input type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Phone</Label><Input type="tel" value={form.customer_phone} onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))} className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-600">Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-10 sm:h-11 rounded-xl border-gray-200 text-sm" placeholder="Anything we should know?" /></div>
                    </div>
                    <Button className="w-full h-11 sm:h-12 rounded-xl font-semibold text-sm" disabled={!form.customer_name || !form.customer_email} onClick={() => setStep(4)} style={{ backgroundColor: brandColor, color: '#fff' }}>
                      Review Booking <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Step 4: Confirm */}
                {step === 4 && (
                  <div className="space-y-3 sm:space-y-4">
                    <button onClick={() => setStep(3)} className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium"><ArrowLeft className="h-3.5 w-3.5" /> Back</button>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Confirm Booking</h2>
                    <div className="rounded-2xl p-4 sm:p-5 space-y-3" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                      {[
                        ['Service', selectedService?.name],
                        selectedStaff ? ['Staff', selectedStaff.name] : null,
                        ['Date', selectedDate && format(selectedDate, 'EEE, dd MMM yyyy')],
                        ['Time', `${selectedSlot} (${selectedService?.duration_minutes} min)`],
                        ['Price', selectedService?.price > 0 ? `${selectedService.currency} ${selectedService.price}` : 'Free'],
                      ].filter(Boolean).map(([label, value]) => (
                        <div key={label as string} className="flex justify-between text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 pt-3 space-y-1">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="text-gray-900">{form.customer_name}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="text-gray-900">{form.customer_email}</span></div>
                      </div>
                    </div>
                    <Button className="w-full h-11 sm:h-12 rounded-xl font-semibold text-sm" onClick={handleSubmit} disabled={booking} style={{ backgroundColor: brandColor, color: '#fff' }}>
                      {booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {booking ? 'Confirming...' : 'Confirm Booking'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-3 sm:py-4 text-[10px] sm:text-xs text-gray-400">Powered by <span className="font-semibold">Quooro</span></div>
    </div>
  );
}
