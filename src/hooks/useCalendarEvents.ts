import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  color: string;
  is_recurring: boolean;
  recurrence_rule: any;
  reminders: any[];
  attendees: any[];
  meeting_link: string | null;
  attachments: any[];
  calendar_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  location?: string;
  color?: string;
  is_recurring?: boolean;
  recurrence_rule?: any;
  reminders?: any[];
  attendees?: any[];
  meeting_link?: string;
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(addMonths(now, 1)),
    };
  });

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', dateRange.start.toISOString())
        .lte('start_time', dateRange.end.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents((data as CalendarEvent[]) || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: CreateEventData) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          ...eventData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setEvents(prev => [...prev, data as CalendarEvent]);
      toast.success('Event created');
      return data as CalendarEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Failed to create event');
      return null;
    }
  };

  const updateEvent = async (id: string, updates: Partial<CreateEventData>) => {
    if (!user) return;
    try {
      // Optimistic update
      setEvents(prev =>
        prev.map(e => (e.id === id ? { ...e, ...updates } : e))
      );
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Event updated');
    } catch (err) {
      console.error('Error updating event:', err);
      toast.error('Failed to update event');
      fetchEvents();
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;
    try {
      setEvents(prev => prev.filter(e => e.id !== id));
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Event deleted');
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event');
      fetchEvents();
    }
  };

  const expandDateRange = useCallback((direction: 'past' | 'future') => {
    setDateRange(prev => ({
      start: direction === 'past' ? startOfMonth(subMonths(prev.start, 2)) : prev.start,
      end: direction === 'future' ? endOfMonth(addMonths(prev.end, 2)) : prev.end,
    }));
  }, []);

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
    expandDateRange,
  };
}
