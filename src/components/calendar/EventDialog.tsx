import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, MapPin, Link2, Palette, Clock, Type } from 'lucide-react';
import type { CalendarEvent, CreateEventData } from '@/hooks/useCalendarEvents';

const EVENT_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#6366f1', label: 'Indigo' },
];

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultDate?: Date;
  defaultHour?: number;
  defaultEndHour?: number;
  onSave: (data: CreateEventData) => void;
  onDelete?: (id: string) => void;
}

export function EventDialog({
  open, onOpenChange, event, defaultDate, defaultHour, defaultEndHour, onSave, onDelete,
}: EventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
      setIsAllDay(event.is_all_day);
      setLocation(event.location || '');
      setColor(event.color);
      setMeetingLink(event.meeting_link || '');
    } else {
      const d = defaultDate || new Date();
      const startH = defaultHour ?? 9;
      const startHour = Math.floor(startH);
      const startMin = Math.round((startH - startHour) * 60);
      const endH = defaultEndHour ?? startH + 1;
      const endHour = Math.floor(endH);
      const endMin = Math.round((endH - endHour) * 60);
      setTitle('');
      setDescription('');
      setStartDate(format(d, 'yyyy-MM-dd'));
      setStartTime(`${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`);
      setEndDate(format(d, 'yyyy-MM-dd'));
      setEndTime(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);
      setIsAllDay(false);
      setLocation('');
      setColor('#3b82f6');
      setMeetingLink('');
    }
  }, [event, defaultDate, defaultHour, defaultEndHour, open]);

  const handleSave = () => {
    if (!title.trim()) return;

    const startDateTime = isAllDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`;
    const endDateTime = isAllDay
      ? `${endDate || startDate}T23:59:59`
      : `${endDate || startDate}T${endTime}:00`;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      start_time: new Date(startDateTime).toISOString(),
      end_time: new Date(endDateTime).toISOString(),
      is_all_day: isAllDay,
      location: location.trim() || undefined,
      color,
      meeting_link: meetingLink.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Color accent bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

        <div className="p-6 pb-0">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-base font-semibold">
              {event ? 'Edit Event' : 'New Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Title */}
            <div className="flex items-center gap-3">
              <Type className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <Input
                placeholder="Add title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="text-base font-medium border-0 border-b border-border/50 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary h-auto pb-2"
                autoFocus
              />
            </div>

            {/* All day toggle */}
            <div className="flex items-center gap-3 pl-7">
              <Switch checked={isAllDay} onCheckedChange={setIsAllDay} id="all-day" />
              <Label htmlFor="all-day" className="text-sm text-muted-foreground cursor-pointer">All-day event</Label>
            </div>

            {/* Date/Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2.5" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Start</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 h-8 text-xs" />
                </div>
                {!isAllDay && (
                  <div>
                    <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Time</Label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 h-8 text-xs" />
                  </div>
                )}
                <div>
                  <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">End</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 h-8 text-xs" />
                </div>
                {!isAllDay && (
                  <div>
                    <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Time</Label>
                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 h-8 text-xs" />
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Add location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Meeting link */}
            <div className="flex items-center gap-3">
              <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Add meeting link"
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Color */}
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex gap-1.5 flex-wrap">
                {EVENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    className={`w-5 h-5 rounded-full transition-all duration-150 ${
                      color === c.value
                        ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-110'
                    }`}
                    style={{
                      backgroundColor: c.value,
                      ...(color === c.value ? { ringColor: c.value } : {}),
                    }}
                    onClick={() => setColor(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="pl-7">
              <Textarea
                placeholder="Add description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between p-4 pt-5 mt-2 border-t border-border/50">
          <div>
            {event && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                onClick={() => {
                  onDelete(event.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!title.trim()} className="h-8 text-xs shadow-sm">
              {event ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
