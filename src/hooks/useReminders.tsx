import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';

export interface Reminder {
  id: string;
  title: string;
  message: string;
  triggerAt: Date;
  type: 'meeting' | 'task' | 'custom';
  route?: string;
  fired?: boolean;
}

interface RemindersContextType {
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;
  clearFired: () => void;
}

const RemindersContext = createContext<RemindersContextType | null>(null);

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) {
    // Fallback for components outside provider — store in localStorage
    return {
      reminders: [] as Reminder[],
      addReminder: (reminder: Reminder) => {
        const stored = JSON.parse(localStorage.getItem('quooro-reminders') || '[]');
        stored.push({ ...reminder, triggerAt: reminder.triggerAt.toISOString() });
        localStorage.setItem('quooro-reminders', JSON.stringify(stored));
      },
      removeReminder: (id: string) => {
        const stored = JSON.parse(localStorage.getItem('quooro-reminders') || '[]');
        localStorage.setItem('quooro-reminders', JSON.stringify(stored.filter((r: any) => r.id !== id)));
      },
      clearFired: () => {},
    };
  }
  return ctx;
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `reminder-${Date.now()}`,
        requireInteraction: true,
      });
    } catch {
      // SW notification fallback for mobile
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, { body, icon: '/favicon.ico', tag: `reminder-${Date.now()}` });
        });
      }
    }
  }
}

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('quooro-reminders') || '[]');
      return stored.map((r: any) => ({ ...r, triggerAt: new Date(r.triggerAt) }));
    } catch { return []; }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('quooro-reminders', JSON.stringify(reminders.map(r => ({ ...r, triggerAt: r.triggerAt.toISOString() }))));
  }, [reminders]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Check reminders every 15 seconds — only when there are unfired reminders
  useEffect(() => {
    const hasUnfired = reminders.some(r => !r.fired);
    if (!hasUnfired) return;

    const interval = setInterval(() => {
      const now = new Date();
      setReminders(prev => {
        let changed = false;
        const updated = prev.map(r => {
          if (!r.fired && r.triggerAt <= now) {
            changed = true;
            // Fire toast notification in-app
            toast.info(r.title, {
              description: r.message,
              duration: 15000,
              action: r.route ? {
                label: 'View',
                onClick: () => window.location.hash = r.route!,
              } : undefined,
            });
            // Fire browser/push notification
            sendBrowserNotification(r.title, r.message);
            return { ...r, fired: true };
          }
          return r;
        });
        return changed ? updated : prev;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [reminders]);

  const addReminder = useCallback((reminder: Reminder) => {
    setReminders(prev => [...prev.filter(r => r.id !== reminder.id), reminder]);
    
    // Request permission if not yet granted
    requestNotificationPermission();
  }, []);

  const removeReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearFired = useCallback(() => {
    setReminders(prev => prev.filter(r => !r.fired));
  }, []);

  return (
    <RemindersContext.Provider value={{ reminders, addReminder, removeReminder, clearFired }}>
      {children}
    </RemindersContext.Provider>
  );
}
