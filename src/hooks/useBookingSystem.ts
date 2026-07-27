import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BookingService {
  id: string;
  user_id: string;
  site_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  currency: string;
  max_bookings_per_slot: number;
  is_active: boolean;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookingStaff {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  booking_staff_services?: { service_id: string }[];
}

export interface Booking {
  id: string;
  user_id: string;
  service_id: string | null;
  staff_id: string | null;
  site_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: string;
  source: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  notes: string | null;
  price: number;
  currency: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
  booking_services?: { name: string; color: string } | null;
  booking_staff?: { name: string } | null;
}

export interface BookingSettings {
  id: string;
  user_id: string;
  business_name: string | null;
  business_slug: string | null;
  timezone: string;
  booking_page_enabled: boolean;
  embed_enabled: boolean;
  require_payment: boolean;
  auto_confirm: boolean;
  allow_cancellation: boolean;
  cancellation_hours: number;
  allow_reschedule: boolean;
  reschedule_hours: number;
  booking_notice_hours: number;
  max_advance_days: number;
  confirmation_message: string;
  branding_color: string;
  branding_logo: string | null;
  notification_email: boolean;
  notification_sms: boolean;
}

export interface BookingAvailability {
  id: string;
  user_id: string;
  staff_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export function useBookingSystem() {
  const { user } = useAuth();
  const userId = user?.id;

  const [services, setServices] = useState<BookingService[]>([]);
  const [staff, setStaff] = useState<BookingStaff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [availability, setAvailability] = useState<BookingAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);

  const fetchAll = useCallback(async (options?: { withLoader?: boolean }) => {
    const withLoader = options?.withLoader ?? !hasLoadedOnceRef.current;

    if (!userId) {
      setLoading(false);
      return;
    }

    if (withLoader) setLoading(true);

    try {
      const [servRes, staffRes, bookRes, settRes, availRes] = await Promise.all([
        supabase.from('booking_services').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('booking_staff').select('*, booking_staff_services(service_id)').eq('user_id', userId),
        supabase.from('bookings').select('*, booking_services(name, color), booking_staff(name)').eq('user_id', userId).order('booking_date', { ascending: false }).limit(500),
        supabase.from('booking_settings').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('booking_availability').select('*').eq('user_id', userId).order('day_of_week'),
      ]);

      if (servRes.data) setServices(servRes.data as any);
      if (staffRes.data) setStaff(staffRes.data as any);
      if (bookRes.data) setBookings(bookRes.data as any);
      if (settRes.data) setSettings(settRes.data as any);
      if (availRes.data) setAvailability(availRes.data as any);
    } catch (err) {
      console.error('Error fetching booking data:', err);
    } finally {
      hasLoadedOnceRef.current = true;
      if (withLoader) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime subscription for bookings
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${userId}` }, () => {
        fetchAll({ withLoader: false });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAll]);

  // ── Services CRUD ──
  const createService = async (data: Partial<BookingService>) => {
    if (!userId) return;
    const { error } = await supabase.from('booking_services').insert({ ...data, user_id: userId } as any);
    if (error) { toast.error('Failed to create service'); return; }
    toast.success('Service created');
    fetchAll({ withLoader: false });
  };

  const updateService = async (id: string, data: Partial<BookingService>) => {
    const { error } = await supabase.from('booking_services').update(data as any).eq('id', id);
    if (error) { toast.error('Failed to update service'); return; }
    toast.success('Service updated');
    fetchAll({ withLoader: false });
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('booking_services').delete().eq('id', id);
    if (error) { toast.error('Failed to delete service'); return; }
    toast.success('Service deleted');
    fetchAll({ withLoader: false });
  };

  // ── Staff CRUD ──
  const createStaffMember = async (data: Partial<BookingStaff>) => {
    if (!userId) return;
    const { error } = await supabase.from('booking_staff').insert({ ...data, user_id: userId } as any);
    if (error) { toast.error('Failed to create staff'); return; }
    toast.success('Staff member added');
    fetchAll({ withLoader: false });
  };

  const updateStaffMember = async (id: string, data: Partial<BookingStaff>) => {
    const { error } = await supabase.from('booking_staff').update(data as any).eq('id', id);
    if (error) { toast.error('Failed to update staff'); return; }
    toast.success('Staff updated');
    fetchAll({ withLoader: false });
  };

  const deleteStaffMember = async (id: string) => {
    const { error } = await supabase.from('booking_staff').delete().eq('id', id);
    if (error) { toast.error('Failed to delete staff'); return; }
    toast.success('Staff removed');
    fetchAll({ withLoader: false });
  };

  const assignStaffService = async (staffId: string, serviceId: string) => {
    const { error } = await supabase.from('booking_staff_services').insert({ staff_id: staffId, service_id: serviceId } as any);
    if (error && !error.message.includes('duplicate')) { toast.error('Failed to assign'); return; }
    fetchAll({ withLoader: false });
  };

  const removeStaffService = async (staffId: string, serviceId: string) => {
    const { error } = await supabase.from('booking_staff_services').delete().eq('staff_id', staffId).eq('service_id', serviceId);
    if (error) { toast.error('Failed to unassign'); return; }
    fetchAll({ withLoader: false });
  };

  // ── Availability ──
  const setAvailabilitySlot = async (data: Partial<BookingAvailability>) => {
    if (!userId) return;
    const { error } = await supabase.from('booking_availability').insert({ ...data, user_id: userId } as any);
    if (error) { toast.error('Failed to set availability'); return; }
    fetchAll({ withLoader: false });
  };

  const removeAvailabilitySlot = async (id: string) => {
    const { error } = await supabase.from('booking_availability').delete().eq('id', id);
    if (error) { toast.error('Failed to remove'); return; }
    fetchAll({ withLoader: false });
  };

  // ── Blocked dates ──
  const blockDate = async (date: string, staffId?: string, reason?: string) => {
    if (!userId) return;
    const { error } = await supabase.from('booking_blocked_dates').insert({ user_id: userId, blocked_date: date, staff_id: staffId || null, reason: reason || null } as any);
    if (error) { toast.error('Failed to block date'); return; }
    toast.success('Date blocked');
  };

  // ── Settings ──
  const saveSettings = async (data: Partial<BookingSettings>) => {
    if (!userId) return;
    if (settings) {
      // Optimistically update local state to avoid full reload flicker
      setSettings(prev => prev ? { ...prev, ...data } as BookingSettings : prev);
      const { error } = await supabase.from('booking_settings').update(data as any).eq('user_id', userId);
      if (error) { toast.error('Failed to save settings'); fetchAll({ withLoader: false }); return; }
    } else {
      const { error, data: newSettings } = await supabase.from('booking_settings').insert({ ...data, user_id: userId } as any).select().maybeSingle();
      if (error) { toast.error('Failed to create settings'); return; }
      if (newSettings) setSettings(newSettings as any);
    }
    toast.success('Settings saved');
  };

  // ── Booking actions ──
  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status } as any).eq('id', id);
    if (error) { toast.error('Failed to update booking'); return; }
    toast.success(`Booking ${status}`);
    fetchAll({ withLoader: false });
  };

  return {
    services, staff, bookings, settings, availability, loading,
    createService, updateService, deleteService,
    createStaffMember, updateStaffMember, deleteStaffMember,
    assignStaffService, removeStaffService,
    setAvailabilitySlot, removeAvailabilitySlot,
    blockDate, saveSettings, updateBookingStatus,
    refetch: fetchAll,
  };
}
